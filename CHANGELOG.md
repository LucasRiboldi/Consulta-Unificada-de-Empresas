# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-06-13

### Adicionado

- **SICAF autônomo (opcional):** a extensão abre uma aba em segundo plano no Comprasnet
  (sessão gov.br do usuário), pesquisa o CNPJ e identifica o **sócio majoritário pelo maior
  percentual de participação** — alimentando automaticamente a consulta do art. 12, sem digitação.
- **Download de documentos do SICAF:** baixa os relatórios da Situação do Fornecedor e o
  Contrato Social (Nível II), pulando relatórios sem dados (pacing via `chrome.downloads`).
- **CEIS/CNEP/inidôneos da empresa e do sócio:** empresa também consultada no Portal da
  Transparência (CEIS/CNEP detalhado, com chave) além da Consolidada do TCU; sócio majoritário
  com sinal keyless de pendência via flag "Possui pendência" do SICAF.
- Providers de consulta: TCU Consulta Consolidada (CEIS/CNEP/TCU/CNJ, keyless),
  Receita via BrasilAPI (cadastro + QSA) e Portal da Transparência (CEIS/CNEP por CPF/CNPJ, BYOK).
- Orquestrador de consulta unificada com identificação do sócio majoritário (art. 12, Lei 8.429/92).
- Validação de CNPJ e CPF (dígito verificador).
- Histórico local (Dexie/IndexedDB) com CPF mascarado em repouso e política de retenção.
- Popup React (consulta, resultado, fontes, alertas, exportar PDF) e página de configurações (BYOK).
- Relatório em PDF gerado com pdf-lib (sem HTML), nome `RAZAO_SOCIAL_YYYY-MM-DD_HH-MM.pdf`.
- Empacotamento Manifest V3 (Vite + CRXJS) com CSP estrita e menor privilégio.
- Qualidade e CI: ESLint, Prettier, Husky, lint-staged, GitHub Actions, CodeQL, Dependabot, Renovate.
- Documentação: arquitetura, threat model, matriz de integrações, política de privacidade.
- Certidão oficial do TCU (PDF emitido pela Consulta Consolidada com `seEmitirPDF=true`)
  anexada às páginas finais do relatório exportado; falhas na emissão não impedem a exportação.
- Auditoria automática de acessibilidade (axe-core via Playwright): popup e options, temas
  claro e escuro, zero violações WCAG 2.x A/AA; contrastes do tema escuro corrigidos.
- Testes E2E (Playwright) carregando a extensão MV3 num navegador real (canal Edge, headless):
  registro do service worker, popup (formulário e validação de CNPJ) e options (persistência
  em `chrome.storage`). Script `npm run test:e2e` (requer `npm run build` antes).

[0.1.0]: https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas/releases/tag/v0.1.0
