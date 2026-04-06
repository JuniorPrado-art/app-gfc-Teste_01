# Guia Definitivo: Lançamento em Nuvem (Render + Vercel)

Esta etapa marca a migração oficial do seu sistema modelo Híbrido para a **Opção A (Totalmente em Nuvem)**. Como você tem um cliente onde as portas do PostgreSQL estão livres (`IP Público` e `Porta Liberada`), os dois lados da aplicação (Frontend e APIs) viverão 24h na Internet.

Como a sua aplicação é moderna e dividida em duas tecnologias distintas (Python e Next.js/React), usamos as duas melhores ferramentas específicas do mercado gratuitamente.

---

## 1. O Ajuste Local Necessário (`requirements.txt`)

O **Render** (sua hospedagem Python) precisa saber exatamente quais bibliotecas baixar para o seu código não falhar quando subir. Atualmente, você as instalou via `pip` no seu terminal, mas o GitHub não sabe quais são.

### [NEW] [requirements.txt](file:///c:/Users/Milton%20Prado/Documents/App-GFC/execution/requirements.txt)
Vamos criar na sua pasta `/execution` um arquivo pequeno, porém vital. Ele contém todos os módulos usados pelo Agente GFC:

```text
Flask==3.0.2
Flask-Cors==4.0.0
psycopg2-binary==2.9.9
cryptography==42.0.5
gunicorn==21.2.0
```
> `gunicorn` é incluído "escondido" porque ele é um motor especial que servidores Cloud usam para rodar arquivos `.py` profissionalmente 24 horas por dia (melhor e mais forte que o `python app.py` isolado).

---

## 2. Ação: Configurando o Render (Back-end)

Você acessará o site [Render.com](https://render.com) (crie uma conta gratuita pela própria conta do seu GitHub para ser instantâneo).

1. Clique em **New** e escolha **Web Service**.
2. Conecte com o seu GitHub e selecione o repositório `App-GFC-Template` (ou o nome do repo do cliente que você criou).
3. Na tela de configuração do Serviço, roque e preencha os seguintes pontos:
   - **Environment**: Selecione `Python 3`
   - **Build Command**: `pip install -r execution/requirements.txt`
   - **Start Command**: `cd execution && gunicorn app:app --log-file -`
4. Expanda a janela de "Advanced" (ou **Environment Variables**) e crie 4 novas Variáveis de Ambiente. Como o código estará na Nuvem, e não mais no Posto, as configurações que antes eram preenchidas na interface da "Base de Dados" agora nascem diretamente aqui:
   - `DB_HOST`: *O IP Público do Roteador do Cliente (Ex: 200.18.23.1)*
   - `DB_PORT`: *A porta liberada para o PostgreSQL (Padrão 5432)*
   - `DB_NAME`: *Nome do banco*
   - `DB_USER`: *Usuário*
   - `DB_PASS`: *Senha do banco do cliente*
5. Clique em **Create Web Service**. Ele iniciará a construção e te dará uma URL verde linda (Exemplo: `https://gfc-agente.onrender.com`). Guarde ela!

---

## 3. Ação: Configurando a Vercel (Front-end)

O frontend é extremamente parecido e você já o conhece bem:
1. Acesse o painel da **Vercel** (`vercel.com`).
2. Adicione **Add New > Project**, selecione o mesmo Repositório (ou o Repo Template específico gerado).
3. Aqui está o Pulo do Gato. Expanda a seção de **Environment Variables**:
   - Chave: `NEXT_PUBLIC_API_URL`
   - Valor: *A URL verde que o Render gerou no passo anterior* (EX: `https://gfc-agente.onrender.com`). **Cuidado para não colocar uma `/` no final.**
4. Clique em **Deploy**!

---

## Open Questions

Para eu preparar os arquivos e iniciar o ciclo desse deploy para você:

> [!WARNING]
> **Ações e Concordância**
> 1. Posso criar automaticamente o seu `execution/requirements.txt` e realizar o **Commit e Push** direto para o seu repositório atualizando a sua base com este ajuste de nuvem pronto para deploy?
> 2. O conceito de injetar as credenciais do posto usando "Variáveis de Ambiente" lá dentro do Render (no passo 2.4) ficou claro para você como novo método de conexão remota? (Isso ignora a tela antiga de "Configurações de Banco" visual no site, já que não temos o JSON de segurança rodando dentro do computador do dono do posto mais).
