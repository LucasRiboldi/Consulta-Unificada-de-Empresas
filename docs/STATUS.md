# STATUS — Registro de continuação

> Atualizado: 2026-06-07. Use este arquivo para retomar o projeto do ponto exato.

## Onde estamos

**Fases 1–4 concluídas** (viabilidade, threat model, arquitetura, estrutura) e **Fase 5 iniciada**
com a primeira fatia de implementação (spike de de-risking) **verde**.

### Verificado e funcionando
- `npm install` ok; `npx tsc --noEmit` limpo; `npx vitest run` → **13/13 testes passando**.
- Fonte primária de sanções (**TCU Consolidada**) validada **ao vivo** + provider com schema Zod.
- Validação de CNPJ (dígito verificador) implementada via TDD.

## Decisões travadas (ver docs/ARCHITECTURE.md)
- **Sem backend**, 100% local, **BYOK** (chave do usuário). Chave é opcional: a fonte primária é keyless.
- **TCU Consolidada** (`certidoes-apf.apps.tcu.gov.br`) = CEIS+CNEP+TCU+CNJ numa chamada (ADR-006).
- Consulta também do **sócio majoritário por CPF** (art. 12, Lei 8.429/92 — ADR-007).
- **SICAF** via content script na sessão autenticada; nunca toca credenciais; atrás de feature flag.
- PII de sócios minimizada e CPF mascarado na UI (ADR-008).

## Próximas fatias (cada uma com TDD — ver test-driven-development)
1. [ ] `brasilapi.provider` — cadastro PJ + QSA; heurística de sócio majoritário (R-E: seleção manual fallback).
2. [ ] `transparencia.provider` — CEIS/CNEP por CPF do sócio (BYOK) + validação de CPF.
3. [ ] `Aggregator`/Service — orquestra empresa (CNPJ) + sócio (CPF), resultado normalizado.
4. [ ] Storage (Dexie) — histórico com CPF mascarado + migrations.
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
