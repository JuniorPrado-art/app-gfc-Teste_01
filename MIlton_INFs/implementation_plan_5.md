# Estratégia de Deploy para Múltiplos Clientes (GitHub Template e Vercel)

Este documento descreve a arquitetura e os passos para migrar a sua aplicação GFC (Gerenciador de Ferramentas Customizadas) de um ambiente puramente local para a nuvem através do GitHub e da Vercel. 

O plano atende ao seu modelo de distribuição: fornecer o aplicativo para múltiplos clientes usando repositórios e instâncias separadas para cada um.

> [!IMPORTANT]
> **Correção Crítica de Nuvem**: No momento, seu frontend (Next.js) tenta se comunicar com a API usando `` `http://${window.location.hostname}:5000/api...` ``. Ao hospedar na Vercel, o hostname será `seu-site.vercel.app`, o que fará as requisições quebrarem (ele tentará chamar `seu-site.vercel.app:5000` em vez do servidor Python local do cliente). Precisamos alterar o código para utilizar uma variável de ambiente (ex: `NEXT_PUBLIC_API_URL`) que definiremos na Vercel para cada cliente!

## 1. O Modelo: Repositório Template no GitHub

O seu entendimento está **absolutamente correto**. A melhor forma de manter um software "base" e escalar para vários clientes sem que o código de um afete o outro é utilizar o recurso **Template Repository** do GitHub.

### Como funciona:
- **Repositório Central (Pai)**: Nós iniciaremos o Git na sua pasta local atual e subiremos ela para o GitHub como `App-Git-Base` (ou o nome que preferir). Em seguida, você clicará nas configurações dele para marcá-lo como "Template".
- **Repositórios de Clientes (Filhos)**: Sempre que você vender o aplicativo, não precisará copiar todas as pastas. O GitHub terá um botão verde grande chamado **Use this template**. Basta clicar, digitar o nome (ex: `App-Cliente-PostoX`), e ele gerará um repositório independente com todo o código existente.

## 2. Deploy na Nuvem (Vercel)

A Vercel hospedará **apenas o Frontend (Next.js)**. O Backend (Python `app.py`) e o Banco de Dados continuarão rodando na máquina ou servidor da rede local do cliente.

- Na Vercel, você criará um "Projeto" novo e o conectará com o repositório `App-Cliente-PostoX` correspondente.
- Configuração Chave: Para o cliente em questão, inserimos a variável de ambiente `NEXT_PUBLIC_API_URL` com o endereço físico onde o Python dele está rodando (ex: IP e porta `http://200.120.30.1:5000` ou até `http://localhost:5000` se a operação no caixa for interna pelo próprio computador que hostea).

## Requisitos Iniciais a Preparar (`.gitignore`)

Antes de enviar o código, é crucial ignorar arquivos inúteis e segredos para a nuvem.

### [NEW] [.gitignore](file:///c:/Users/Milton%20Prado/Documents/App-GFC/.gitignore)
Será criado na raiz do projeto contendo as regras globais e de Python.

```gitignore
*/__pycache__/
execution/venv/
*.pyc

# Local Configs & DB Info (CRÍTICO)
execution/config.json
execution/visibility.json
execution/email_config.json
execution/alertas_config.json
execution/secret.key
execution/alert_state.json
execution/.env

# Node/Next (As regras reais já devem constar em frontend/.gitignore)
frontend/node_modules/
frontend/.next/
```

## 3. Passo a Passo do Plano (Ação Prática)

Uma vez que você Aprovar este plano, eu executarei as seguintes etapas no terminal:

1. **Criar os `.gitignore`** global e adequar os locais para não subir dados restritos dos seus testes como senhas do banco.
2. **Substituir o Fetch Dinâmico**: Alterarei rapidamente os arquivos do `frontend/src/app` para utilizar `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'` em vez de `window.location.hostname`. Padrão excelente e compatível com Vercel.
3. **Iniciar o Repositório Git Local** (`git init`), fazer o staging (`git add .`) e o Snapshot Inicial (`git commit -m "Projeto Inicial V1"`).

## Open Questions

Para que possamos avançar perfeitamente para integrar com o seu GitHub, por favor, me confirme os itens abaixo para aprovação do plano:

> [!WARNING]
> **Questões Pendentes**
> 1. Você concorda em fazermos a troca rápida da URL da API pela **variável de ambiente** (`NEXT_PUBLIC_API_URL`) antes do git, o que resolve o problema do Vercel?
> 2. Você já possui uma conta no GitHub ou um Repositório Vazio onde deseja enviar tudo, ou prefere que eu inicie o local (`git init`) e você siga minhas instruções por escrito para conectar manualmente depois?
