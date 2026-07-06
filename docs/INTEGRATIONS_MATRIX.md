# Matriz de Viabilidade de Integrações (Fase 1)

> Reflete verificação de 2026-06-07. NÃO inventar APIs. NÃO fazer scraping server-side de
> sistema protegido. NÃO usar técnica que viole termos de uso.

## Contexto legal (requisito do edital)

O edital exige, para habilitação, a consulta de sanções que impeçam a participação no certame:

- **6.1.1** Documentos de Habilitação / **SICAF** + documentos complementares
- **6.1.2** CEIS — Cadastro Nacional de Empresas Inidôneas e Suspensas
- **6.1.3** CNEP — Cadastro Nacional de Empresas Punidas
- **6.1.4** Lista de Inidôneos do TCU
- **Nota:** as alíneas b/c/d **podem ser substituídas** pela **Consulta Consolidada de Pessoa
  Jurídica do TCU** (`certidoes-apf.apps.tcu.gov.br`).
- **6.2** A consulta é feita **em nome da empresa licitante E de seu sócio majoritário**
  (art. 12 da Lei 8.429/92) → o sistema **também consulta o CPF do sócio majoritário**.

## Descoberta-chave: TCU Consolidada substitui 4 fontes

`GET https://certidoes-apf.apps.tcu.gov.br/api/rest/publico/certidoes/{cnpj}`
**(verificado: público, sem autenticação)**. Resposta JSON consolida **CEIS + CNEP + TCU
inidôneos + CNJ/CNIA** numa única chamada, com `razaoSocial`, `nomeFantasia`, `cnpj`, `uf`,
`certidoes[]` (cada uma com status, ex.: `NADA_CONSTA`) e `certidaoPDF` opcional
(`?seEmitirPDF=true`).

→ É a **fonte primária de sanções** (PJ) e atende exatamente à substituição prevista na Nota
do edital. Elimina o mock de CNJ e reduz drasticamente a dependência de chave do usuário.

## Matriz

| Fonte                                   | API oficial?                                                                | Autenticação                | Permissão de uso              | Acesso         | Decisão MVP                                                          | Observações                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------- | --------------------------- | ----------------------------- | -------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Receita — CNPJ**                      | BrasilAPI `/cnpj/v1/{cnpj}` (não-oficial aberta)                            | Nenhuma                     | Aberto                        | fetch direto   | ✅ **Cliente direto**                                                | Razão social, nome fantasia, situação, **QSA (sócios — PII)**. Identifica o sócio majoritário.                                     |
| **TCU Consolidada (PJ)**                | `certidoes-apf.apps.tcu.gov.br/api/rest/publico/certidoes/{cnpj}` (oficial) | **Nenhuma** ✓ verificado    | Aberto                        | fetch direto   | ✅ **Fonte primária de sanções**                                     | Consolida CEIS+CNEP+TCU+CNJ. Atende 6.1.2/6.1.4 e a Nota de substituição.                                                          |
| **Portal da Transparência — CEIS/CNEP** | API oficial                                                                 | **Chave do usuário (BYOK)** | Aberto c/ cota                | fetch direto   | ✅ **Consulta por CPF do sócio majoritário** (art. 12) + fallback PJ | Aceita CPF de pessoa física sancionada. Cobre o requisito 6.2 que a Consolidada (só CNPJ) não cobre.                               |
| **SICAF**                               | NÃO existe API pública                                                      | gov.br (login do usuário)   | Scraping server-side proibido | content script | ⚠️ **Leitura de DOM da sessão autenticada**                          | Extrai dados de habilitação **+ sócios + CPF** exibidos na tela. Risco ToS aberto (R-A). Nunca capturar credenciais. Feature flag. |
| **CNJ — improbidade**                   | —                                                                           | —                           | —                             | —              | ✅ **Coberto pela TCU Consolidada (CNIA)**                           | Deixa de ser mock.                                                                                                                 |

## Como cada requisito do edital é atendido

| Item                      | Fonte na extensão                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------- |
| 6.1.1 SICAF + habilitação | Content script SICAF (sessão do usuário)                                            |
| 6.1.2 CEIS                | TCU Consolidada (PJ) + Portal Transparência (CPF do sócio)                          |
| 6.1.3 CNEP                | TCU Consolidada (PJ) + Portal Transparência (CPF do sócio)                          |
| 6.1.4 TCU inidôneos       | TCU Consolidada                                                                     |
| 6.2 Sócio majoritário     | QSA da BrasilAPI/SICAF identifica o sócio → consulta CPF no Portal da Transparência |

## Checklist por integração (Fase 1)

Para cada fonte, antes de implementar:

1. [x] API pública oficial? (TCU Consolidada: sim, verificado. BrasilAPI: sim.)
2. [x] Autenticação (TCU Consolidada: nenhuma; Transparência: chave do usuário).
3. [ ] Restrições legais / termos de uso (SICAF/Comprasnet — **R-A, validar**).
4. [ ] Limites de CORS (irrelevante no service worker com host_permissions).
5. [ ] Limites de uso / cota (Transparência e TCU Consolidada — medir; aplicar cache + rate-limit).

## Providers (`src/providers/`)

- `brasilapi.provider.ts` — dados cadastrais + QSA (identifica sócio majoritário).
- `tcu-consolidada.provider.ts` — **primária** de sanções (PJ).
- `transparencia.provider.ts` — CEIS/CNEP por **CPF** do sócio majoritário (BYOK) + fallback PJ.
- `sicaf.provider.ts` — coordena com `src/content/sicaf/` (content script + selectors).
- `provider.types.ts` — interface `ConsultaProvider` (sujeito PJ ou PF).
