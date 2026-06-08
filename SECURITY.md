# Política de Segurança

## Versões suportadas

Enquanto o projeto está em desenvolvimento (0.x), apenas a versão mais recente
publicada recebe correções de segurança.

## Como reportar uma vulnerabilidade

**Não abra issue pública para vulnerabilidades.** Use o canal privado:

- GitHub → aba **Security** → **Report a vulnerability** (Private Vulnerability Reporting), ou
- e-mail para o mantenedor: lucasriboldi.dev@gmail.com

Inclua: descrição, passos de reprodução, impacto e versão afetada. Resposta inicial em
até 7 dias.

## Escopo e modelo de ameaças

A extensão é **100% local** (sem backend). Princípios:

- Não transmite consultas, CNPJs, CPFs, histórico ou PDFs para servidores dos mantenedores.
- Chaves de API do usuário (BYOK) ficam em `chrome.storage.local`, nunca no código.
- A extensão **nunca** lê credenciais gov.br; o content script SICAF lê apenas dados já
  exibidos na sessão autenticada.
- CSP estrita, sem `unsafe-inline`/`unsafe-eval`. PDFs gerados sem HTML.

O modelo de ameaças completo (STRIDE, vetores e mitigações) está em
[`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

## Dependências

`npm audit` roda no CI; atualizações via Renovate e Dependabot; análise estática via CodeQL.
