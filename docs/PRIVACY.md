# Política de Privacidade — LicitCheck

> Compatível com LGPD (Lei 13.709/2018) e Chrome Web Store Developer Program Policies.
> Versão de trabalho — revisar antes da publicação. Atualizado: 2026-06-07.

## Princípio

LicitCheck é uma ferramenta **local**. **Nenhum dado seu é transmitido para servidores dos
desenvolvedores** — não existe backend, telemetria, analytics ou coleta.

## Dados pessoais tratados (importante)

Para cumprir o que os editais exigem (consulta de sanções da empresa **e do sócio majoritário**,
art. 12 da Lei 8.429/92), a ferramenta trata **dados pessoais de pessoas físicas**:
**nome e CPF de sócios**, obtidos do quadro societário (QSA) da consulta de CNPJ e/ou da tela
autenticada do SICAF.

| Dado | Onde fica | Sai do dispositivo? |
|------|-----------|---------------------|
| CNPJs consultados | IndexedDB local | **Não** |
| Nome/CPF do sócio majoritário | IndexedDB local (CPF **mascarado** na UI) | **Não**, exceto o envio direto à fonte oficial para a própria consulta |
| Histórico de consultas | IndexedDB local | **Não** |
| PDFs gerados | Downloads do usuário | **Não** (só onde o usuário salvar) |
| Chaves de API do usuário | `chrome.storage.local` | **Não** — usadas só na fonte dona da chave |

### Minimização

- Por padrão, apenas o **sócio majoritário** é consultado (não todos os sócios).
- O CPF é exibido **mascarado** (`***.XXX.XXX-**`) na interface e no histórico; só aparece em
  claro no **relatório PDF**, que é o registro oficial do processo licitatório.
- Você pode **limpar o histórico** a qualquer momento e definir **prazo de retenção** nas
  configurações.

## Comunicação com terceiros (fontes oficiais)

Ao consultar, a extensão envia o **CNPJ** (e, quando aplicável, o **CPF** do sócio majoritário)
diretamente, do seu navegador, para a fonte oficial escolhida — BrasilAPI, Consulta Consolidada
do TCU (`certidoes-apf.apps.tcu.gov.br`) e/ou Portal da Transparência. Ocorre **direto entre o
seu navegador e o órgão**, sem intermediário nosso. O tratamento pelas fontes segue as políticas
de cada órgão.

## SICAF

A integração SICAF lê **apenas os dados já exibidos na tela** após você se autenticar no site
oficial do governo (incluindo dados de habilitação e o quadro de sócios com CPF). A extensão
**nunca lê, captura ou armazena sua senha, login ou token de sessão gov.br**.

## Base legal (LGPD)

- Dados de **pessoa jurídica** e registros **públicos** de transparência: cumprimento de
  obrigação legal e exercício regular de direito no processo administrativo de licitação.
- **CPF/nome do sócio majoritário:** tratamento necessário ao **cumprimento de obrigação legal**
  (art. 12 da Lei 8.429/92 e exigências do edital), limitado à finalidade de instrução do certame.

## Seus direitos

Todos os dados ficam no seu dispositivo; você os controla integralmente. Pode apagar histórico
e chaves na tela de configurações, ou removendo a extensão.

## Permissões solicitadas (e por quê)

- `contextMenus` — menu "Consultar empresa" ao selecionar um CNPJ.
- `storage` — guardar configurações e chaves localmente.
- `downloads` — salvar os relatórios PDF.
- `scripting` + host do SICAF (**opcional, em runtime**) — só se você ativar a integração SICAF;
  para ler os dados exibidos na sua sessão autenticada.

## Contato

Repositório (open source, MIT): https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas
