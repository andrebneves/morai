# Banco de dados — Moraí (Supabase)

O Moraí funciona sem banco de dados nenhum (modo demonstrativo, 100% local). Esta seção é para quando
você quiser um **banco compartilhado real** — necessário para que cadastros feitos por um usuário
apareçam para todos os outros usuários (requisito do teste de rua com várias pessoas).

## 1. Criar o projeto Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) (tier free é suficiente para esta
   fase de testes).
2. Crie um novo projeto (escolha uma região próxima, ex. `sa-east-1` — São Paulo).
3. Anote a senha do banco gerada (ou defina a sua) — só é necessária para acesso direto via `psql`, não
   para o app.

## 2. Rodar o schema

1. No painel do projeto, vá em **SQL Editor** → **New query**.
2. Cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e execute.

Isso cria:

- **`properties`** — tabela principal de imóveis, com coluna geográfica `geom`
  (`geography(Point, 4326)`, gerada automaticamente a partir de `lat`/`lng`) e índice `GiST` para buscas
  espaciais eficientes.
- **`admins`** — lista de usuários (por `user_id` do Supabase Auth) com permissão de moderação.
- **`feedback`** — mensagens enviadas pela tela "Ajude a melhorar o Moraí".
- **Bucket de Storage `property-photos`** — público para leitura, upload exige usuário autenticado.
- **Row Level Security (RLS)** habilitado em todas as tabelas desde o início (ver política abaixo).

## 3. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # Project Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # Project Settings → API → service_role (secret!)
```

- As duas primeiras (`NEXT_PUBLIC_*`) são expostas ao navegador — são seguras para isso porque o acesso
  real é controlado por RLS, não pelo segredo da chave.
- `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta ao cliente. É usada apenas pelo script
  `scripts/seed-supabase.mjs`, rodado localmente pelo desenvolvedor, para popular o banco com os 100
  imóveis demonstrativos ignorando RLS.

Na Vercel, configure essas mesmas variáveis em **Project Settings → Environment Variables**.

## 4. Popular o banco com os imóveis demonstrativos

```powershell
npm run seed:push
```

Isso lê `src/lib/data/properties.json` (gerado por `npm run seed:generate`) e insere cada imóvel na
tabela `properties` com `demo: true`, usando a service role key (bypassa RLS para a inserção em massa).

## 5. Criar o primeiro administrador

Para moderar cadastros (`/admin`), um usuário precisa existir na tabela `admins`:

1. Crie uma conta normalmente pela tela de login do Supabase Auth (pode usar o próprio painel do
   Supabase: **Authentication → Users → Add user**, ou implemente um fluxo de login no app).
2. No SQL Editor, rode:
   ```sql
   insert into admins (user_id)
   values ('UUID-DO-USUARIO-AQUI');
   ```
   (o UUID aparece na lista de usuários em **Authentication → Users**).

## Modelo de dados — `properties`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | `text` (PK) | `morai-demo-NNN` para seed, `user-<timestamp>` para cadastros |
| `demo` | `boolean` | `true` = imóvel fictício do seed; `false` = cadastrado por usuário real |
| `status` | `text` | `pendente` (aguardando moderação) → `disponivel` (visível publicamente) → `reservado`/`indisponivel` |
| `owner_id` | `uuid` | Referencia `auth.users`; nulo para imóveis do seed |
| `geom` | `geography(Point,4326)` | Gerada automaticamente a partir de `lat`/`lng`, indexada (GiST) |
| `caracteristicas` | `jsonb` | Mapa de booleans (piscina, varanda, aceita animais, etc.) |
| `historico_precos` | `jsonb` | Array de `{ date, price }` |
| `fotos` | `jsonb` | Array de URLs (picsum.photos para seed, Supabase Storage para reais) |

## Políticas de RLS (resumo)

- **Leitura pública**: qualquer pessoa (mesmo não autenticada) pode ler imóveis com
  `status = 'disponivel'` ou `demo = true`.
- **Inserção**: apenas usuários autenticados podem inserir, e só podem definir `owner_id` como o próprio
  `auth.uid()` (ou nulo).
- **Leitura/edição do próprio cadastro**: o dono vê e edita seus próprios imóveis mesmo enquanto
  `pendente`.
- **Administradores**: membros da tabela `admins` têm acesso total (`select`/`update`/`delete`) a todos
  os imóveis, para moderação.
- **Feedback**: qualquer pessoa pode inserir; apenas administradores podem ler as mensagens enviadas.

## Sem Supabase configurado

`src/lib/supabase/client.ts` e `server.ts` expõem `isSupabaseConfigured()`, que checa se as env vars
`NEXT_PUBLIC_SUPABASE_*` estão presentes. Todo o código do app (`getAllProperties()`, `/anunciar`,
`/admin`, feedback) checa essa função antes de tentar usar o Supabase, e cai de volta para
`localStorage`/dados estáticos quando ele não está configurado. Isso significa que você pode desenvolver
e testar o app inteiro sem nunca criar um projeto Supabase.
