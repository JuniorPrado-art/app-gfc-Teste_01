# Checklist de Migração para Nuvem e Backup

- [x] Criar a cópia de segurança `App-GFC-Hibrido` na raiz do usuário, ignorando `node_modules` e pastas de ambiente virtual `venv`.
- [x] Criar o arquivo `.gitignore` global na raiz de `App-GFC` bloqueando pastas temporárias e chaves de segurança.
- [x] Substituir dinamicamente a string `fetch(\`http://${window.location.hostname}:5000...`)` no Frontend Next.js para aceitar `process.env.NEXT_PUBLIC_API_URL` preparando-o para a Vercel.
- [x] Executar o `git init`, `git add .` e `git commit -m "Init V1 Nuvem"` no projeto base. (Também convertemos o sub-módulo do Next.js de volta para arquivos normais monitorados para funcionar bem como Template).
