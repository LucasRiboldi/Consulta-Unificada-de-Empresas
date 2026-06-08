# LicitCheck — Decisões de Arquitetura (ADR consolidado)

> Status: **travado para Fases 4–5.** Última revisão: 2026-06-07.

## Resumo executivo

Extensão Chrome (Manifest V3) para consulta unificada de empresas (e do sócio majoritário)
por CNPJ/CPF, voltada a pregoeiros e agentes de contratação. **100% local, sem backend.**
Distribuição pública na Chrome Web Store, código aberto (MIT).

## ADR-001 — Sem backend; modelo BYOK (Bring Your Own Key)

**Contexto.** Algumas fontes (Portal da Transparência) exigem `chave-api-dados`. Embutir uma
chave compartilhada numa extensão pública a expõe (código inspecionável).

**Decisão.** Cada usuário cadastra **sua própria chave** das fontes que exigirem credencial.
Chaves em `chrome.storage.local`, nunca em código nem repositório.

**Consequências.** ✅ Nada transmitido por nós; promessa "tudo no dispositivo" literal; custo
zero; auditável. ⚠️ Fricção: wizard guiado em `options/` com links de cadastro. Nota: a fonte
**primária de sanções (TCU Consolidada) é keyless**, então a chave é opcional e só necessária
para a consulta por **CPF do sócio majoritário** (art. 12).

## ADR-002 — SICAF via content script na sessão autenticada do usuário

**Decisão.** A extensão **não** faz login nem manipula credenciais gov.br. O usuário
autentica-se no site oficial; um content script lê o **DOM já renderizado** do SICAF e extrai
os dados de habilitação **e o quadro de sócios com CPF** exibidos na tela.

**Fronteira de segurança inegociável.** A extensão NUNCA lê/captura/armazena senha, login ou
token de sessão gov.br. Só lê dados de negócio já exibidos ao usuário.

**Riscos rastreados.** Termos de uso do Comprasnet (R-A, validar Fase 1); fragilidade de DOM
→ seletores isolados em `src/content/sicaf/selectors.ts`, versionados, com feature flag.

## ADR-006 — TCU Consolidada como fonte primária de sanções

**Decisão.** `GET certidoes-apf.apps.tcu.gov.br/api/rest/publico/certidoes/{cnpj}` (público,
sem auth — verificado) é a fonte primária, consolidando **CEIS + CNEP + TCU + CNJ/CNIA**.
Atende a Nota de substituição (alíneas b/c/d) do edital. Elimina o mock de CNJ.

**Consequências.** Reduz dependência de chave do usuário; uma chamada cobre 4 cadastros;
opcionalmente retorna a certidão PDF oficial (`?seEmitirPDF=true`) que pode ser anexada ao
relatório. Portal da Transparência (BYOK) fica como **complemento por CPF** e fallback.

## ADR-007 — Consulta do sócio majoritário (art. 12, Lei 8.429/92)

**Decisão.** Toda consulta é feita em nome da **empresa (CNPJ)** e do **sócio majoritário
(CPF)**. O sócio majoritário é identificado pelo **QSA** (BrasilAPI) ou pelo **DOM do SICAF**;
o CPF é consultado em CEIS/CNEP via Portal da Transparência (BYOK). A TCU Consolidada cobre só
PJ, por isso a consulta de PF do sócio depende da chave do usuário.

**Verificado (2026-06-07):** a BrasilAPI **mascara o CPF** do sócio (`***571038**`) e **não
expõe percentual de participação**. Consequências: (a) o QSA serve para **listar sócios e
propor um candidato** (heurística por qualificação + confirmação manual — R-E), nunca para
afirmar quem é o majoritário; (b) o **CPF completo** para a consulta de PF vem do **SICAF
autenticado** ou de **entrada manual** do usuário — nunca da BrasilAPI.

**Consequência (PII).** O sistema passa a tratar **nome e CPF de pessoa física** → ver
ADR-008 e Threat Model (A6).

## ADR-008 — Tratamento de PII (sócios e CPF)

- **Minimização:** só o sócio **majoritário** é consultado por padrão (não todos os sócios).
- **Relatório (PDF):** é o **registro oficial do processo** → inclui nome e CPF do sócio
  majoritário consultado (necessário para comprovar o cumprimento do art. 12).
- **UI / histórico:** CPF exibido **mascarado** por padrão (`***.XXX.XXX-**`), com ação
  explícita para revelar. Histórico tem botão "limpar" e política de retenção configurável.
- Nada de PII sai do dispositivo, exceto o CPF enviado **diretamente** à fonte oficial para a
  própria consulta (Portal da Transparência), sem intermediário nosso.

## ADR-003 — Camadas: SOLID pragmático, sem over-engineering

Strategy por fonte (`ConsultaProvider`); Repository só para storage (Dexie); Service Layer
fino para orquestração/agregação; DI por construtor manual (sem container).

## ADR-004 — Permissões (menor privilégio) e manifest

```jsonc
{
  "permissions": ["contextMenus", "storage", "downloads"],
  "host_permissions": [
    "https://brasilapi.com.br/*",
    "https://certidoes-apf.apps.tcu.gov.br/*",
    "https://api.portaldatransparencia.gov.br/*",
  ],
  "optional_permissions": ["scripting"],
  "optional_host_permissions": [
    "https://*.comprasnet.gov.br/*", // host do SICAF — confirmar na Fase 1
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://brasilapi.com.br https://certidoes-apf.apps.tcu.gov.br https://api.portaldatransparencia.gov.br; base-uri 'none'; form-action 'none'",
  },
}
```

- **Sem** `<all_urls>`, `tabs`, host amplo. Sem `unsafe-inline`/`unsafe-eval`.
- Menu de contexto usa `selectionText` (não exige content script para ler a seleção).
- Host do SICAF e `scripting` solicitados **em runtime** (opt-in), só ao ativar a integração.
- Cada permissão justificada em `docs/PRIVACY.md` e na descrição da Web Store.

## ADR-005 — PDF sem HTML

`pdf-lib` desenha campos programaticamente. **Nunca** montar PDF a partir de HTML/template.
Toda string passa por `security/sanitize.ts` antes de `drawText`. Nome do arquivo:
`RAZAO_SOCIAL_YYYY-MM-DD_HH-MM.pdf` (sanitizado). Pode anexar a certidão PDF oficial do TCU.

## Stack

React 19 · TypeScript · Vite · Tailwind · Shadcn UI · Zod · Zustand · pdf-lib ·
Dexie/IndexedDB · Vitest · Playwright · ESLint/Prettier/Husky/lint-staged · GitHub Actions.

## Fluxo de uma consulta

```
UI (popup/options) ──msg tipada──▶ background (service worker)
                                      │
                                      ├─▶ BrasilAPI ........ cadastro PJ + QSA → sócio majoritário
                                      ├─▶ TCU Consolidada ... CEIS+CNEP+TCU+CNJ (PJ, keyless)
                                      ├─▶ Transparência ..... CEIS/CNEP por CPF do sócio (BYOK)
                                      ├─▶ SICAF (content script) habilitação + sócios (opt-in)
                                      │
                                      ├─▶ Aggregator → resultado normalizado (Zod)
                                      ├─▶ HistoricoRepository (Dexie, CPF mascarado)
                                      └─▶ PdfService (pdf-lib) → downloads
```

## Riscos técnicos abertos (Fase 1)

| ID  | Risco                                                                                   | Ação                                                          |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| R-A | Termos de uso do SICAF/Comprasnet vs. leitura de DOM                                    | Revisão ToS antes de habilitar; feature flag desligada até lá |
| R-C | Cotas/rate-limit do Portal da Transparência e TCU Consolidada                           | Cache local + rate-limit client-side                          |
| R-E | Identificar corretamente o "sócio majoritário" pelo QSA (percentual nem sempre exposto) | Heurística + permitir seleção manual do sócio                 |
