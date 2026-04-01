# Plano de Arquitetura GFC - (Gerenciador de Ferramentas Customizadas)

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
*   **Tela de Login (Nova Tela Intermediária - `/login`):**
    *   Ficará posicionada entre o Configurador (`/`) e o Dashboard (`/dashboard`).
    *   *Login Administrador:* Validado via código embutido local. Acessa tudo, **incluindo o menu Configurações**, e possui botões ("Ocultar") para gerenciar a visibilidade de cada submenu da lateral (Sincronias, Chamados, etc). Se todos os filhos de uma categoria forem ocultos, a categoria (Ex: "Monitoramento") some para o cliente.
    *   *Login Cliente:* Validado diretamente contra o banco de dados PostgreSQL do cliente. Nunca vê o menu de "Configurações" e vê apenas os menus que o Administrador não ocultou.
*   **Layout Principal (Dashboard):** Sidebar responsivo que renderiza dinamicamente as opções com base no Nível de Acesso da sessão atual e no JSON de Visibilidade salvo pelo Admin.

### Backend (Python/Flask Agent)
#### [NEW] Backend Python (API & Agente GFC)
*   **Rotas de Autenticação e Configuração:** `/api/config/test`, `/api/config/save`.
*   **Rotas de Visibilidade e Perfis (Access Control):** Criação de `/api/auth/login` (Admin ou BD) e leitura/gravação em um arquivo local seguro (ex: `visibility.json`) das preferências de ocultação criadas pelo administrador.
*   **Conector PostgreSQL:** Classe responsável por se conectar aos bancos dos postos de gasolina configurados e realizar o teste de usuário e senha do Cliente Final.
*   **Motor de Background:** Serviço assíncrono (Threads, Celery ou Tasks Flask) para gerenciar aberturas de "Chamados" via sistema terceiro.
*   **Monitoramento de Timeout e Erro:** Sistema que acompanha a demora do chamado e aciona disparo de e-mail de fallback.

### Módulos Funcionais (Telas de Ferramentas)
*   **Menu Monitoramento:** Relatórios/Dashboard para "Pré-vendas" e "Sincronia". Inclui botão "Alertar" (disparo de e-mail) e "Abrir Chamado" (trabalho em background).
*   **Menu Relatórios:** Estruturação para DRE e Custo Médio.
*   **Menu Chamados:** Consulta de status e retornos dos sistemas terceiros.

## Open Questions

> [!WARNING]
> Para dar continuidade à construção exata da **tela de login do Cliente**, preciso de uma informação estrutural do seu **PostgreSQL**:
> 1. Quais são os **nomes exatos da tabela e colunas** de usuário/senha que faremos o `SELECT` para autorizar a entrada do cliente? (Ex: `SELECT login, senha FROM usuarios_do_posto WHERE login = ?`).
> 2. Qual será o **usuário e senha padrão** que devo deixar "embutido no código" para o Administrador acessar o aplicativo pela primeira vez? (Ex: admin / admin).

> [!NOTE]
> **Aprovações Realizadas (Histórico):**
> 1. Bibliotecas Python (Flask para API e Psycopg2) aprovadas.
> 2. Uso de arquivo `.json` fortemente criptografado para o Login Configurador local.
> 3. Layouts e componentes atualizados no React (Substituição de inputs base).

## Verification Plan

### Testes Manuais (Locais)
*   Rodar a aplicação `Next.js` em http://localhost:3000 e a API Python na porta 5000.
*   Inserir credenciais de DB erradas no Configurador e verificar rejeição.
*   Inserir certas, validar criptografia e testar consulta SQL no Postgres.
*   Simular abertura de Chamado com um "delay/erro" programado para validar a mensagem de erro e o disparo automático de e-mail para o sistema parceiro.
