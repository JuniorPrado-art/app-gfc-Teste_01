# Tarefas de Implementação: Alertas de 15 Minutos e Novas Telas

- [/] Atualizar `backend` (Python)
  - [ ] Implementar classe gerenciadora de tarefas em bg `AlertManager`.
  - [ ] Persistência de estado de rotinas em `alert_state.json`.
  - [ ] Rotas `GET /api/monitoramento/status-rotina` e `POST /api/monitoramento/toggle-rotina`.
  - [ ] Inicializar rotinas ativas as resgatar configs persistidas após boot inicial do App.
- [ ] Atualizar Telas Frontend `Sincronia` e `Pré-vendas`
  - [ ] Implementar chamada para capturar se a rotina já está ativada, adequando o texto "Criar / Finalizar Alerta".
  - [ ] Inserir botão de "Abertura de Chamado" com toast "Em breve!".
- [ ] Criar Telas Restantes (`DRE`, `Custo Médio` e `Chamados Abertos`)
  - [ ] Criar arquivo `frontend/src/app/dashboard/dre/page.tsx` com layout Premium "Estamos preparando algo incrível aqui!".
  - [ ] Criar arquivo `frontend/src/app/dashboard/custo-medio/page.tsx`.
  - [ ] Criar arquivo `frontend/src/app/dashboard/chamados/page.tsx`.
