# STATUS — Registro de continuação

> Atualizado: 2026-07-06. Use este arquivo para retomar o projeto do ponto exato.

## Onde estamos

**Fases 1–4 concluídas** (viabilidade, threat model, arquitetura, estrutura) e **Fase 5 iniciada**
com a primeira fatia de implementação (spike de de-risking) **verde**.

### Verificado e funcionando

- `npx tsc --noEmit` limpo; `npx vitest run` → **112/112 testes passando** (cobertura ~94%); `npm run build` gera `dist/` carregável (popup + options + service worker + PDF).
- Fonte primária de sanções (**TCU Consolidada**) validada **ao vivo** + provider com schema Zod.
- Validação de CNPJ e CPF (dígito verificador) implementadas via TDD.
- **Fatia 1 (BrasilAPI):** provider de cadastro PJ + QSA e heurística de sócio majoritário.
- **Fatia 2 (Portal da Transparência):** provider CEIS+CNEP por CPF/CNPJ, BYOK (header
  `chave-api-dados`), schema fiel ao `CeisDTO`/`CnepDTO` do swagger oficial.
- **Fatia 3 (Aggregator):** `consulta.service` orquestra empresa (BrasilAPI+TCU em paralelo)
  - sócio majoritário (CPF → Transparência), com alertas (confirmação manual, art. 12,
    CPF inválido) e `temPendencia` consolidado.
- **Fatia 4 (Storage):** `historico.repository` (Dexie/IndexedDB) — save/list/search/clear/
  pruneOlderThan + `toHistoricoEntry` (CPF mascarado em repouso — `maskCpf`, ADR-008).

### ⚠️ Descoberta que afeta as próximas fatias

A BrasilAPI **mascara o CPF** do sócio (`***571038**`) e **não traz percentual**. Logo:

- Sócio majoritário não é determinável por percentual → heurística + **confirmação manual** (R-E).
- O **CPF completo** (para a consulta de PF, art. 12) vem do **SICAF autenticado** ou de
  **entrada manual** do usuário — **nunca** da BrasilAPI. Isso reordena a fatia 2.

## Decisões travadas (ver docs/ARCHITECTURE.md)

- **Sem backend**, 100% local, **BYOK** (chave do usuário). Chave é opcional: a fonte primária é keyless.
- **TCU Consolidada** (`certidoes-apf.apps.tcu.gov.br`) = CEIS+CNEP+TCU+CNJ numa chamada (ADR-006).
- Consulta também do **sócio majoritário por CPF** (art. 12, Lei 8.429/92 — ADR-007).
- **SICAF** via content script na sessão autenticada; nunca toca credenciais; atrás de feature flag.
- PII de sócios minimizada e CPF mascarado na UI (ADR-008).

## Próximas fatias (cada uma com TDD — ver test-driven-development)

1. [x] `brasilapi.provider` — cadastro PJ + QSA; heurística de sócio majoritário (R-E: seleção manual fallback). ✅
2. [x] `transparencia.provider` — CEIS/CNEP por CPF/CNPJ (BYOK) + validação de CPF. ✅
3. [x] `Aggregator`/Service — orquestra empresa (CNPJ) + sócio (CPF), resultado normalizado. ✅
4. [x] Storage (Dexie) — histórico com CPF mascarado + retenção. ✅
5. Build + UI (quebrada em sub-fatias):
   - [x] **5a** — toolchain Vite+CRXJS, `manifest.config.ts` (CSP/permissões ADR-004),
         service worker (roteador de mensagens + menu de contexto), build verificado. ✅
   - [x] **5b** — popup React (form CNPJ/CPF + validação + resultado + fontes + alertas). ✅
         view-model + cliente de mensagem (TDD) + `PopupApp` (Testing Library/jsdom). Tailwind v3.
   - [x] **5c** — options (chave BYOK, retenção, limpar histórico) + histórico no popup. ✅
         settings.store testado; `OptionsApp` + `HistoricoList` (TDD); popup salva cada consulta.
6. [x] PDF — `pdf-lib` desenhando campos (sem HTML, T-03); sanitização; nome
       `RAZAO_SOCIAL_YYYY-MM-DD_HH-MM.pdf`; botão Exportar PDF no popup. ✅
       Certidão oficial do TCU anexada ao relatório (`fetchCertidaoPdfBase64` +
       `anexarCertidaoOficial`; busca com `seEmitirPDF=true` na exportação; falha
       na emissão nunca bloqueia o download). ✅
7. [x] SICAF content script — provider + `src/content/sicaf/` (index+selectors), toggle nas ✅
       opções (feature flag), leitura dinâmica do storage, identificação autônoma do sócio
       majoritário e download de documentos (`sicaf-downloader`). Sanções CEIS/CNEP/inidôneos
       da empresa **e do sócio** integradas ao `consulta.service`/`view-model`.
       ⚠️ Habilitado atrás de flag; **R-A (termos de uso do Comprasnet) segue pendente de
       validação jurídica antes de ligar por padrão / publicar promovendo o recurso.**
8. [x] Qualidade + CI + docs Fase 7. ✅
       ESLint/Prettier/Husky/lint-staged; GitHub Actions (lint+format+typecheck+coverage+build);
       CodeQL; Dependabot (actions) + Renovate (npm); SECURITY/CONTRIBUTING/CHANGELOG/CODE_OF_CONDUCT.

## Pendências para "pronto para produção"

- [ ] **R-A** (jurídico): validação dos termos de uso do Comprasnet para ligar o SICAF por
      padrão. O código já existe atrás de feature flag (fatia 7 concluída); falta o parecer.
- [ ] Ícones reais (hoje gerados por `scripts/gen-icons.mjs`, sem identidade visual definitiva).
- [x] Suíte reconfirmada em 2026-07-06: `tsc --noEmit` limpo, **127/127 testes** (vitest),
      `npm run build` gera `dist/` carregável. Correção: 5 fixtures não tinham os campos
      obrigatórios `pendenciaSicaf`/`sancoesEmpresaTransparencia`/`sicaf` (regressão de tipo
      da feature SICAF) — ajustados. E2E Playwright não reexecutado (requer navegador/canal).
- [x] Testes E2E (Playwright) carregando a extensão num Chromium real. ✅ (2026-06-10)
      `npm run test:e2e` (4 testes: SW, popup, validação, options). Canal **msedge**:
      o Chrome de marca 137+ removeu `--load-extension` e o Chromium do Playwright
      falha nesta máquina com erro SxS (configuração lado a lado).
- [x] Acessibilidade WCAG AA e tema escuro. ✅ (2026-06-10) Auditoria automática
      axe-core (`e2e/a11y.spec.ts`): popup (inclusive estado de erro) e options,
      temas claro e escuro, **zero violações WCAG 2.x A/AA**. Contrastes do tema
      escuro corrigidos (variantes `dark:` que faltavam em PopupApp, HistoricoList
      e OptionsApp). O scan roda junto com `npm run test:e2e`.
- [x] Anexar a certidão PDF oficial do TCU ao relatório. ✅ (2026-06-10)

## Riscos abertos

- **R-A** — termos de uso do SICAF/Comprasnet vs. leitura de DOM. Fatia 7 já implementada
  atrás de feature flag; o risco segue aberto para **ligar por padrão / promover o recurso**.
- **R-C** — cotas/rate-limit do Portal da Transparência e TCU Consolidada → cache + rate-limit client-side.
- **R-E** — identificação do sócio majoritário pelo QSA (percentual nem sempre exposto).

## Comandos

```bash
npm install
npm test          # vitest run
npm run typecheck # tsc --noEmit
npm run test:coverage
npm run build && npm run test:e2e   # E2E Playwright (extensão real, canal msedge)
```
