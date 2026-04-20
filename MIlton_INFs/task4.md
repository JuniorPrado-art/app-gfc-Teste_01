# Tarefas de Implementação: Notificações Push e Telegram

## Backend (Python/Flask)
- [ ] Adicionar `pywebpush` ao `requirements.txt`.
- [ ] Gerar chaves VAPID (Public/Private) e salvá-las na configuração (`users_config.json`).
- [ ] Criar arquivo `subscriptions.json` para armazenar as inscrições dos navegadores.
- [ ] Incluir `subscriptions.json` na lógica de sincronização com o GitHub.
- [ ] Criar endpoint `/api/notifications/vapidPublicKey` para o frontend obter a chave pública.
- [ ] Criar endpoint `/api/notifications/subscribe` para receber e salvar inscrições no `subscriptions.json`.
- [ ] Adicionar as chaves `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` ao arquivo `users_config.json` e tela de config.
- [ ] Criar função `send_webpush_alert(titulo, mensagem)` usando a biblioteca `pywebpush`.
- [ ] Criar função `send_telegram_alert(titulo, mensagem)` usando `requests`.
- [ ] Modificar `verificar_prevendas_thread` e `verificar_sincronia_thread` para:
  - Disparar Push e Telegram além do e-mail (a cada 15 min).
  - Detectar quando o erro for resolvido e disparar um alerta de "Erro Sanado" apenas para Push e Telegram.

## Frontend (Next.js)
- [ ] Criar o Service Worker em `frontend/public/sw.js` para escutar e exibir `push events`.
- [ ] Criar um utilitário (ex: `pushUtils.ts`) para lidar com a conversão da VAPID key.
- [ ] Em um componente global (ex: `layout.tsx` ou um novo `PushManager`), adicionar lógica para:
  - Verificar suporte a Service Workers e Push Manager.
  - Solicitar permissão do usuário.
  - Inscrever o usuário e enviar o objeto `PushSubscription` para o backend.
