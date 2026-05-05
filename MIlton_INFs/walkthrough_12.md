# Revisão de Documentação Concluída

Toda a revisão de comentários em inglês e adição de descrições em Português do Brasil foi finalizada, preparando o código para que seus colegas de equipe possam compreender e expandir o aplicativo de forma colaborativa.

## Alterações Realizadas

### 1. Documentação de Fluxos Principais (Python / Backend)
Foram criadas `docstrings` (documentações nativas em Python) para explicar o propósito dos blocos mais cruciais do sistema:
* **Rotas de Monitoramento (`get_prevendas` e `get_sincronia`)**: Explicação detalhada de que estas rotas recebem a query de cliente, buscam no banco e identificam, por exemplo, pré-vendas travadas há mais de 1 hora ou sincronias atrasadas há mais de 30 minutos.
* **Motor de Disparo (`executar_disparo_alerta`)**: Descrição da execução isolada de buscas para o acionamento de canais de E-mail, Telegram e Push Notification.
* **Gerenciador de Alertas (`AlertManager`)**: Explicada a importância da persistência no arquivo `alert_state.json` para que as threads de monitoramento retornem ativas automaticamente se o servidor reiniciar (como acontece no Render).
* **Autenticação (`auth_login` e `auth_reset_password`)**: Documentação do comportamento das verificações de Admin e usuários finais, e como a redefinição envia e-mails transacionais de recuperação.

### 2. Inativação de Rotas Legadas
Como solicitado, as rotas que não são mais utilizadas devido à mudança para a arquitetura Multi-Tenant foram inteiramente convertidas em comentários. Elas não interferem mais no aplicativo, mas permanecem visíveis para análise histórica de como a arquitetura anterior funcionava:
* `/api/empresas`
* `/api/relatorios/transacoes-pos`
* `/api/relatorios/transacoes-duplicadas`
* `/api/config/load` e `/api/config/save`

### 3. Tradução e Documentação (TypeScript / Frontend)
No painel Next.js, foram documentadas as funções fundamentais que comunicam com o backend:
* `page.tsx` (Visão Geral): Comentada a lógica de requisição recorrente (Polling a cada 15 segundos) utilizada para evitar travamento da tela se o banco do cliente estiver lento.
* `sincronia/page.tsx` e `pre-vendas/page.tsx`: Documentada a divisão de interface para Iniciar/Parar alertas e o agrupamento dinâmico visual (por empresa) na tabela de dados.
* `layout.tsx`: Explicada a inscrição do navegador (`Service Worker`) usando a chave **VAPID Pública**, conectando a UI com o sistema operacional para receber as Notificações de Alerta na área de trabalho.

> [!NOTE]  
> Todos os arquivos modificados já foram sincronizados com os repositórios `Teste_01` e `Template2` (`git push`).
> Nenhuma regra de negócio ou lógica da aplicação foi alterada; as edições foram restritas apenas a comentários e strings inativas.

Quando estiver pronto, é só avisar e iniciarei a criação da "Relação de Arquivos e Pastas" (Documentação Estrutural) que você mencionou para complementar o entendimento da equipe!
