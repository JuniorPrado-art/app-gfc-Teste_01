# Estrutura do Projeto App-GFC (Multi-Tenant)

Este documento descreve a organização das pastas e a função dos principais arquivos que compõem o sistema GFC. Esta estrutura visa facilitar a manutenção, colaboração e entendimento da arquitetura dividida entre Frontend (Painel Visual) e Backend (Motor de Conexão e Alertas).

---

## 📁 `execution/` (Backend - Python)
Esta pasta contém o "motor" da aplicação. Responsável por rodar o servidor, conectar nos bancos de dados dos clientes de forma segura e disparar os alertas em segundo plano.

- **`app.py`**
  O arquivo principal do servidor. Contém todas as rotas (URLs) de API consumidas pelo painel visual, como Login, Busca de Pré-vendas e Sincronia. Também contém a lógica do **Motor de Alertas (`AlertManager`)** que roda continuamente em segundo plano disparando mensagens para Telegram, WebPush e E-mail.
  
- **`config_manager.py`**
  O gerenciador de configurações. Sua função é ler os arquivos JSON, isolar os dados confidenciais e injetar as credenciais exclusivas do cliente que estiver acessando o sistema. Garante que os dados do Cliente A não se misturem com o do Cliente B.

- **`clientes_config.json`**
  O "Cofre" dos clientes. Armazena as credenciais de banco de dados (Host, Porta, Senha), listas de e-mails, tokens de bots do Telegram e as chaves de notificação Push para cada cliente cadastrado.

- **`users_config.json`**
  O arquivo de Usuários. Define os logins e senhas (criptografadas) dos operadores e vincula cada usuário ao seu respectivo Cliente (Posto).

- **`email_config.json`**
  As credenciais globais de SMTP. Define a conta de e-mail raiz da aplicação GFC, que será usada como "Remetente" quando o sistema precisar mandar redefinições de senha ou alertas.

- **`alert_state.json`**
  Arquivo de memória volátil. Salva o estado atual (Ligado/Desligado) de cada alerta de cada cliente. Se a aplicação cair ou o servidor reiniciar, ele religa os alertas baseando-se neste arquivo.

- **`requirements.txt`**
  A lista de bibliotecas (dependências) de Python necessárias para rodar o backend (ex: `flask`, `psycopg2`, `pywebpush`).

---

## 📁 `frontend/` (Frontend - React / Next.js)
Esta pasta contém toda a interface visual (O Painel do GFC) com a qual os usuários interagem diretamente.

### 📁 `frontend/src/app/`
Diretório principal onde ficam as páginas do sistema. Cada pasta representa uma "URL" do site.

- **`layout.tsx`**
  O "Chassi" do site. Define a barra de menu lateral (Sidebar) e o cabeçalho. Todos os componentes aqui são comuns em todas as páginas. É aqui que ocorre a verificação de segurança (se o usuário tem permissão para estar logado) e a inscrição nativa no **WebPush** (Service Worker) para exibir notificações do sistema operacional.

- **`page.tsx`** (Na raiz de `/app`)
  A página inicial ou redirecionador que envia o usuário deslogado para o `/login` ou o logado para o `/dashboard`.

### 📁 `frontend/src/app/dashboard/`
As páginas internas do painel de controle do usuário autenticado.

- **`page.tsx`** (Visão Geral)
  A tela de início do painel administrativo. Possui a inteligência de "Polling" (tentativas automáticas a cada 15 segundos) para buscar e contabilizar o volume de Pré-vendas travadas e Postos atrasados.

- **`sincronia/page.tsx`**
  Tela dedicada ao Monitoramento de Sincronia de caixas. Possui a tabela detalhada com o cálculo de atraso e o controle manual para Ativar/Desativar os robôs de notificação (Telegram/Email).

- **`pre-vendas/page.tsx`**
  Tela dedicada às Pré-Vendas pendentes. Agrupa visualmente na tabela os orçamentos que ficaram "esquecidos" no banco e permite ligar os robôs de alerta.

### 📁 `frontend/src/app/dashboard/configuracoes/`
Painel Administrativo restrito a usuários com privilégios.

- **`clientes/page.tsx`**
  Formulário central do sistema Multi-Tenant para adicionar, editar ou remover novos Clientes (Postos/Empresas) e os dados criptografados dos seus respectivos bancos de dados PostgreSQL e chaves de bot.

- **`usuarios/page.tsx`**
  Gestor de contas do painel. Associa operadores humanos a um cliente cadastrado no sistema.

- **`telas/page.tsx`**
  Controle de Acesso / Visibilidade. Define, através de botões interruptores, quais abas do menu esquerdo aparecerão para os usuários finais.

### 📁 `frontend/public/`
Arquivos estáticos e vitais para o comportamento no navegador.

- **`sw.js`** *(Service Worker)*
  Um pequeno script em JavaScript que fica rodando isolado do site, sendo a ponte essencial que permite ao sistema operacional (Windows/Android/iOS) receber as notificações WebPush mesmo que o usuário tenha fechado a guia do painel.

- **`manifest.json`**
  Arquivo de PWA (Progressive Web App). Define o nome, o ícone e o comportamento do aplicativo caso o usuário decida "Instalar" o GFC como um aplicativo local no celular ou desktop.

---

## 📁 Raiz do Projeto
Arquivos base da estrutura do repositório no GitHub.

- **`.gitignore`**
  Lista quais arquivos locais (como ambientes virtuais `venv` ou senhas de ambiente `node_modules`) o Git deve ignorar e nunca jogar no repositório público/privado.

- **`README.md`** *(Recomendado)*
  Um manual de instruções geral na página frontal do GitHub que pode ser lido pelos programadores novos (como as instruções de como instalar e testar o app em suas máquinas pela primeira vez).
