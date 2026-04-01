# Resumo da Atualização (v1.1.0)

Todas as 6 etapas do nosso plano de implementação foram finalizadas com sucesso, e o sistema agora conta com um novo nível de gestão de segurança e emissão de alertas. 

Abaixo detalho cada mudança que está viva no sistema:

## 1. Controle de Versão (SemVer)
Adotamos a metodologia SemVer. O `package.json` foi atualizado para **v1.1.0** (pois é uma grande Minor Release com as telas de Alertas). Modifiquei a Barra Lateral (abaixo do logo da Comercial Informática) para ler essa versão automaticamente e exibir na interface de modo sutil.

> [!TIP]
> A partir de agora, quando eu atualizar o `package.json`, o painel do cliente refletirá a versão automaticamente no menu.

## 2. Olho Visível na Senha (Login)
O input de login na tela `http://localhost:3000/login` agora conta com um ícone de visualização (um "olhinho") nativo. Clicando nele, a senha revela-se ao usuário, melhorando a UX no caso de senhas complexas do Administrador ou Clientes com chaves difíceis.

## 3. Segurança na Tela de Configuração Inicial
O acesso avulso e incorreto por meio da raiz `/` (a tela de Configuração Inicial do Agente) foi bloqueado sistemicamente caso o aplicativo já tenha sido validado com o banco. 
- Ele emite uma requisição no servidor Python.
- Se já configurado (tem dados válidos de Host/Porta e afins salva criptografada), a tela troca para um alerta em vermelho de "Acesso Restrito", forçando o usuário e se desviar de bagunçar o sistema.

## 4. Novas Áreas de Email e Alertas do Administrador
Dentro do Menu de "Configurações (Admin)", criei duas novas telas com roteamento direto à API Python:
1. **Contas de E-mail:** Inserção do SMTP (Gmail), Porta, Email Disparador e a "Senha de Aplicativo". Esses dados são gravados localmente (`email_config.json`) pela API local, ofuscando a senha quando devolvida pra tela.
2. **Regras de Alertas:** Nova interface onde o usuário insere o "CNPJ Cliente" e "E-mails Destinatários (separados por `;`)". Eles criam o canal por onde passaremos recibos e alertas diários.

## 5. Rotinas em Python e `smtplib` Nativas
Criei a estrutura necessária para rotear os JSON de config com facilidade pelo arquivo `app.py`. A sacada principal foi o endpoint `/api/monitoramento/disparar-alerta`, que lê as rotinas em "Pre-vendas" e "Sincronia", traduz os dados pendentes em HTML e dispara via `smtplib` nativo usando o Google SMTP, eliminando necessidade de pacotes terceiros. O assunto já vai assinado, avisando que é um alerta automatizado do Agente GFC.

## 6. Botões "Emitir Alerta" Ativos
Nas telas de Pre-vendas e Sincronia, foram acoplados os botões "Emitir Alerta" laranjas/azuis.
Quando o Administrador/Cliente pressiona o botão:
- Ele requisita a trigger do Backend explicitando o "tipo".
- A API puxa o SMTP, monta o sumário do que está na tela, e joga pro Cliente.
- O Frontend reage imediatamente travando duplos cliques (mostra 'Enviando...') e retornando uma caixinha Toast (`Sucesso` ou `Erro`).

> [!NOTE]
> Para testar os alertas via e-mail agora, vá à aba "Configurações (Admin)", preencha o SMTP e seus emails. E experimente clicar no botão de uma das abas de Monitoramento! (Certifique-se que o E-mail tem autenticação em Duas Etapas ligada no Google pra permitir Senhas de App se for via Gmail).
