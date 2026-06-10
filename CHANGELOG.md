# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

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

[Não lançado]: https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas/commits/main
