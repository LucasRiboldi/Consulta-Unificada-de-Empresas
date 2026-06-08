# Contribuindo com o LicitCheck

Obrigado pelo interesse! Este projeto é open source (MIT) e segue padrões corporativos
de qualidade e segurança.

## Pré-requisitos

- Node.js 20+
- npm

## Setup

```bash
git clone https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas.git
cd Consulta-Unificada-de-Empresas
npm install
```

## Fluxo de desenvolvimento

```bash
npm run dev            # Vite em modo extensão (HMR)
npm test               # testes (Vitest)
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run format         # Prettier
npm run build          # build de produção -> dist/
```

Carregue a pasta `dist/` em `chrome://extensions` (modo desenvolvedor → "Carregar sem
compactação").

## Regras

- **TDD obrigatório**: escreva o teste antes da implementação. Cobertura mínima de 80%.
- **Não inventar APIs** governamentais nem fazer scraping de sistemas protegidos.
- **Nunca** logar ou persistir CPF em claro (ver ADR-008). CPF é mascarado em repouso/UI.
- Valide toda entrada de rede/mensagem com Zod (boundaries).
- Sem `eval`, `unsafe-inline`, `dangerouslySetInnerHTML`.
- Commits no padrão Conventional Commits (`feat:`, `fix:`, `chore:`...).
- O `pre-commit` roda lint-staged (ESLint + Prettier).

## Pull Requests

1. Crie um branch a partir de `main`.
2. Garanta `lint`, `typecheck`, `test` e `build` verdes (o CI valida).
3. Descreva a mudança e referencie issues. PRs pequenas e focadas.

## Arquitetura

Veja [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md)
e [`docs/INTEGRATIONS_MATRIX.md`](docs/INTEGRATIONS_MATRIX.md).
