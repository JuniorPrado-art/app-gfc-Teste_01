# Nome do Projeto: Aplicativo GFC - (Gerenciador de Ferramentas Customizadas)

## Arquitetura do Agente GFC

Este documento define a estrutura de pastas e a arquitetura em 3 camadas do nosso agente, juntamente com os diretórios adicionais para armazenamento de código fonte.

## Estrutura de Pastas

* **`directives/`**: Camada 1 - Diretrizes e regras de negócio.
* **`execution/`**: Camada 2 - Scripts e lógica determinística de execução do agente.
* **`.tmp/`**: Camada 3 - Arquivos temporários gerados durante o processamento.
* **`src/`**: Diretório exclusivo para armazenamento dos códigos das linguagens utilizadas no projeto.
    * **`src/java/`**: Códigos em Java.
    * **`src/python/`**: Códigos e scripts em Python.
    * **`src/postgres_sql/`**: Códigos, scripts e queries para o banco de dados PostgreSQL.
