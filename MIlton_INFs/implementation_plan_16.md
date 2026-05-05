# Implementação do recurso "Caixas sem gravação"

O objetivo desta implementação é adicionar um novo recurso de monitoramento para caixas sem gravação de conferência. Serão alterados o layout principal (Dashboard), a barra lateral de navegação (Sidebar), e criados um novo endpoint no backend e uma nova página para listar os registros.

## User Review Required

- A query fornecida será executada para trazer os registros. Notei que será preciso adicionar um novo endpoint em `execution/app.py`.
- No print, a seção "Observações:" apresenta um fundo diferenciado no card e será recriada mantendo o padrão visual do painel.
- O termo "ainda na página respectivamente, somente desmotrar em Construção" será interpretado como: criar as páginas reais de cada um dos outros itens ("Descontos Concedidos", "Estoque Crítico / Mínimos", "Exclusões") exibindo a mensagem "Em construção". Confirme se é isso mesmo ou se deseja apenas exibir "Em breve" no Dashboard sem criar as páginas.

## Proposed Changes

### Backend (`execution/app.py`)

#### [MODIFY] `execution/app.py`
- Adicionar uma nova rota `@app.route('/api/monitoramento/caixas_sem_gravacao', methods=['GET'])`.
- A rota carregará o cliente (assim como as outras), e executará as consultas:
  - `select * from caixa where conferencia is null`
- Retornará o `status: "success"` e o `data` contendo a lista dos caixas. O count pode ser feito via `.length` no frontend.

### Frontend (Layout Principal)

#### [MODIFY] `frontend/src/app/dashboard/page.tsx`
- Adicionar lógica no `useEffect` para fazer um fetch no novo endpoint e obter a quantidade de caixas sem gravação.
- Adicionar o novo bloco visual "Observações" abaixo dos cards "Sincronia" e "Pré-vendas", idêntico ao print:
  - Título "Observações:"
  - Link/Texto: `- Caixas sem gravação: {quantidade} caixas`
  - Texto "Em breve:"
  - Sub-itens: `- Descontos concedidos`, `- Estoque crítico e mínimo atingidos`, `- Exclusões`.

#### [MODIFY] `frontend/src/app/dashboard/layout.tsx`
- Inserir o novo grupo de menu `OBSERVAÇÕES` na `sidebar`, posicionado entre "Monitoramento" e "Relatórios".
- Adicionar os links: 
  - `Caixas Sem Gravação` -> `/dashboard/caixas-sem-gravacao`
  - `Descontos Concedidos` -> `/dashboard/descontos`
  - `Estoque Crítico / Mínimos` -> `/dashboard/estoque`
  - `Exclusões` -> `/dashboard/exclusoes`
- Adicionar a verificação de visibilidade para o novo grupo.

### Frontend (Novas Páginas)

#### [NEW] `frontend/src/app/dashboard/caixas-sem-gravacao/page.tsx`
- Criar a página que consome o mesmo endpoint `/api/monitoramento/caixas_sem_gravacao`.
- Listar em uma tabela de dados (com colunas como Data, Turno, Conta, Pessoa, Usuário, Empresa, Abertura, Fechamento, Grid, Código) igual ao retorno da query SQL.

#### [NEW] Páginas "Em Construção"
- `frontend/src/app/dashboard/descontos/page.tsx`
- `frontend/src/app/dashboard/estoque/page.tsx`
- `frontend/src/app/dashboard/exclusoes/page.tsx`
- Em cada uma, exibir apenas um aviso centralizado: "Página em Construção".

## Verification Plan

### Manual Verification
- Iniciar o backend local e o frontend Next.js.
- Acessar o Dashboard, verificar se a contagem "11 caixas" aparece corretamente no bloco de Observações.
- Clicar na sidebar para "Caixas Sem Gravação" e ver a lista carregando.
- Clicar em "Descontos", "Estoque" e ver a tela de "Em construção".
