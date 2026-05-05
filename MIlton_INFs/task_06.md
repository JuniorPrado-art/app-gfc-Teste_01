# Tarefas de Documentação e Tradução

- `[ ]` **Backend (Python)**
  - `[ ]` Revisar `app.py`: Traduzir comentários em inglês residuais.
  - `[ ]` Revisar `app.py`: Documentar as funções principais (ex: `/api/monitoramento/prevendas`, `/api/monitoramento/sincronia`, `executar_disparo_alerta`).
  - `[ ]` Revisar `app.py`: Comentar ("comment out") o código das rotas antigas inutilizadas (ex: `/api/config/load`, `/api/config/save`, `/api/empresas`, POST de configuração manual, etc) mantendo para histórico.
  - `[ ]` Revisar `config_manager.py`: Adicionar comentários sobre a lógica de gerenciamento de configurações do Multi-Tenant.
- `[ ]` **Frontend (TypeScript)**
  - `[ ]` Revisar `frontend/src/app/dashboard/page.tsx`: Traduzir e documentar a lógica do painel.
  - `[ ]` Revisar `frontend/src/app/dashboard/sincronia/page.tsx`: Traduzir e documentar chamadas à API e estado.
  - `[ ]` Revisar `frontend/src/app/dashboard/pre-vendas/page.tsx`: Traduzir e documentar chamadas à API e estado.
  - `[ ]` Revisar `frontend/src/app/dashboard/layout.tsx`: Traduzir e documentar a assinatura do WebPush.
- `[ ]` **Finalização**
  - `[ ]` Confirmar funcionamento (`git status` / teste básico).
  - `[ ]` Realizar o push para `origin` e `template`.
