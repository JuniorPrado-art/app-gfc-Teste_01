# Progresso das Atualizações GFC

- [x] **1. Ajuste de Versão SemVer**
  - [x] Atualizar `frontend/package.json` para `1.1.0`
  - [x] Ler a versão dinâmica no `layout.tsx` e exibir abaixo do logo

- [x] **2. Criação do Olho na Senha do Login**
  - [x] Editar `frontend/src/app/login/page.tsx` para incluir estado e ícone do olho na senha

- [x] **3. Bloqueio da Tela de Configuração Inicial**
  - [x] Adicionar checagem no useEffect (`frontend/src/app/page.tsx`) alertando se já está configurado

- [x] **4. Criação das Rotas no Backend (app.py)**
  - [x] Criar `/api/config/email` e ler/salvar no arquivo JSON
  - [x] Criar `/api/config/alertas` e ler/salvar no arquivo JSON
  - [x] Criar `/api/monitoramento/disparar-alerta` com `smtplib` usando os dados de e-mail e alerta salvos

- [x] **5. Criação das Telas no Frontend (Admin)**
  - [x] Criar `frontend/src/app/dashboard/configuracoes/email/page.tsx` (SMTP, App Password do Gmail, Porta)
  - [x] Criar `frontend/src/app/dashboard/configuracoes/alertas/page.tsx` (CNPJ do Cliente e E-mails destino com separador `;`)

- [x] **6. Inserção do Botão 'Emitir Alerta' nos Monitoramentos**
  - [x] Atualizar `frontend/src/app/dashboard/pre-vendas/page.tsx`
  - [x] Atualizar `frontend/src/app/dashboard/sincronia/page.tsx`
