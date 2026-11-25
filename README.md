# Maari Mobile · portfólio

Site estático (HTML, CSS e JS, sem build) com um **painel em `/admin`** onde a Mariana entra com e-mail e senha para adicionar, ordenar e esconder os vídeos e fotos do portfólio, e trocar as fotos fixas do site.

O painel usa o [Supabase](https://supabase.com) (plano grátis) para o login, para guardar os arquivos e para a lista de trabalhos. Enquanto ele não estiver conectado, o site continua funcionando com o conteúdo fixo do `index.html`.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `index.html`, `css/`, `js/main.js` | O site |
| `js/config.js` | Endereço e chave pública do Supabase (preencher uma vez) |
| `js/midia.js` | Reconhece links de YouTube, Vimeo, Instagram, TikTok e Google Drive |
| `admin/` | O painel (login, portfólio, fotos do site) |
| `supabase/setup.sql` | Cria as tabelas, a pasta de arquivos e as permissões |
| `marca/`, `fotos/` | Identidade visual e fotos padrão |

## Configuração (uma vez só, uns 15 minutos)

1. **Criar o projeto.** Crie uma conta grátis em supabase.com e clique em *New project*. Use a região *South America (São Paulo)* e guarde a senha do banco num lugar seguro.
2. **Criar as tabelas.** Abra `supabase/setup.sql`, troque `email-da-mariana@exemplo.com` pelo e-mail que a Mariana vai usar para entrar e cole o arquivo inteiro em *SQL Editor → New query → Run*.
3. **Criar o login da Mariana.** Em *Authentication → Users → Add user → Create new user*, use **o mesmo e-mail** do passo 2, defina uma senha e marque *Auto Confirm User*.
4. **Fechar novos cadastros.** Em *Authentication → Sign In / Providers*, desligue *Allow new users to sign up*. Assim ninguém mais consegue criar conta (e, mesmo que criasse, só o e-mail do passo 2 tem permissão no painel).
5. **Liberar o "Esqueci minha senha".** Em *Authentication → URL Configuration*, coloque o endereço do site em *Site URL* e adicione `https://SEU-SITE/admin/` em *Redirect URLs*.
6. **Conectar o site.** Em *Project Settings → API*, copie a *Project URL* e a chave *anon* / *publishable* para `js/config.js`:

   ```js
   window.MAARI_CONFIG = {
     supabaseUrl: 'https://abcdefghijkl.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...',
   };
   ```

   Essa chave é pública por natureza (o acesso é controlado pelas permissões do `setup.sql`). **Nunca** coloque aqui a chave *service_role* / *secret*.
7. **Publicar o site** do jeito de sempre e acessar `https://SEU-SITE/admin/`. Também há um link discreto "Área restrita" no rodapé.

Para dar acesso a mais alguém, crie o usuário no passo 3 e rode no *SQL Editor*:
`insert into public.admins (email) values ('outra-pessoa@exemplo.com');`

## Como usar o painel

- **Adicionar trabalho:** dê um nome, escolha a categoria e o vídeo:
  - **Colar um link** do YouTube, Vimeo, Instagram, TikTok ou Google Drive. Do YouTube, a capa vem automática.
  - **Enviar arquivo** de até 50 MB (bom para reels curtos). A capa é tirada automaticamente de um quadro do vídeo.
  - **Sem vídeo, só foto:** o trabalho abre a foto ampliada no site.
- **Capa:** qualquer foto do celular ou computador. Ela é reduzida automaticamente antes de enviar, para o site continuar rápido.
- **Tamanho na galeria:** *Normal*, *Alto* (ocupa duas linhas) ou *Largo* (linha inteira).
- **Ordem:** as setas ↑ ↓ de cada cartão. Trabalhos novos entram no topo.
- **Ocultar / Mostrar:** tira do site sem apagar.
- **Fotos do site:** troca a foto do topo, a do "Sobre" e as dos quatro cards de serviço. "Voltar à original" retorna à foto da pasta `fotos/`.

Tudo aparece no site na hora: basta recarregar a página.

## Limites do plano grátis

- **1 GB** de arquivos no total e **50 MB** por arquivo. Para vídeos longos (casamento completo, por exemplo), publique no YouTube como *não listado* ou no Vimeo e cole o link. Isso não ocupa espaço e o vídeo carrega melhor.
- O Supabase **pausa projetos grátis depois de 7 dias sem uso**. As visitas ao site contam como uso, e a automação `.github/workflows/manter-supabase-ativo.yml` faz uma consulta a cada 3 dias por garantia. Se mesmo assim pausar, é só entrar no painel do Supabase e clicar em *Restore*. Enquanto estiver pausado, o site mostra o conteúdo fixo do `index.html`.
