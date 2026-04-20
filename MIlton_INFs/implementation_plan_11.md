# Alterações no Sistema de Login, Criptografia e Configurações

O objetivo deste plano é atender aos novos requisitos do sistema: atualizar um texto na tela principal, remover a autenticação de clientes via PostgreSQL, implementar um novo gerenciador de usuários locais para clientes e criptografar as credenciais do Administrador no código-fonte.

## User Review Required

Nenhuma alteração com impacto destrutivo. Os usuários de cliente deverão ser recadastrados na nova interface após a atualização, visto que a conexão do PostgreSQL não será mais usada para validar os acessos dos clientes.

## Open Questions

- Como os usuários não terão mais seus acessos pelo PostgreSQL, será necessário criar os acessos novamente nesta nova tela para que eles consigam acessar o dashboard. O reset de senha por email não será coberto nesta etapa imediatamente (pois exigiria a criação da tela "Esqueci minha senha" no Login), mas o e-mail já ficará salvo no banco local (JSON) e criptografado com as demais informações. Está de acordo em implementarmos o reset em uma etapa futura? (Por agora, o Admin pode resetar a senha alterando-a na tela de configurações).

## Proposed Changes

### Frontend

#### [MODIFY] `frontend/src/app/dashboard/page.tsx`
- Alterar o texto do card de `Chamados Abertos Hoje` para `Chamados Abertos`.

#### [MODIFY] `frontend/src/app/dashboard/layout.tsx`
- Adicionar o menu `Cadastro de Usuário de Cliente` na aba de `Configurações (Admin)`, localizado abaixo do botão `Cadastro de Inf Clientes`.

#### [NEW] `frontend/src/app/dashboard/configuracoes/usuarios/page.tsx`
- Criar a interface de CRUD (Listagem, Criação e Edição) de usuários clientes locais.
- Formulário com os campos: `Usuário`, `E-mail` e `Senha` (com máscara e lógica para não exibir a hash).

### Backend

#### [MODIFY] `execution/app.py`
- **Importação:** Adicionar suporte nativo à segurança usando `werkzeug.security` (`check_password_hash`, `generate_password_hash`).
- **Autenticação Admin:** Substituir a validação em texto plano `username == "AppComercial"` e `password == "..."` por validação baseada em Hash (criptografada). Assim, os dados do Admin não estarão mais legíveis no código-fonte.
- **Autenticação Cliente:** Remover por completo o bloco de código que efetua o login fazendo query no banco PostgreSQL. Em vez disso, carregar o arquivo local `users_config.json` e iterar procurando o usuário; se encontrado, checar a hash da senha.
- **Novas Rotas de Configuração de Usuários:**
  - `GET /api/config/usuarios`: Ler o arquivo `users_config.json` e retornar a lista de usuários configurados com a senha ofuscada (ex: `********`).
  - `POST /api/config/usuarios`: Receber uma nova listagem de usuários. Se a senha recebida for `********`, manter a hash anterior. Caso seja uma nova, usar o `generate_password_hash`. Salvar no `users_config.json`.
- **Sincronia GitHub:** Incluir o novo arquivo `users_config.json` para ser salvo e sincronizado junto com os demais, usando `sync_file_to_github`.

## Verification Plan

### Manual Verification
- Validar se a tela inicial reflete "Chamados Abertos".
- Validar que as credenciais do admin estão como hashes no arquivo `app.py`.
- Fazer login com o usuário Admin e validar se o acesso continua funcionando normalmente.
- Navegar para `Configurações (Admin) -> Cadastro de Usuário de Cliente`.
- Adicionar um novo usuário cliente, salvar.
- Tentar realizar login como este novo usuário.
- Acessar novamente como Admin e editar a senha/email do usuário. Validar se o login aceita a nova senha.
- Validar se a senha gerada está em formato hash e não exposta.
