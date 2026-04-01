# Plano de Implementação: Alertas de 15 Minutos e Novas Telas

Este plano descreve como vamos implementar as alterações solicitadas pelo usuário.

## Proposed Changes

### Backend (Python - `execution/app.py`)
Para suportar o disparo a cada 15 minutos, precisamos evoluir o backend para lidar com rotinas em backgound (threads).

#### [MODIFY] [app.py](file:///c:/Users/Milton%20Prado/Documents/App-GFC/execution/app.py)
- Refatorar a lógica de envio de e-mails (`disparar_alerta`) isolando a função para ser chamada tanto pela rota API quanto por uma Thread.
- Criar um gerenciador de tarefas (`AlertManager`) utilizando a biblioteca embutida `threading` com loops que executam a verificação do banco de dados a cada 15 minutos (900 segundos).
- Só haverá disparo de e-mail se de fato houver `pendentes > 0` (Pré-vendas) ou `atrasados > 0` (Sincronia), caso contrário a thread apenas aguardará o próximo ciclo.
- Criar Rota `GET /api/monitoramento/status-rotina` que retorna o estado atual (ativo/inativo) das rotinas de "Sincronia" e "Pré-vendas".
- Criar Rota `POST /api/monitoramento/toggle-rotina` que ativa/desativa a sub-rotina de 15 minutos de acordo com o clique no botão do Portal.

### Frontend (Dashboard GFC)
Adequação das telas de monitoramento e criação das páginas "Volte em breve" para DRE, Custo Médio e Chamados Abertos.

#### [MODIFY] [sincronia/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/sincronia/page.tsx) e [pre-vendas/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/pre-vendas/page.tsx)
- Buscar o estado inicial de ativação do Alerta ao abrir a página consultando o Backend.
- Alterar o texto do botão "Emitir Alerta" para exibir de forma dinâmica "Criar Alerta" ou "Finalizar Alerta".
- Ao lado dele, adicionar um novo botão "Abertura de Chamado" que invoca uma notificação (`toast`) dizendo: `"Estamos preparando algo incrível aqui. Volte em breve!"`.

#### [NEW] [dre/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/dre/page.tsx)
- Criar pasta e arquivo base retornando um design premium "Volte em Breve!" mantendo a arquitetura atual de rotas no Next.js.
  
#### [NEW] [custo-medio/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/custo-medio/page.tsx)
- Criar pasta e arquivo com a mesmíssima tela de "Volte em Breve!" adaptada com o título correto de Custo Médio.

#### [NEW] [chamados/page.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/chamados/page.tsx)
- Idem ao passo anterior, para suportar a rota Chamados Abertos de Suporte.

## Open Questions

> [!WARNING]
> **Atenção:** Se o servidor GFC (`app.py`) for reiniciado, a rotina de disparos deve continuar ou precisa ser configurada no botão novamente? Atualmente a thread viverá na memória e se reiniciado o servidor a rotina voltará ao estado inativo. Se quiser que continue salva será necessário salvar um JSON à parte para isso. Prossigo utilizando memória para essa fase?

> [!TIP]
> Caso você aprove esta arquitetura, basta dar **Continuar** ou aprovar respondendo e seguirei para executar todo o refatoramento na mesma hora!
