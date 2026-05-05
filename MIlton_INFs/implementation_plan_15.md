# Adição de Comentários e Tradução para PT-BR

O objetivo desta etapa é preparar o código-fonte para ser compartilhado com a equipe, garantindo que toda a lógica esteja bem explicada em Português do Brasil, eliminando barreiras de idioma e facilitando a manutenção futura do sistema Multi-Tenant.

## Open Questions
- Existe alguma preferência específica sobre o nível de detalhes dos comentários? (ex: documentar apenas funções principais ou detalhar blocos específicos dentro das rotas?)
- Gostaria que os arquivos antigos não mais utilizados (como rotas antigas de single-tenant que estão desativadas) fossem comentados ou diretamente removidos para não confundir os novos programadores?

## Proposed Changes

A revisão será focada nos arquivos críticos do sistema, substituindo qualquer comentário em inglês residual e adicionando descrições claras e concisas.

### Backend (Python)

#### [MODIFY] [app.py](file:///d:/Milton%20Junior/Documents/App-GFC/execution/app.py)
- Tradução de comentários residuais em inglês.
- Adição de *docstrings* (comentários descritivos) no início das principais rotas, explicando:
  - O que a rota `/api/monitoramento/prevendas` faz (busca, filtros, cálculos).
  - O funcionamento do `executar_disparo_alerta` e do `AlertManager` (threads em background, proteção contra travamentos).
  - A lógica de autenticação Multi-Tenant.
  - A função de auto-sincronização com o GitHub.

#### [MODIFY] [config_manager.py](file:///d:/Milton%20Junior/Documents/App-GFC/execution/config_manager.py)
- Comentar a responsabilidade do arquivo (isolar o carregamento de configurações do arquivo central de clientes e formatar para injeção de dependências no app.py).

### Frontend (Next.js / TypeScript)

#### [MODIFY] [page.tsx (Visão Geral)](file:///d:/Milton%20Junior/Documents/App-GFC/frontend/src/app/dashboard/page.tsx)
- Adição de comentários explicando o ciclo de vida do carregamento do cliente, a lógica de polling (tentativas de 15 em 15s) e o roteamento baseado em abas.

#### [MODIFY] [sincronia/page.tsx](file:///d:/Milton%20Junior/Documents/App-GFC/frontend/src/app/dashboard/sincronia/page.tsx) e [pre-vendas/page.tsx](file:///d:/Milton%20Junior/Documents/App-GFC/frontend/src/app/dashboard/pre-vendas/page.tsx)
- Explicar como a interface se comunica com as rotinas de alerta em background, e como a paginação/tabela é renderizada dinamicamente com base na resposta da API.

#### [MODIFY] [layout.tsx](file:///d:/Milton%20Junior/Documents/App-GFC/frontend/src/app/dashboard/layout.tsx)
- Comentar o funcionamento da inscrição do Service Worker para notificações WebPush (VAPID) a nível do Sistema Operacional.

## Verification Plan

### Manual Verification
- Será gerado um `git diff` após a execução confirmando que não houve alteração lógica de variáveis ou fluxos, garantindo que o aplicativo continue funcionando perfeitamente (nenhuma regra de negócio será alterada).
- Todos os comentários novos poderão ser revisados pela diferença de arquivos para assegurar que a linguagem utilizada é padrão PT-BR técnico.

*(Nota: O documento final de Relação de Arquivos e Pastas aguardará o seu pedido futuro conforme solicitado).*
