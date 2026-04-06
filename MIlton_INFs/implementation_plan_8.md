# Ajustes solicitados: CNPJ e Validação de Alertas

Este plano abrange as correções e melhorias identificadas em duas grandes áreas críticas: **Cadastro de Inf Clientes (CNPJ)** e o **Manejo de Alertas / E-mails**.

## User Review Required

> [!WARNING]
> **Por que os e-mails não chegam atualmente?**
> A thread que envia e-mails em segundo plano (a cada 15 min) tenta iniciar sem checar se as configurações de E-mail (SMTP) ou de Destinatários estão preenchidas corretamente. Se elas não existirem ou estiverem com erro, ela "engasga" silenciosamente e falha. 
> 
> Com a nova atualização, o botão de "Criar Alerta" verificará fisicamente a existência dos destintários antes de iniciar! E também previ que sua digitação de múltiplos e-mails será mais flexível (aceitando vírgula ou ponto e vírgula).

## Proposed Changes

---

### Frontend

#### [MODIFY] [frontend/src/app/dashboard/configuracoes/alertas/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/configuracoes/alertas/page.tsx)
*   **Adicionar Máscara:** Implementar lógica no evento `onChange` que formate automaticamente o campo `cnpj` para o modelo padrão (00.000.000/0000-00).
*   **Validação Real:** Integrar um algoritmo matemático que recusa salvar se os dois últimos dígitos do CNPJ não forem válidos, emitindo uma mensagem de erro na tela ao invés de aceitar cadastros inválidos ou corrompidos.
*   **Tratamento de Input de E-mail:** Limpar espaços indevidos que o usuário possa colar sem querer na caixa de e-mails.

---

### Backend

#### [MODIFY] [execution/app.py](file:///c:/Users/Milton%20Prado/Documents/App-GFC/execution/app.py)
*   **Validação Prévia na Inicialização do Alerta (`toggle_rotina`):** 
    Antes de deixar o botão ficar vermelho/ativo (iniciando a Thread), o sistema fará a leitura local. Se não houver e-mail de destino no `ALERTAS_CONFIG_FILE` ou se o Servidor de Disparo (`EMAIL_CONFIG_FILE`) não estiver setado, ele travará a requisição devolvendo: `"Configure primeiro o Destinatário e o E-mail Base no menu Configurações."`
*   **Correção do Parser de E-mails:**
    Quando o disparo processar destinos, ele permitirá que os usuários errem a digitação dividindo por uma simples vírgula (`,`) E também pelo padrão (`;`), resolvendo problemas de e-mails aglutinados que fazem o envio ser abandonado pelo Servidor de SMTP.

## Open Questions

> [!IMPORTANT]
> - Você notou se o servidor retorna alguma mensagem extra de "Bloqueio" originada pelo seu e-mail (por exemplo, Gmail exigindo "Senha de Aplicativo")?
> - Tudo ok para começarmos as modificações conforme especificado?

## Verification Plan

### Testes Manuais
1. **CNPJ:** Entrar em *Inf Clientes*, digitar CNPJs falsos e CNPJs válidos, verificando o bloqueio e a máscara viva acontecendo no form.
2. **Envio de Alerta:** Entrar em *Pré-vendas*, deletar meus contatos de Inf Cliente e tentar iniciar o "Criar Alerta" esperando a recusa limpa. Em seguida, cadastrar um endereço válido e observar ele iniciar, além de olhar os logs para verificar o disparo efetivo.
