# Migração Multi-Tenant (Opção 2) - Checklist de Execução

- [x] **1. Atualizar Layout e Menus (Frontend)**
  - Ocultar menu "Banco de Dados".
  - Renomear menu "Cadastro de Inf Clientes" para "CLIENTES" apontando para a nova rota `/configuracoes/clientes`.

- [ ] **2. Criar Gerenciamento de Clientes (Backend)**
  - Adicionar endpoints `/api/config/clientes` (GET/POST) no `app.py` para salvar e ler `clientes_config.json`.
  - A estrutura do JSON deverá comportar: `alias`, banco de dados (host, porta, nome, usuario, senha), telegram (token, chat id), VAPID (public, private) e emails.

- [ ] **3. Criar Tela de Cadastro de Clientes (Frontend)**
  - Criar `/dashboard/configuracoes/clientes/page.tsx` substituindo a antiga tela de alertas e banco de dados.
  - Implementar listagem e formulário de adição/edição de clientes com os campos necessários.

- [ ] **4. Atualizar Cadastro de Usuários**
  - Frontend: Adicionar select de "Cliente" buscando a lista de aliases na tela de Cadastro de Usuários.
  - Frontend: Salvar o `cliente` selecionado no usuário.
  - Backend: No login, enviar o `cliente` associado ao usuário para o frontend.
  - Frontend: Salvar `gfc_cliente` no LocalStorage no login.

- [ ] **5. Adaptar as Rotas de Monitoramento (Backend e Frontend)**
  - Frontend: As telas de Pré-vendas e Sincronia devem enviar o `cliente` via query param para as APIs.
  - Backend: `get_prevendas` e `get_sincronia` devem receber o alias do cliente, buscar as credenciais do banco no `clientes_config.json` e conectar corretamente.

- [ ] **6. Adaptar Disparo de Alertas e Push Notifications**
  - Refatorar a rotina de envio (Telegram, E-mail, WebPush).
  - O backend deverá iterar sobre a lista de clientes, acessar o banco específico de cada um e, se houver alerta, disparar utilizando as configurações daquele cliente.
