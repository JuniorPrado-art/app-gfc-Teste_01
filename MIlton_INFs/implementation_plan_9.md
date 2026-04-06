# Refatoração de Relatórios: DRE e Custo Médio

Este plano detalha a substituição dos relatórios "DRE" e "Custo Médio" por "Transações - POS" e "Transações - Possíveis Duplicadas", respectivamente. Ambos utilizarão filtros de Período e Empresa, exibindo os dados em tabelas elaboradas a partir das requisições SQL fornecidas.

## User Review Required
> [!IMPORTANT]
> Verifique se as novas rotas da API e as consultas SQL atendem integralmente à sua expectativa de negócio no PostgreSQL. O Menu lateral sofrerá atualizações de nomenclatura e tamanho de fonte.

## Proposed Changes

### Backend (Python/Flask)
Vamos adicionar as rotas no backend para os filtros e para processar ambos os relatórios.

#### [MODIFY] [app.py](file:///c:/Users/Milton%20Prado/Documents/App-GFC/execution/app.py)
Adição de três novas rotas:
1. `GET /api/empresas`: Retorna a listagem de empresas executando `SELECT grid as codigo, nome_reduzido as empresa FROM empresa;`.
2. `POST /api/relatorios/transacoes-pos`: Substitui o "DRE". Executa a primeira query SQL fornecida retornando PLANO CONTA, FORMA DE PAGAMENTO, etc. 
3. `POST /api/relatorios/transacoes-duplicadas`: Substitui o "Custo Médio". Receberá `data_inicial`, `data_final`, e `codigo_empresa` para executar a segunda query SQL, que inclui complexidade de JOINs e subqueries para identificar duplicações e validações TEF (Tabela de colunas: PLANO DE CONTA, FORMA DE PAGAMENTO, DATA, TURNO, CONTA CAIXA, AUTORIZACAO, VENCIMENTO, NUMERO NOTA, STATUS NOTA, VALOR, USUARIO, EMPRESA, AUTENTICAÇÃO TEF).

> Obs: Os parâmetros de data e empresa serão tratados com placeholders seguros contra injeção de SQL (`%s`).

---

### UI / Layout do Dashboard
Adaptaremos a barra lateral para acomodar as novas terminologias e sub-títulos menores.

#### [MODIFY] [layout.tsx](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/layout.tsx)
- Substituir a label do menu 'DRE' por `Transações - POS` com `<small>(Lançamentos Manuais)</small>`. A rota muda para `/dashboard/transacoes-pos`.
- Substituir a label do menu 'Custo Médio' por `Transações - Possíveis Duplicadas` com `<small>(Transações que devem ter uma análise mais criteriosa)</small>`. A rota muda de `/dashboard/custo-medio` para `/dashboard/transacoes-duplicadas`.
- Os atalhos condicionais de visibilidade continuarão respondendo pelos identificadores (keys) `dre` e `custo_medio` para não quebrar a sincronização atual, ou podemos atualizar as keys no JSON (Aviso: atualizando as chaves, os usuários perderão as configurações antigas salvas e voltarão ao padrão vísivel. Recomendo manter as chaves atreladas aos botões originais no servidor, mudando apenas os textos exibidos no frontend).

---

### Novos Relatórios (Páginas Frontend)
Removeremos as páginas antigas de placeholder e criaremos as páginas funcionais.

#### [DELETE] [page.tsx (dre)](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/dre/page.tsx)
#### [DELETE] [page.tsx (custo-medio)](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/custo-medio/page.tsx)

#### [NEW] [page.tsx (transacoes-pos)](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/transacoes-pos/page.tsx)
- Rota dedicada ao relatório de POS. Com filtro (Inicial, Final, Empresa Dropdown).
- Tabela de resultados "R E L A T O R I O   P O S".

#### [NEW] [page.tsx (transacoes-duplicadas)](file:///c:/Users/Milton%20Prado/Documents/App-GFC/frontend/src/app/dashboard/transacoes-duplicadas/page.tsx)
- Rota dedicada às possíveis transações duplicadas. Com filtro igual ao POS.
- Tabela extensiva com até 13 colunas baseando-se no SQL validado pela `R E L A T O R I O   D U P L I C A D O S`, formatando as datas para DD/MÊS/AAAA como pedido no SQL, e os valores monetários corretos.

## Open Questions
- Devido à alteração do nome dos menus (Ex: "DRE" para "Transações POS"), devemos alterar a chave (key) interna do banco JSON de visibilidade de 'dre' para 'transacoes_pos' e 'custo_medio' para 'transacoes_duplicadas'? (Fazer isso reseta a configuração de oclusão desse painel para todos os admins). 
- O layout das planilhas será feito com tabelas modernas responsivas que rolam horizontalmente para caber todas essas opções. Está de acordo?

## Verification Plan
### Automated Tests
- Os endpoints de acesso poderão ser validados diretamente via script Postman para garantir a formação do JSON sem erros de conversão de tipagem do PostgreSQL (`Decimal`, `DateTime`, `Date`).

### Manual Verification
- Teste nos botões de navegação lateral para confirmar que a exibição se adequa sem quebrar a visualização das bordas.
- Seleção de opções de empresa para confirmar a leitura do `SELECT * FROM empresa` na API.
