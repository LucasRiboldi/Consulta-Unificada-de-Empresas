# LicitCheck

> Consulta unificada de empresas por CNPJ para instrução de processos licitatórios.
> Extensão Chrome (Manifest V3), **100% local**, open source (MIT).

[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-success)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## O que é

Ferramenta para **pregoeiros, agentes de contratação e servidores públicos** consultarem a
empresa licitante **e seu sócio majoritário** (art. 12 da Lei 8.429/92) em fontes oficiais,
gerando **relatórios PDF** para instruir processos licitatórios.

- 🔒 **Privacidade total** — nenhum dado sai do seu dispositivo. Sem backend, sem telemetria.
- 🔑 **BYOK** — chave de API opcional, só para a consulta por CPF do sócio (a fonte primária é keyless).
- 📄 **PDF profissional** — razão social, CNPJ, sócio majoritário, data/hora e resultados.
- 🌓 Tema claro/escuro, acessibilidade WCAG AA.

## Fontes consultadas

| Fonte                                                | Tipo                              | Status                       |
| ---------------------------------------------------- | --------------------------------- | ---------------------------- |
| Receita Federal (CNPJ + QSA) via BrasilAPI           | Pública                           | ✅                           |
| **TCU Consulta Consolidada** (CEIS+CNEP+TCU+CNJ)     | Pública, sem chave                | ✅ Fonte primária de sanções |
| CEIS/CNEP por CPF do sócio (Portal da Transparência) | Chave do usuário                  | ✅                           |
| SICAF (habilitação + sócios)                         | Leitura da sua sessão autenticada | ⚠️ Sob feature flag          |

> A integração SICAF lê **apenas dados já exibidos** após você se autenticar no site oficial.
> A extensão **nunca** acessa sua senha ou credenciais gov.br. Trata **nome e CPF de sócios**
> (PII) com minimização e mascaramento — ver [docs/PRIVACY.md](docs/PRIVACY.md).

## Documentação de projeto

- [Arquitetura e ADRs](docs/ARCHITECTURE.md)
- [Matriz de integrações (Fase 1)](docs/INTEGRATIONS_MATRIX.md)
- [Threat Model (Fase 2)](docs/THREAT_MODEL.md)
- [Política de Privacidade](docs/PRIVACY.md)

## Stack

React 19 · TypeScript · Vite · Tailwind · Shadcn UI · Zod · Zustand · pdf-lib · Dexie · Vitest · Playwright

## Status

🚧 Em desenvolvimento — Fases 1–4 (viabilidade, threat model, arquitetura, estrutura) concluídas.
Implementação (Fase 5) a seguir.

## Licença

MIT — ver [LICENSE](LICENSE).
