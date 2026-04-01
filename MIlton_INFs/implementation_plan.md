# Aplicativo GFC - (Gerenciador de Ferramentas Customizadas)

Este documento detalha o planejamento arquitetural e as etapas de implementação do aplicativo GFC, englobando desde a estrutura de infraestrutura até as funcionalidades de tela solicitadas.

## Estratégia de Versionamento e Documentação

Para manter um controle rigoroso das atualizações, adotaremos o padrão de **Versionamento Semântico (SemVer)** no formato `MAJOR.MINOR.PATCH` (ex: `1.0.0`):
*   **PATCH (ex: 1.0.1 -> 1.0.2):** Correções de bugs ou pequenos ajustes visuais/texto.
*   **MINOR (ex: 1.1.0 -> 1.2.0):** Novas funcionalidades ou menus (ex: ao criarmos o Menu Relatórios).
*   **MAJOR (ex: 1.0.0 -> 2.0.0):** Grandes reestruturações arquiteturais ou mudanças incompatíveis com o que existia antes (ex: quando formos migrar do Web para o Aplicativo Mobile nativo, ou mudarmos a forma de autenticação).

> [!TIP]
> **Decisão de Versão Inicial:** O desenvolvimento começará na **Versão 0.1.0-alpha** (fase de testes e construção local). Lançaremos a **Versão 1.0.0** apenas quando tudo estiver estável e pronto para a primeira "hospedagem em nuvem".

Toda atualização será acompanhada de um registro de versão detalhado (Changelog) documentando o que mudou.

## User Review Required

> [!IMPORTANT]
> **Arquitetura Web Completa:** Como o aplicativo tem interfaces complexas, login de configurador e futuras integrações mobile, proponho separarmos em:
> 1.  **Frontend (Telas)**: Construído com **Next.js** e CSS moderno. É a melhor tecnologia para hospedar posteriormente na Vercel e facilita transições futuras para mobile (com React Native).
> 2.  **Backend (Agente Python)**: Onde rodarão as camadas lógicas corporativas (`execution/`, chamados em background, PostgreSQL via `psycopg2`).
> **Decisão:** Uso aprovado de Criptografia para senhas locais via `.json` fortemento criptografado, e arquitetura validada.

## Proposed Changes

Abaixo estão os módulos fundamentais para construir a fundação do GFC.

### Infraestrutura e CI/CD
*   **Integração Vercel/GitHub:** Criação do repositório no Github com a `branch main` (futuralmente ligada à nuvem/Vercel) e uma `branch de desenvolvimento/local` para testar homologações locais sem derrubar o que está no ar.
*   **Criptografia:** Implementação de uma chave de criptografia local no backend python (`cryptography` library) para gravar credenciais de banco e sistemas de terceiros em um arquivo de configuração seguro e ininteligível.

### Frontend (Next.js Application)
#### [NEW] Aplicativo Base Next.js
*   Configuração do roteamento.
*   **Tela de Login (Dupla finalidade):**
    1.  *Login Local (Configurador):* Tela com inputs (Host, Porta, Database, User, Password, CNPJ, Nome) com botão de "Testar Conexão". Senhas serão salvas criptografadas.
    2.  *Login do Usuário:* Conecta ao Postgres e valida o perfil (permissões de grupos/telas).
*   **Layout Principal (Dashboard):** Sidebar responsivo em modo Dark Moderno ou Neumorphism.
*   **Controle de Permissões:** Lógica para ocultar/mostrar (Monitoramento, Relatórios, Chamados) de acordo com o login realizado.

### Backend (Python/Flask Agent)
#### [NEW] Backend Python (API & Agente GFC)
*   **Rotas de Autenticação e Configuração:** Para salvar e testar as conexões de DB do Configurador localmente.
*   **Conector PostgreSQL:** Classe responsável por se conectar aos bancos dos postos de gasolina configurados.
*   **Motor de Background:** Serviço assíncrono (Threads, Celery ou Tasks Flask) para gerenciar aberturas de "Chamados" via sistema terceiro.
*   **Monitoramento de Timeout e Erro:** Sistema que acompanha a demora do chamado. Em caso de falha, aciona disparo de e-mail automático (usando uma conta própria do Gmail do Aplicativo GFC) para o **sistema de chamado terceiro**, enviando as informações para que eles abram de forma manual. Não será enviado ao cliente final.

### Módulos Funcionais (Telas de Ferramentas)
*   **Menu Monitoramento:** Relatórios/Dashboard para "Pré-vendas" e "Sincronia". Inclui botão "Alertar" (disparo de e-mail) e "Abrir Chamado" (trabalho em background).
*   **Menu Relatórios:** Estruturação para DRE e Custo Médio.
*   **Menu Chamados:** Consulta de status e retornos dos sistemas terceiros.

## Open Questions

> [!NOTE]
> **Aprovações Realizadas:**
> 1. Bibliotecas Python (Flask para API e Psycopg2) aprovadas.
> 2. Uso de arquivo `.json` fortemente criptografado para o Login Configurador local aprovado.
> 3. Numeração iniciando em `0.1.0-alpha` rumo à `1.0.0` aprovada.
> 4. Conta de Gmail exclusiva do Aplicativo para disparo dos emails aprovada.

## Verification Plan

### Testes Manuais (Locais)
*   Rodar a aplicação `Next.js` em http://localhost:3000 e a API Python na porta 5000.
*   Inserir credenciais de DB erradas no Configurador e verificar rejeição.
*   Inserir certas, validar criptografia e testar consulta SQL no Postgres.
*   Simular abertura de Chamado com um "delay/erro" programado para validar a mensagem de erro e o disparo automático de e-mail para o sistema parceiro.
