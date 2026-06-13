# Política de Privacidade — LicitCheck

> Compatível com LGPD (Lei 13.709/2018) e Chrome Web Store Developer Program Policies.
> Atualizado: 2026-06-13.

## Princípio

LicitCheck é uma ferramenta **local**. **Nenhum dado seu é transmitido para servidores dos
desenvolvedores** — não existe backend, telemetria, analytics ou coleta.

## Dados pessoais tratados (importante)

Para cumprir o que os editais exigem (consulta de sanções da empresa **e do sócio majoritário**,
art. 12 da Lei 8.429/92), a ferramenta trata **dados pessoais de pessoas físicas**:
**nome e CPF de sócios**, obtidos do quadro societário (QSA) da consulta de CNPJ e/ou da tela
autenticada do SICAF.

| Dado                          | Onde fica                                 | Sai do dispositivo?                                                    |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| CNPJs consultados             | IndexedDB local                           | **Não**                                                                |
| Nome/CPF do sócio majoritário | IndexedDB local (CPF **mascarado** na UI) | **Não**, exceto o envio direto à fonte oficial para a própria consulta |
| Histórico de consultas        | IndexedDB local                           | **Não**                                                                |
| PDFs gerados                  | Downloads do usuário                      | **Não** (só onde o usuário salvar)                                     |
| Chaves de API do usuário      | `chrome.storage.local`                    | **Não** — usadas só na fonte dona da chave                             |

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

## SICAF (opcional, desativado por padrão)

A integração com o SICAF é **opcional**, vem **desligada** e só funciona depois que você a ativa
nas configurações e concede a permissão de acesso ao `*.comprasnet.gov.br`. Quando ativada:

- A extensão abre uma **aba em segundo plano** no portal Comprasnet usando a **sua sessão já
  autenticada** (gov.br), pesquisa o CNPJ e **lê apenas os dados exibidos na tela** — habilitação,
  quadro de sócios com CPF e percentual de participação, e a flag "Possui pendência".
- Ao usar "Baixar documentos do SICAF", a extensão clica nos relatórios oficiais e os PDFs são
  salvos na **pasta de Downloads do seu computador** — nada é enviado para fora.
- A extensão **nunca lê, captura ou armazena sua senha, login ou token de sessão gov.br**, e
  **nunca preenche campos de senha**.
- A permissão pode ser **revogada a qualquer momento** nas configurações (o que desliga a aba e
  o acesso ao Comprasnet).

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
- `downloads` — salvar os relatórios PDF (inclui os documentos do SICAF).
- **Host do Comprasnet** (`https://*.comprasnet.gov.br/*`, **opcional, concedido em runtime**) —
  só se você ativar a integração SICAF; permite ler os dados exibidos na sua sessão autenticada e
  baixar os relatórios oficiais. Revogável a qualquer momento.
- Hosts das fontes de consulta (BrasilAPI, TCU, Portal da Transparência) — para enviar a consulta
  direto do seu navegador ao órgão oficial.

## Contato

Repositório (open source, MIT): https://github.com/LucasRiboldi/Consulta-Unificada-de-Empresas
