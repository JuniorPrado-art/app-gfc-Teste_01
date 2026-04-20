# Persistência de Configurações do Aplicativo via GitHub

Conforme alinhado, ao invés de usar o banco de dados do cliente, utilizaremos a **integração via GitHub API** para garantir que as configurações do painel geradas em Nuvem se tornem persistentes.

Como provedores de nuvem resetam arquivos locais toda vez que o servidor dorme ou é reiniciado, os dados eram apagados. Com a nova arquitetura, o painel do GFC fará *commits invisíveis* diretamente no repositório GitHub do cliente para selar as modificações no código-fonte!

## User Review Required

> [!WARNING]
> Regras para esta abordagem
> 1. Você terá que configurar a variável de ambiente **`GITHUB_TOKEN`** com um *Personal Access Token* no painel do controle em nuvem (Ex: Vercel/Render).
> 2. Você terá que adicionar a variável **`GITHUB_REPO`** com o nome do repositório respectivo (ex: `JuniorPrado-art/app-gfc-Teste_01`).
> 3. No provedor de Nuvem, ajuste o "Ignored Build Path" (ou equivalente) para ignorar deploys automáticos de modificações em `*.json`, garantindo que o servidor não sofra *restart* toda hora que o Painel do Aplicativo commitar algo novo (ele só adotará os novos jsons quando houver subida natural).

## Proposed Changes

### execution\app.py

#### [MODIFY] app.py
- Incluir o módulo nativo `requests` ou equivalente para comunicações HTTP externas.
- Adicionar um nova função centralizada `sync_file_to_github(filename)`:
  - Checa se `GITHUB_TOKEN` e `GITHUB_REPO` existem no `.env` ou ambiente de SO. Se não, apenas salva o arquivo e aborta a sincronização remota de maneira segura.
  - Verifica o `SHA` atual do respectivo `*.json` realizando um `GET` no end-point da API do Github `https://api.github.com/repos/{owner}/{repo}/contents/execution/{filename}`.
  - Lendo com sucesso o JSON alterado localmente pelo aplicativo, converte-o para Base64.
  - Efetua um `PUT` na API do GitHub realizando um novo commit oficial: *"System: Auto-update {filename} config"*.
- Atualizar as seguintes rotinas que escrevem configurações em disco chamarem também o git helper logo após gravar o dado físico na máquina:
  - `save_visibility()` do `visibility.json`.
  - `save_email_config()` do `email_config.json`.
  - `save_alertas_config()` do `alertas_config.json`.
  - Método `save_state()` dentro do `AlertManager` encarregado do `alert_state.json`.

## Open Questions
- Nenhum bloqueio tecnológico encontrado. O aplicativo Python e a biblioteca `requests` instalada dão o suporte nativo que precisamos. 

Se o plano reflete exatamente nossa estratégia do GitHub com as condições acertadas, **escreva o seu *De Acordo*** para que eu modifique a estrutura lógica em `app.py`!
