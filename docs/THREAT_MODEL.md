# Threat Model — LicitCheck (Fase 2)

> STRIDE adaptado a extensão Chrome MV3, local-only, BYOK. Revisão: 2026-06-07.

## Ativos a proteger

- A1 — Chaves de API do usuário (`chrome.storage.local`).
- A2 — Histórico local de consultas (IndexedDB).
- A3 — Integridade dos PDFs gerados (instruem processo licitatório).
- A4 — Sessão gov.br do usuário (a extensão NUNCA a manipula).
- A5 — A própria extensão (cadeia de build/dependências).
- **A6 — PII de pessoas físicas: nome e CPF de sócios** (do QSA da BrasilAPI e do DOM do SICAF).

## Vetores, mitigações e riscos

| ID | Vetor | Descrição | Mitigação | Status |
|----|-------|-----------|-----------|--------|
| T-01 | **XSS** | Dado de API com `<script>` na UI | React escapa; proibir `dangerouslySetInnerHTML`; CSP sem `unsafe-inline` (ver ADR-004) | Mitigado |
| T-02 | **DOM Injection** | Conteúdo malicioso via resposta | Validação Zod; render só de tipos validados | Mitigado |
| T-03 | **PDF Injection** | String maliciosa forja/quebra o PDF | `pdf-lib` desenha campos (sem HTML); sanitize antes de `drawText`; limitar tamanho/charset | Mitigado |
| T-04 | **Injection no nome de arquivo** | Razão social com caracteres de path | Sanitizar → `[A-Z0-9_\-]`; remover `/ \ .. : *` | Mitigado |
| T-05 | **Supply Chain / Dependency Hijacking** | Dependência comprometida exfiltra chave/PII | `package-lock` fixado; Dependabot + Renovate; CodeQL; `npm audit` no CI; minimizar deps; CSP `connect-src` allowlist bloqueia exfiltração | Mitigado |
| T-06 | **Data Leakage** | Vazamento de CNPJ/CPF/histórico | Sem backend/telemetria; CSP `connect-src` só hosts oficiais declarados | Mitigado |
| T-07 | **Respostas maliciosas** | API/DOM retorna payload inesperado/grande | Zod + limites de tamanho + timeout + erro tipado | Mitigado |
| T-08 | **CNPJ/CPF falso ou inválido** | Input forjado/inválido | Validar máscara + dígito verificador (CNPJ e CPF) antes de qualquer fetch | Mitigado |
| T-09 | **Clickjacking** | UI embutida/enganada | UI roda em contexto de extensão (não embutível); sem iframes de terceiros | Baixo |
| T-10 | **Privilege Escalation** | Permissões além do necessário | Menor privilégio (ADR-004); host SICAF + `scripting` opcionais em runtime | Mitigado |
| T-11 | **Roubo de chave de API** | Exfiltração da chave | Isolamento de extensão; nunca logar chave; chave só vai ao host dono dela; principal vetor é T-05 (deps) → mesma mitigação | Mitigado |
| T-12 | **Captura de credencial gov.br** | Content script lê senha do SICAF | **Proibido por design**: seletores extraem só dados de negócio; code review obriga ausência de leitura de campos de credencial | Controle de design |
| **T-13** | **Vazamento/uso indevido de PII de sócios (A6)** | Nome/CPF de PF exposto, logado ou retido além do necessário | **Minimização** (só sócio majoritário); **CPF mascarado** na UI/histórico; CPF em claro só no PDF oficial; nunca logar CPF; retenção configurável + "limpar histórico" | Mitigado |
| **T-14** | **CPF/sócio incorreto** | Erro ao identificar o sócio majoritário → consulta a pessoa errada | Heurística do QSA + **confirmação/seleção manual** do sócio antes de consultar (R-E) | Mitigado |

## Riscos conhecidos e limitações (declarados)

- **R-A (aberto):** leitura de DOM do SICAF — validar termos de uso do Comprasnet; até lá,
  fonte atrás de feature flag desligada.
- **L-1:** integração SICAF quebra se o HTML mudar → exige atualização/republicação.
- **L-2 (resolvido):** CNJ agora coberto pela TCU Consolidada (CNIA) — não é mais mock.
- **L-3:** chaves em `storage.local` não são criptografadas em repouso; modelo assume
  dispositivo do usuário confiável (chaves e PII são do próprio usuário/processo).
- **L-4:** percentual societário nem sempre exposto no QSA → "sócio majoritário" pode exigir
  seleção manual (R-E / T-14).

## Limites de segurança (boundaries)

1. Extensão ↔ gov.br: **somente leitura de DOM renderizado**; zero credenciais.
2. Extensão ↔ APIs: só hosts declarados (`connect-src`); chave/CPF só vão ao host da consulta.
3. Nada sai para servidores nossos (não existem).
