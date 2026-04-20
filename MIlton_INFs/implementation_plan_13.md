# Plano de Implementação: Notificações Push e Telegram

Este plano detalha a implementação de notificações proativas para o sistema de alertas, visando notificar os usuários mesmo quando o navegador estiver fechado (Web Push) e estendendo a funcionalidade para dispositivos móveis via Telegram.

## User Review Required

> [!IMPORTANT]
> A implementação do **Web Push Notifications** requer a geração de chaves VAPID (Voluntary Application Server Identification) que devem ser gerenciadas com segurança. Precisaremos armazenar as inscrições (subscriptions) dos navegadores dos usuários. O plano propõe salvar essas inscrições em um arquivo `subscriptions.json` (seguindo o padrão atual do projeto), mas caso a base de usuários cresça, a migração para um banco de dados (SQLite/Postgres) será necessária no futuro.

## Open Questions

> [!WARNING]
> Precisamos definir alguns pontos antes de iniciar:
> 1. **Armazenamento de Inscrições Push:** Concorda em salvar os tokens dos navegadores em um arquivo local (ex: `subscriptions.json`) para manter a simplicidade, sincronizando-o com o GitHub como fazemos com o `users_config.json`?
> 2. **Telegram Bot:** Você já criou um Bot no Telegram através do [BotFather](https://core.telegram.org/bots#how-do-i-create-a-bot) e possui o `Token` e o `Chat ID` para onde as mensagens serão enviadas, ou precisa de um passo a passo de como fazer isso?
> 3. **Frequência:** Atualmente os e-mails são enviados a cada 15 minutos se o erro persistir. Queremos manter a mesma frequência para as Notificações Push e Telegram, ou apenas alertar quando o erro surge e quando ele é resolvido?

---

## Proposed Changes

### 1. Web Push Notifications (Frontend + Backend)

Para que o PC/Celular receba notificações com o site fechado, precisaremos de um Service Worker e chaves criptográficas.

#### Backend (Python)
- **[NEW] `requirements.txt`**: Adicionar a biblioteca `pywebpush` responsável por enviar a mensagem do servidor para o Google/Apple/Mozilla, que entregará ao usuário.
- **[MODIFY] `execution/app.py`**:
  - Criar função para gerar e carregar chaves VAPID (Public e Private).
  - Criar endpoint `/api/notifications/subscribe` para receber o registro do navegador do usuário.
  - Atualizar a thread de monitoramento de pré-vendas e sincronia para, ao disparar o e-mail, também iterar sobre as inscrições salvas e disparar um `webpush`.

#### Frontend (Next.js)
- **[NEW] `frontend/public/sw.js`**: Arquivo do Service Worker que ficará rodando em segundo plano no navegador do usuário escutando o evento `push` e disparando a notificação no SO.
- **[MODIFY] `frontend/src/app/dashboard/layout.tsx` (ou componente global)**: 
  - Adicionar lógica para solicitar permissão de notificação (`Notification.requestPermission()`).
  - Registrar o Service Worker (`navigator.serviceWorker.register`).
  - Obter a `PushSubscription` e enviá-la para o novo endpoint do backend.

---

### 2. Integração com Telegram

A integração com o Telegram é muito direta e gratuita (ao contrário do WhatsApp Business API, que exige provedores pagos como Twilio/Zenvia e tem custo por mensagem).

#### Backend (Python)
- **[MODIFY] `users_config.json` ou Variáveis de Ambiente**: Adicionar campos para `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`.
- **[MODIFY] `execution/app.py`**:
  - Criar função utilitária `send_telegram_alert(mensagem)` que faz um simples `POST` para a API do Telegram (`https://api.telegram.org/bot<TOKEN>/sendMessage`).
  - Inserir a chamada a essa função dentro das threads de monitoramento (`verificar_prevendas_thread` e `verificar_sincronia_thread`), enviando um resumo do problema encontrado.

---

## Verification Plan

### Testes Manuais
1. **Permissão de Notificação:** Acessar o Dashboard no navegador, aceitar o prompt de notificações e verificar se o backend registrou a inscrição corretamente.
2. **Disparo Web Push (Simulação):** Forçar um alerta no banco de dados local ou na lógica do Python e verificar se a notificação nativa do Windows/MacOS aparece no canto da tela com o navegador minimizado ou fechado.
3. **Disparo Telegram (Simulação):** Verificar se, ao mesmo tempo da notificação Push e do E-mail, uma mensagem formatada chega no grupo/chat do Telegram configurado.
4. **Resiliência:** Garantir que o sistema não trave caso o token do Telegram esteja incorreto ou se uma inscrição Web Push de um usuário tiver expirado.
