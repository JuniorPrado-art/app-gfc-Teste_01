# Plano de Implementação: Redefinição e Alteração de Senha

Este plano descreve o desenvolvimento da funcionalidade de recuperação de senha para clientes ("Esqueci minha senha") e a página de alteração de senha para clientes logados.

## User Review Required

O método de recuperação de senha sugerido aqui é o envio de uma **senha temporária** gerada aleatoriamente (ex: `GFC12345`) por e-mail. Quando o cliente receber o e-mail e fizer o login, ele poderá usar a opção "Alterar senha" na barra lateral para definir sua senha definitiva. O envio utilizará as configurações de e-mail cadastradas no sistema (`email_config.json`). Está de acordo com esse fluxo?

## Proposed Changes

### Frontend

#### [MODIFY] `frontend/src/app/login/page.tsx`
- Adicionar o link `"Esqueci minha senha"` abaixo do botão de acesso.
- Criar um estado para alternar entre o formulário de `Login` e o de `Recuperação de Senha`.
- O formulário de recuperação pedirá o **Usuário** ou **E-mail**, e chamará uma nova rota de API.

#### [NEW] `frontend/src/app/dashboard/alterar-senha/page.tsx`
- Criar a página que será aberta quando o usuário clicar no botão "Alterar senha" da barra lateral.
- O formulário pedirá: `Senha Atual`, `Nova Senha` e `Confirmar Nova Senha`.

#### [MODIFY] `frontend/src/app/dashboard/layout.tsx`
- Alterar a ação do botão `Alterar senha` para redirecionar o usuário para `/dashboard/alterar-senha`.

### Backend (`execution/app.py`)

#### [NEW ROUTE] `POST /api/auth/reset-password`
- Receber o `usuario` ou `email`.
- Buscar no `users_config.json`. Se existir, gerar uma senha temporária aleatória de 8 caracteres.
- Criptografar e salvar essa nova senha no `users_config.json`.
- Chamar uma nova função `send_password_email(email_destino, nova_senha)` para enviar a senha em texto claro por e-mail ao cliente, usando os dados do `email_config.json`.

#### [NEW ROUTE] `POST /api/auth/change-password`
- Rota para quando o usuário já está logado e quer alterar a senha atual.
- Receber `username`, `senha_atual`, `nova_senha`.
- Validar se a `senha_atual` bate com o Hash guardado.
- Caso positivo, criptografar a `nova_senha`, atualizar o `users_config.json` e sincronizar com o GitHub.

## Verification Plan

### Manual Verification
1. **Recuperação de Senha:** Acessar a tela de Login, clicar em "Esqueci minha senha", informar o usuário. O backend deve enviar um e-mail com a senha temporária e o arquivo JSON deve receber a nova hash.
2. **Login com Senha Temporária:** Efetuar login com a nova senha recebida no e-mail.
3. **Alterar Senha Logado:** No painel, clicar em "Alterar senha", digitar a senha temporária atual e a nova senha desejada. O acesso deve ser atualizado com sucesso.
4. **Validar Sincronia:** O repositório no GitHub deve ser atualizado automaticamente em cada mudança de senha.
