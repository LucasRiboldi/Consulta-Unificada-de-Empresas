# 🔎 LicitCheck

### Verifique a "ficha limpa" de uma empresa em segundos — direto no seu navegador.

O LicitCheck é uma extensão gratuita para o Google Chrome feita para quem trabalha com
**licitações e contratações públicas**. Em vez de você abrir vários sites do governo, um por
um, para checar se uma empresa pode ou não participar de uma licitação, a extensão faz **todas
essas consultas de uma vez** e te entrega um **relatório pronto em PDF**.

> Pense nela como um “detector de pendências”: você digita o CNPJ da empresa e ela responde,
> em poucos segundos, se há alguma punição que impeça essa empresa de contratar com o poder
> público.

---

## 😩 O problema que ela resolve

Hoje, para conferir se uma empresa está apta a participar de uma licitação, é preciso visitar
**vários sites diferentes do governo**, fazer a mesma busca em cada um e juntar os resultados
na mão. Isso é demorado, cansativo e fácil de errar.

O LicitCheck junta tudo isso em **um único lugar**:

```
  ANTES                                  COM O LICITCHECK

  🌐 Abrir site 1 → buscar               ⌨️  Digitar o CNPJ uma vez
  🌐 Abrir site 2 → buscar          ➜    ⚡  A extensão consulta tudo
  🌐 Abrir site 3 → buscar               📄  Você recebe um PDF pronto
  📋 Juntar tudo na mão
```

---

## ✨ O que ela faz por você

- ⌨️ **Você digita só o CNPJ** da empresa (aquele número com 14 dígitos).
- ⚡ **Ela consulta várias listas oficiais ao mesmo tempo** e mostra o resultado na hora.
- 🚦 **Mostra um sinal claro:** “sem pendências” (verde) ou “pendência encontrada” (vermelho).
- 📄 **Gera um relatório em PDF** com tudo organizado, pronto para anexar ao processo.
- 📎 **Inclui a certidão oficial do TCU dentro do PDF:** além do resumo feito pela extensão,
  o arquivo traz, nas últimas páginas, o documento oficial emitido pelo próprio Tribunal de
  Contas da União — o mesmo que você obteria entrando no site do TCU.
- 🏛️ **Integração com o SICAF (opcional):** se você tiver acesso ao portal Comprasnet, a
  extensão pode ler diretamente da sua sessão autenticada os dados de **habilitação da empresa**
  e o **CPF completo dos sócios** — sem você precisar copiar e colar nada.
- 🕓 **Guarda um histórico** das suas últimas consultas, para você reencontrar com facilidade.
- 🖱️ **Atalho rápido:** selecione um CNPJ em qualquer página, clique com o botão direito e
  escolha **”Consultar empresa”**.
- ♿ **Acessível e confortável para os olhos:** funciona com leitores de tela, dá para usar
  só com o teclado, e se o seu computador estiver no **modo escuro**, a extensão acompanha —
  com cores verificadas automaticamente para garantir uma leitura confortável nos dois temas.

---

## 🧭 Como funciona, na prática

1. **Abra a extensão** clicando no ícone do LicitCheck no canto do navegador.
2. **Digite o CNPJ** da empresa que você quer verificar.
3. **Clique em “Consultar”** e aguarde alguns segundos.
4. **Leia o resultado** na tela e, se quiser, clique em **“Exportar PDF”** para salvar o
   relatório.

Pronto. Sem planilhas, sem copiar e colar de site em site.

---

## 📋 O que aparece no relatório

- **Nome da empresa** (razão social) e **CNPJ**.
- **Data e hora** em que a consulta foi feita.
- **Situação geral:** se há ou não pendências que impeçam a contratação.
- **Resultado de cada lista oficial** consultada.
- **Dados do sócio majoritário** (quando informado) — veja a explicação abaixo.
- **A certidão oficial do TCU em anexo**, nas páginas finais do mesmo PDF. Assim o processo
  fica com o documento "de verdade", emitido pelo órgão, e não apenas com o nosso resumo.
  Se o site do TCU estiver fora do ar na hora, o relatório é gerado normalmente, só sem o
  anexo.

O nome do arquivo já vem organizado, por exemplo:
`NOME_DA_EMPRESA_2026-06-08_14-30.pdf`.

---

## 🗂️ Quais listas oficiais ela consulta

São cadastros públicos do governo que registram empresas (e pessoas) impedidas de contratar
com a administração pública:

| Lista               | O que ela mostra, em palavras simples                                              | Cadastro |
| ------------------- | ---------------------------------------------------------------------------------- | -------- |
| **Receita Federal** | Os dados cadastrais da empresa: nome, situação e quem são os sócios.               | Não      |
| **CEIS**            | Empresas consideradas “inidôneas” ou suspensas de licitar.                         | Não      |
| **CNEP**            | Empresas que receberam punições (por exemplo, pela Lei Anticorrupção).             | Não      |
| **TCU**             | Lista de impedidos mantida pelo Tribunal de Contas da União.                       | Não      |
| **CNJ**             | Condenações por improbidade administrativa registradas pela Justiça.               | Não      |
| **Transparência**   | Sanções por CPF do sócio majoritário (art. 12) — verificação individual mais fina. | Gratuito |
| **SICAF**           | Habilitação e CPF completo dos sócios, lidos da sua sessão no Comprasnet.          | Opcional |

> 💡 As quatro listas de punições (CEIS, CNEP, TCU e CNJ) são consultadas de uma só vez, por
> uma fonte oficial que já reúne todas elas — e **sem precisar de cadastro**.

> 🏛️ A integração com o **SICAF** é opcional e só funciona quando você está logado no portal
> Comprasnet. Ela é desativada por padrão e pode ser ligada nas configurações da extensão.

---

## 👤 E o sócio majoritário?

A lei exige que, em muitos casos, a verificação seja feita **também em nome do sócio
majoritário** da empresa — não só da empresa em si.

O LicitCheck ajuda a identificar quem é esse sócio e permite verificar o nome dele nas listas
de punições. Para essa checagem específica (por CPF), pode ser necessário um **cadastro
gratuito** no Portal da Transparência, feito uma única vez nas configurações da extensão.

> Quando o sistema não tem certeza de quem é o sócio majoritário, ele **avisa você para
> confirmar manualmente** — nada é decidido “às escondidas”.

Se o SICAF estiver ativado e você estiver na página do fornecedor no Comprasnet, a extensão
preenche automaticamente o CPF do sócio — sem digitação.

---

## 🔐 Suas informações ficam só com você

Essa é uma promessa central do LicitCheck:

- ✅ **Nada do que você consulta sai do seu computador.** Não existe servidor nosso recebendo
  seus dados.
- ✅ **Nenhuma cobrança, nenhum rastreamento, nenhuma propaganda.**
- ✅ A extensão **nunca pede nem guarda sua senha** de sites do governo. A integração com o
  SICAF apenas _lê_ dados já visíveis na tela — não toca em campos de senha nem em tokens.
- ✅ Dados sensíveis, como o CPF de um sócio, aparecem **parcialmente ocultos** na tela
  (por exemplo: `***.444.777-**`).
- ✅ A permissão de acesso ao Comprasnet (SICAF) é **opcional** e pode ser revogada a qualquer
  momento nas configurações da extensão.
- ✅ Você pode **apagar todo o histórico** quando quiser, com um clique.

Em resumo: a ferramenta trabalha **dentro do seu navegador**, como uma calculadora — ela faz
as contas para você, mas não manda nada para lugar nenhum.

---

## 💰 Quanto custa

**Nada.** O LicitCheck é gratuito e de **código aberto** (qualquer pessoa pode inspecionar
como ele funciona). Isso significa transparência total sobre o que a ferramenta faz com os
seus dados — que é, justamente, mantê-los com você.

---

## ⚙️ Configurações disponíveis

Clique com o botão direito no ícone da extensão e escolha **"Opções"** para acessar:

| Configuração                                | Para que serve                                                                                                                                                 | Obrigatória? |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Chave da API do Portal da Transparência** | Habilita a consulta de sanções pelo CPF do sócio majoritário (art. 12). Cadastro gratuito e feito em minutos no site do Transparência.                         | Não          |
| **Retenção do histórico (dias)**            | Define por quanto tempo a extensão guarda suas consultas anteriores. Padrão: 180 dias.                                                                         | Não          |
| **SICAF — Habilitação e Sócios**            | Ativa a leitura de dados da sua sessão no portal Comprasnet. Ao ligar, o Chrome exibe um aviso pedindo sua confirmação. Pode ser desligado a qualquer momento. | Não          |

---

## 🚀 Como instalar

A extensão está em fase final de preparação para publicação na **Chrome Web Store**. Assim que
estiver disponível, bastará clicar em **“Adicionar ao Chrome”** — sem instalação complicada.

> Enquanto isso, desenvolvedores e testadores podem rodar a versão de desenvolvimento
> (veja a seção técnica abaixo).

---

## ❓ Perguntas frequentes

**Preciso saber mexer com computador para usar?**
Não. Se você sabe abrir um site e digitar um número, sabe usar o LicitCheck.

**Funciona offline?**
A interface é local, mas a consulta em si precisa de internet para falar com os sites oficiais.

**A extensão decide se a empresa pode ou não participar da licitação?**
Não. Ela **reúne as informações oficiais** para te ajudar a decidir. A análise final é sempre
da pessoa responsável pelo processo.

**Meus dados são vendidos ou compartilhados?**
Nunca. Não há servidor nosso, não há coleta, não há propaganda.

**Como sei que a extensão funciona mesmo?**
Além de mais de cem verificações automáticas no código, a extensão é **instalada e testada
automaticamente num navegador de verdade** a cada mudança: um robô abre a extensão, digita um
CNPJ, confere as mensagens na tela e testa a página de configurações — como um usuário faria.
A acessibilidade (leitores de tela, contraste de cores) também é verificada automaticamente
nos dois temas (claro e escuro), com zero violações detectadas.

**O que é o SICAF e preciso dele?**
O SICAF é o cadastro de fornecedores do governo federal, acessível pelo portal Comprasnet.
A integração com ele é **completamente opcional** — a extensão funciona normalmente sem ela.
Ela é útil apenas para quem já usa o Comprasnet no dia a dia e quer aproveitar os dados de
habilitação e o CPF dos sócios sem redigitar nada.

---

## 👩‍💻 Para desenvolvedores

Documentação técnica, decisões de arquitetura, modelo de segurança e instruções de build:

- [Como contribuir](CONTRIBUTING.md)
- [Política de Segurança](SECURITY.md)
- [Política de Privacidade](docs/PRIVACY.md)
- [Arquitetura](docs/ARCHITECTURE.md) · [Matriz de integrações](docs/INTEGRATIONS_MATRIX.md) · [Modelo de ameaças](docs/THREAT_MODEL.md)

Projeto open source sob licença [MIT](LICENSE).
