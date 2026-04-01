# Plano de Atualizações GFC

Neste plano, detalho a implementação dos 6 pontos levantados para as próximas atualizações. Por envolver o envio de e-mails, novas configurações e bloqueios de segurança, precisamos aprovar o escopo abaixo.

## User Review Required

> [!IMPORTANT]
> **Sobre Repositórios Separados para Clientes:**
> Compreendo a necessidade de isolar validações ocultas e dados específicos de clientes. A abordagem ideal é termos um **Repositório Template (Core) Privado** no GitHub/GitLab. Quando um novo cliente entrar, você fará um "Fork" ou "Clone" do Core para um **Novo Repositório Privado dedicado ao Cliente**.
> Assim, o cliente A nunca terá acesso ao código do cliente B, e você poderá inserir regras "hardcoded" exclusivas em cada um.
> **Por favor, confirme se você já possui as contas de Git configuradas para criarmos esse padrão, ou se deseja apenas a explicação teórica de como fazer isso.**

> [!WARNING]
> **Envio de E-mail (SMTP):**
> Para que o painel envie e-mails de alerta, utilizarei a biblioteca interna do Python (`smtplib`). Isso exigirá que no painel de **Contas de E-mail** (que eu vou criar/ajustar), seja inserido o SMTP da sua provedora (ex: smtp.gmail.com, porta 587, login e senha de aplicativo). Confirma esse formato?

## Proposed Changes

---
### Frontend (UI e Segurança)

#### [MODIFY] [page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/page.tsx)
- Adição de uma verificação ao carregar a tela. Caso a API retorne que as configurações já existem, os inputs são ocultados e uma mensagem bloqueia a tela orientando o uso do painel do Administrador para reconfigurar.

#### [MODIFY] [login/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/login/page.tsx)
- Adição de um estado local `showPassword` e um ícone de "Olho" dentro do input de senha. Ao clicar, altera o tipo de `password` para `text`.

#### [MODIFY] [dashboard/layout.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/layout.tsx)
- Inserção da exibição da Controle de Versão (ex: `v1.0.0`) logo abaixo do link "Comercial Informática" no menu lateral.

---
### Frontend (Novas Telas Administrativas)

#### [NEW] [dashboard/configuracoes/alertas/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/configuracoes/alertas/page.tsx)
- Tela "Conf. Envio de Alertas".
- Campo CNPJ do Cliente.
- Campo E-mails (separados por `;`) com nota informativa (ex: "se houver mais de um, utilize o ; como separador").

#### [MODIFY] [dashboard/pre-vendas/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/pre-vendas/page.tsx) e [dashboard/sincronia/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/sincronia/page.tsx)
- Adição de um botão "Emitir Alerta" no canto superior direito.
- Ao acionar, dispara uma chamada ao backend. Se não houver e-mail configurado, exibe um Toast/Alerta avisando que é preciso configurar os e-mails de Alerta. Caso contrário, notifica o sucesso do envio.

---
### Backend e API

#### [MODIFY] [app.py](file:///c:/Users/Milton%20Prado/Documents/App-GFC/execution/app.py)
- Criação das rotas `/api/config/alertas` (GET, POST) para salvar localmente `alertas_config.json`.
- Criação das rotas `/api/config/email` (GET, POST) para salvar os dados de autenticação da sua "Conta de Email" (SMTP).
- Criação da rota `/api/monitoramento/disparar-alerta` que:
  1. Verifica qual monitoramento foi requisitado (Pré-vendas ou Sincronia)
  2. Coleta os resultados do Banco.
  3. Recupera o Remetente (SMTP) e Destinatários (E-mails Alerta).
  4. Dispara o E-mail de fato, formatando os resultados em uma tabela simples no corpo do email.

## Open Questions

1. Onde você configurará a versão que será exibida? O ideal é puxarmos do `package.json` ou definirmos uma constante no código para ser fácil de atualizar. Podemos usar algo fixo como `v1.0.0` por agora?
2. Em "Contas de Email", o formulário terá: Servidor SMTP, Porta, Email do Remetente, Senha e SSL/TLS. Está correto esse padrão?

## Verification Plan

### Manual Verification
- Acessar `http://localhost:3000/`. Confirmar que está bloqueado se já houver arquivo `config.json` definido.
- Testar o botão "olho" na tela de login.
- Acessar o App como Admin, preencher as "Contas de E-mail" e "Conf. de Alertas".
- Nas telas de Monitoramento, clicar em "Emitir Alerta" e conferir localmente o log e a caixa de entrada do e-mail.
