# Listagem na Chrome Web Store — LicitCheck

Material pronto para preencher o cadastro no [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Tudo aqui é texto de apoio; o envio em si é manual e depende da conta de desenvolvedor.

## Identificação

- **Nome:** LicitCheck
- **Categoria sugerida:** Productivity (Produtividade)
- **Idioma principal:** Português (Brasil)
- **Site/Homepage:** https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas
- **Política de privacidade (URL):** https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas/blob/main/docs/PRIVACY.md

## Descrição curta (até 132 caracteres)

> Verifique a "ficha limpa" de uma empresa e do sócio majoritário para licitações — várias listas oficiais de uma vez, 100% local.

## Descrição detalhada

LicitCheck reúne, em um clique, as consultas que quem trabalha com licitações faz à mão em vários
sites do governo. Você digita o CNPJ e a extensão verifica a empresa e o sócio majoritário (art. 12)
em listas oficiais de impedimentos, mostra um resultado claro (sem pendências / pendência encontrada)
e gera um relatório em PDF pronto para anexar ao processo.

O que ela faz:

- Consulta unificada por CNPJ em fontes oficiais: Receita (BrasilAPI), Consulta Consolidada do TCU
  (CEIS, CNEP, TCU, CNJ — sem cadastro) e Portal da Transparência (CEIS/CNEP, cadastro gratuito).
- Identifica o sócio majoritário e verifica o CPF dele nas listas de sanções (art. 12 da Lei 8.429/92).
- Gera relatório em PDF com a certidão oficial do TCU anexada.
- Integração opcional com o SICAF (Comprasnet): identifica o sócio majoritário pelo percentual de
  participação e baixa os documentos oficiais (Situação do Fornecedor, Contrato Social) usando a sua
  própria sessão já autenticada — sem digitar nada.
- Histórico local, modo escuro e acessibilidade (WCAG AA).

Privacidade em primeiro lugar: **não há servidor nosso**, telemetria ou propaganda. Tudo roda no seu
navegador; as consultas vão direto do seu computador para os órgãos oficiais. Código aberto (MIT).

## Justificativa de permissões (para a revisão da Web Store)

| Permissão                                                    | Por que é necessária                                                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                    | Guardar localmente as configurações, a chave de API (BYOK) e o histórico de consultas.                                                       |
| `contextMenus`                                               | Item "Consultar empresa" ao clicar com o botão direito sobre um CNPJ selecionado.                                                            |
| `downloads`                                                  | Salvar o relatório PDF e os documentos oficiais baixados do SICAF.                                                                           |
| `host_permissions` (BrasilAPI, TCU, Portal da Transparência) | Enviar a consulta do CNPJ/CPF direto do navegador do usuário para a fonte oficial.                                                           |
| `optional_host_permissions` (`*.comprasnet.gov.br`)          | **Opcional, concedido em runtime** só se o usuário ativar o SICAF: ler os dados exibidos na sessão autenticada e baixar relatórios oficiais. |

**Uso de dados (Data Use disclosures):**

- A extensão **não coleta nem transmite** dados a servidores do desenvolvedor.
- Trata CPF/nome do sócio apenas localmente, para a finalidade legal da consulta (art. 12).
- **Não** vende dados; **não** usa para fins não relacionados à função principal; **não** faz
  determinação de crédito/empréstimo.

## Aviso sobre o SICAF (uso responsável)

A integração com o SICAF apenas **lê** dados já visíveis na sessão autenticada do próprio usuário e
**baixa** relatórios oficiais que ele mesmo poderia baixar manualmente. Não captura credenciais, não
automatiza login e pode ser desativada/revogada a qualquer momento.

## Assets necessários (a produzir antes do envio)

- Ícone da loja 128×128 (já incluso em `public/icons/icon-128.png`).
- 1 a 5 **screenshots** 1280×800 (popup com resultado, configurações, relatório PDF).
- (Opcional) tile promocional 440×280.
