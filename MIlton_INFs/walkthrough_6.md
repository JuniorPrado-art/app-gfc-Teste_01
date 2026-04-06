# Guia Definitivo: Lançamento em Nuvem (Render + Vercel)

Esta etapa marca a migração oficial do seu sistema modelo Híbrido para a **Opção A (Totalmente em Nuvem)**. Como você tem um cliente onde as portas do PostgreSQL estão livres (`IP Público` e `Porta Liberada`), os dois lados da aplicação (Frontend e APIs) viverão 24h na Internet.

Como a sua aplicação é moderna e dividida em duas tecnologias distintas (Python e Next.js/React), usamos as duas melhores ferramentas específicas do mercado gratuitamente.

> [!NOTE]
> O código do seu repositório no GitHub já está **100% atualizado** com o novo `requirements.txt` necessário pelo Render. O passo a passo abaixo fará todo sentido visualmente quando você abrir os sites.

---

## 1. Mão na Massa: Configurando o Render (Back-end)

O Render é como a Vercel, mas super focado em Python e Banco de Dados.

1. Acesse o site [Render.com](https://render.com) e crie sua conta clicando em **Get Started** (escolha entrar com o próprio GitHub para vincular sua conta automaticamente).
2. No painel inicial (Dashboard), clique no botão destacado **New +** e escolha a opção **Web Service**.
3. Na lista, clique no seu repositório `App-GFC-Template` (ou o nome do repo do cliente que você criou através dele).
4. O Render vai pedir para você preencher algumas linhas para saber como rodar seu código. Preencha EXATAMENTE assim:
   - **Name**: `gfc-api-cliente-X` (o nome que preferir)
   - **Language/Environment**: `Python 3`
   - **Branch**: `main`
   - **Root Directory**: `execution` (Isso é **muito importante**! Diz ao Render que os arquivos Python estão dentro da pasta execution, e não na raiz)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --log-file -`
5. Role a página até encontrar o botão **Advanced** e clique nele para abrir as Variáveis de Ambiente. Como o código estará na Nuvem, e não mais no Posto, adicione 5 novas variáveis com os dados do cliente:
   - Chave: `DB_HOST` | Valor: *O IP Público do Roteador do Cliente (Ex: 200.18.23.1)*
   - Chave: `DB_PORT` | Valor: *5432* (ou a porta que o cliente liberou)
   - Chave: `DB_NAME` | Valor: *Nome do banco de dados*
   - Chave: `DB_USER` | Valor: *Usuário de acesso web*
   - Chave: `DB_PASS` | Valor: *Senha do banco gerada pro cliente*
6. Role até o fim e clique em **Create Web Service**. 

O seu painel vai mostrar um terminal preto escrevendo várias coisas (o build). Quando terminar, lá no topo esquerdo do painel do Render, abaixo do nome do seu site, terá uma URL verde (Exemplo: `https://gfc-api-cliente-x.onrender.com`). **Copie essa URL!**

---

## 2. Ação Final: Configurando a Vercel (Front-end)

A sua API já está voando nas nuvens. Agora, vamos colocar o "Rosto" (Frontend) que vai consultar ela:

1. Acesse o painel da **Vercel** (`vercel.com`).
2. Adicione **Add New > Project**, selecione o MESMO Repositório seu do GitHub (`App-GFC-Template`).
3. O painel de Deploy aparecerá. Como a Vercel é super inteligente, ela já vai perceber que o Frontend está na pasta `frontend` e vai pré-configurar tudo sozinho.
4. Aqui está o Trunfo Final. Expanda a seção chamada **Environment Variables**:
   - Chave (Key): `NEXT_PUBLIC_API_URL`
   - Valor (Value): *Cole a URL verde que o Render gerou no passo anterior!* (Ficará algo parecido com `https://gfc-api-cliente-x.onrender.com`). 
   - > [!WARNING]
     > **Cuidado**: O valor da URL **NÃO** pode ter uma barra `/` no final, senão o link quebrará! Termine sempre no `.com` (ou na extensão dele sem a barra).
5. Clique em **Deploy**!

Pronto! Ao final do processamento da Vercel, ela gerará um site (ex: `app-gfc.vercel.app`). Você poderá abri-lo pelo próprio celular da sua casa, logar, e ver os gráficos consumindo do banco de dados do seu cliente de dentro do Posto dele, sem que o Agente Local Python precise estar instalado lá.
