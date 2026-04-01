# Tarefas - GFC Versão 0.1.0-alpha

Esta lista servirá para acompanharmos o avanço do desenvolvimento do aplicativo GFC.

- `[/]` Inicialização do Projeto
    - `[x]` Criar estrutura do Frontend em Next.js (na raiz do projeto).
    - `[x]` Criar o ambiente virtual Python (`venv`) e arquivos base no diretório `execution/` (Backend).
    - `[x]` Atualizar documentação `agente.md` e Changelog inicial para 0.1.0-alpha.
- `[x]` Backend (Python/Flask)
    - `[x]` Definir script para rodar servidor Flask (`app.py`).
    - `[x]` Criar lógica de Criptografia Simétrica para credenciais (`cryptography`).
    - `[x]` Implementar módulo de envio de e-mail (SMTP Gmail próprio do Aplicativo).
    - `[x]` Criar rota API para testar e salvar a conexão ao Postgres.
- `[x]` Frontend (Next.js)
    - `[x]` Layout Geral (Sidebar Inteligente + Controle Dark/Light Theme Moderno).
    - `[x]` Tela de Configuração (Inputs de Host, DB, User, Pass, CNPJ e Nome).
    - `[x]` Integração da Tela de Configuração com API Python.
- `[/]` Módulo de Autenticação e Visibilidade (Admin vs Cliente)
    - `[ ]` Criar rota `/api/auth/login` em Python para validar 'AppComercial' ou tabela Postgres `usuario`.
    - `[ ]` Gerenciamento de Visibilidade de Menus via arquivo (`visibility.json`).
    - `[ ]` Criar tela de `/login` com design Premium em Next.js.
    - `[ ]` Desenvolver lógica de renderização dinâmica no Sidebar (Ocultar menus e esconder 'Configurações' do cliente).
- `[ ]` Módulos da Tela Principal
    - `[ ]` Menu Monitoramento (Pré-vendas e Sincronia).
    - `[ ]` Lógica de "Abrir Chamado" Assíncrono e Fallback via Email.
    - `[ ]` Menu Relatórios (DRE, Custo Médio).
    - `[ ]` Menu Chamados (Consulta).
- `[ ]` Verificações e Testes Manuais
    - `[ ]` Testes de conexão DB errada/correta.
    - `[ ]` Teste falha no chamado (simulando timeout) -> Disparo Email Terceiro.
