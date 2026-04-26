# Migração para Arquitetura Multi-Tenant (Único Repositório)

Este plano descreve as alterações necessárias para que o GFC atenda a múltiplos clientes utilizando **apenas um repositório GitHub**, gerenciando as configurações e o direcionamento de banco de dados baseado no login do usuário.

## > [!IMPORTANT] User Review Required: Conflito de Variáveis de Ambiente no Render

Você mencionou que deseja utilizar **Environment Groups** no Render para as variáveis (ex: `DB_HOST`, `VAPID_PUBLIC_KEY`, etc) mantendo os **mesmos parâmetros** para diferentes clientes.

**O Problema Arquitetural:**
Se a aplicação rodar em um **único serviço web (Web Service) no Render**, o Render não permite que você tenha a mesma variável de ambiente com valores diferentes para cada cliente (ex: não é possível ter dois `DB_HOST` em uma única instância). O Render injeta as variáveis no servidor de forma global no momento em que a aplicação inicia.

Se utilizarmos um único serviço web para atender todos os clientes (o que evita conflitos e perda de dados no GitHub já que só há 1 repositório agora), temos duas opções de solução. **Por favor, me confirme qual caminho você prefere seguir:**

1. **Opção 1: Usar prefixos nas Variáveis de Ambiente no Render**
   Em vez de `DB_HOST` e `TELEGRAM_BOT_TOKEN`, você criaria no Render com prefixos usando o "Alias" do cliente. Exemplo:
   - `CLIENTE1_DB_HOST`
   - `CLIENTE1_TELEGRAM_BOT_TOKEN`
   - `CLIENTE2_DB_HOST`
   O GFC vai identificar que o usuário pertence ao "CLIENTE1" e buscará automaticamente as variáveis que começam com `CLIENTE1_`.

2. **Opção 2: Salvar os dados (DB, Tokens, Vapid) direto no painel GFC (Sem usar Variáveis de Ambiente)**
   Como vamos criar o Menu "Cadastro de Banco de Cliente", podemos simplesmente permitir que você digite os hosts de banco, usuários, tokens do Telegram e chaves VAPID diretamente na tela, salvando tudo no arquivo `clientes_config.json` que vai para o GitHub. Assim, não precisaríamos gerenciar Variáveis de Ambiente no Render para os clientes (apenas as variáveis globais do GITHUB_TOKEN). *Aviso: dados sensíveis (senhas de banco) ficariam no JSON no repositório GitHub privado.*

3. **Opção 3: Múltiplas Instâncias no Render (1 para cada Cliente) apontando para o MESMO GitHub**
   Se o objetivo for **manter as variáveis exatamente com o mesmo nome** e ter Environment Groups diferentes no Render, você teria que criar um "Web Service" novo no Render para cada cliente, todos buscando o código do mesmo repositório GitHub.
   *Aviso crítico:* Se fizermos isso, como todas as instâncias usam o mesmo GitHub, quando o Cliente A alterar um usuário, ele enviará o JSON para o GitHub e poderá sobrescrever o do Cliente B, causando grande conflito e perda de dados, a menos que refatoremos o nome do JSON gerado para conter o nome do cliente.

## Open Questions
- Você prefere seguir com a **Opção 1** (Variáveis prefixadas), **Opção 2** (Tudo salvo via Painel no JSON) ou **Opção 3** (Múltiplas instâncias no Render gerenciando arquivos de forma isolada)?
- No disparo automático de background (cron) de alertas (Pré-vendas e Sincronia), o sistema deverá iterar sobre **todos os clientes cadastrados** na mesma rotina, disparando os alertas individuais para os respectivos canais do Telegram e e-mail de cada um?

---

## Proposed Changes

### Frontend (Interface e Menus)
- **Ocultar Menu Atual:** Ocultar a exibição do menu `Banco de Dados` na Sidebar (`layout.tsx`).
- **Novo Menu "CLIENTE":** Transformaremos a rota atual de *Cadastro de Inf Clientes* (`/dashboard/configuracoes/alertas`) para a nova tela **Cadastro de Clientes** (`/dashboard/configuracoes/clientes`).
  - Esta tela permitirá criar um Cliente (definindo o **Alias** que será usado no sistema/Render).
  - Além do Alias, incorporará as configurações de Alertas (E-mails a receber, etc) específicas daquele cliente.
- **Cadastro de Usuários (`/dashboard/configuracoes/usuarios`):**
  - Adição da coluna/campo **CLIENTE** no formulário de cadastro de usuário e na tabela.
  - O select deste campo será preenchido dinamicamente com os "Aliases" criados na tela de Clientes.
- **Requisições de Monitoramento:**
  - O frontend passará a armazenar o `cliente_alias` do usuário no LocalStorage no momento do login.
  - Ao carregar a tela de Pré-vendas ou Sincronia, o frontend enviará este `alias` para o backend para que ele consulte o banco de dados correto.

### Backend (app.py e config_manager.py)
- **Autenticação (`/api/auth/login`):**
  - Ao validar o login no `users_config.json`, o backend retornará também a qual `cliente` (Alias) esse usuário pertence.
- **Gerenciador Multi-Tenant:**
  - O `config_manager.py` será refatorado para a função `load_client_config(alias)`.
  - Baseado na Opção escolhida, ele carregará as credenciais de banco dinamicamente para aquele request.
- **Rotas de Monitoramento (`/api/monitoramento/*`):**
  - Serão alteradas para receber o parâmetro `alias`. Antes de abrir a conexão PostgreSQL, chamarão `load_client_config(alias)` para conectar no banco daquele cliente específico.
- **JSONs Consolidados:**
  - Ao invés de um `alertas_config.json` simples, ele passará a ser um `clientes_config.json` contendo uma lista de clientes, unificando o alias e as informações do cliente.
- **Disparo de Alertas e Push Notifications:**
  - A rotina automática de verificar atrasos/pré-vendas será ajustada para iterar sobre a lista de clientes, validando um por um e usando o `TELEGRAM_BOT_TOKEN` / `VAPID` correspondente àquele cliente.

---

## Verification Plan

### Manual Verification
1. **Login e Acesso Multi-Tenant:**
   - Logar como Admin, acessar as configurações e criar os Clientes "CLIENTE_A" e "CLIENTE_B".
   - Cadastrar o Usuário "UserA" vinculado a "CLIENTE_A".
   - Logar como "UserA" e verificar se o sistema consome corretamente os dados apenas do banco e credenciais configuradas para "CLIENTE_A".
2. **Configuração de Variáveis:**
   - Preencher as credenciais para múltiplos clientes simultaneamente e garantir que o monitoramento se comunique com os bancos distintos.
3. **Visibilidade do Menu:**
   - Confirmar que o menu "Banco de Dados" antigo sumiu.
   - Confirmar que "Cadastro de Inf Clientes" foi alterado para a aba unificada de "CLIENTE".
