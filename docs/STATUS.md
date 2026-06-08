# STATUS — Registro de continuação

> Atualizado: 2026-06-07. Use este arquivo para retomar o projeto do ponto exato.

## Onde estamos

**Fases 1–4 concluídas** (viabilidade, threat model, arquitetura, estrutura) e **Fase 5 iniciada**
com a primeira fatia de implementação (spike de de-risking) **verde**.

### Verificado e funcionando
- `npx tsc --noEmit` limpo; `npx vitest run` → **47/47 testes passando**.
- Fonte primária de sanções (**TCU Consolidada**) validada **ao vivo** + provider com schema Zod.
- Validação de CNPJ e CPF (dígito verificador) implementadas via TDD.
- **Fatia 1 (BrasilAPI):** provider de cadastro PJ + QSA e heurística de sócio majoritário.
- **Fatia 2 (Portal da Transparência):** provider CEIS+CNEP por CPF/CNPJ, BYOK (header
  `chave-api-dados`), schema fiel ao `CeisDTO`/`CnepDTO` do swagger oficial.
- **Fatia 3 (Aggregator):** `consulta.service` orquestra empresa (BrasilAPI+TCU em paralelo)
  + sócio majoritário (CPF → Transparência), com alertas (confirmação manual, art. 12,
  CPF inválido) e `temPendencia` consolidado.

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
4. [ ] Storage (Dexie) — histórico com CPF mascarado + migrations. **PRÓXIMA**
5. [ ] Build + UI — `manifest.config.ts` (Vite + CRXJS) + React popup/options (Tailwind/Shadcn).
6. [ ] PDF — `pdf-lib` sem HTML; anexar certidão oficial do TCU.
7. [ ] SICAF content script — **somente após resolver R-A (termos de uso do Comprasnet)**.
8. [ ] CI (GitHub Actions, CodeQL, Dependabot/Renovate) + docs Fase 7 (SECURITY/CONTRIBUTING/etc.).

## Riscos abertos
- **R-A** — termos de uso do SICAF/Comprasnet vs. leitura de DOM (bloqueia a fatia 7).
- **R-C** — cotas/rate-limit do Portal da Transparência e TCU Consolidada → cache + rate-limit client-side.
- **R-E** — identificação do sócio majoritário pelo QSA (percentual nem sempre exposto).

## Comandos
```bash
npm install
npm test          # vitest run
npm run typecheck # tsc --noEmit
npm run test:coverage
```
