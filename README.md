# Sintonia

Plataforma de telepsicologia com IA assistiva para psicólogas.

> **Status: Parte 1 de 2** — Login, banco de dados e gestão de pacientes funcionando. Videochamada e IA dos resumos chegam na Parte 2.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (auth + banco PostgreSQL + RLS)
- **Tailwind CSS**
- **Vercel** (deploy)

## O que já funciona nesta Parte 1

- Cadastro separado para psicóloga e paciente
- Termo de consentimento LGPD obrigatório
- Confirmação por e-mail
- Login com refresh automático de sessão
- Dashboard da psicóloga com lista de pacientes e próximas sessões reais do banco
- Tela do paciente com vínculo à psicóloga (paciente coloca o e-mail dela)
- Detalhamento de paciente (anamnese + histórico)
- Row Level Security: psicóloga só vê seus pacientes, paciente só vê própria info

## O que vem na Parte 2

- Videochamada via Daily.co
- Transcrição em tempo real via Groq Whisper
- Resumos e insights da IA via Claude API
- Anamnese inteligente
- Diário de humor

---

## Como subir esse projeto (passo a passo)

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto novo
2. Anote a senha do banco que você definir
3. Aguarde o projeto ficar pronto (~2 minutos)
4. Vá em **Settings → API** e anote:
   - `Project URL` (vai virar `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` (vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` (vai virar `SUPABASE_SERVICE_ROLE_KEY`)
5. Vá em **SQL Editor → New query**, cole TODO o conteúdo de `supabase/schema.sql` e clique em **Run**
6. Vá em **Authentication → Providers → Email** e desative `Confirm email` se quiser pular a confirmação por email durante os testes (depois reative em produção)

### 2. Subir no GitHub

```bash
cd sintonia-app
git init
git add .
git commit -m "Sintonia Parte 1: auth e dashboard"
git branch -M main
# crie o repo sintonia-app no github.com primeiro, depois:
git remote add origin git@github.com:SEU_USUARIO/sintonia-app.git
git push -u origin main
```

### 3. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New → Project**
2. Importe o repositório `sintonia-app`
3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```
4. Clique em **Deploy**
5. Em ~2 minutos seu app estará no ar em `sintonia-app.vercel.app`

### 4. Configurar URLs no Supabase

Depois do deploy:

1. Volte no Supabase em **Authentication → URL Configuration**
2. Em **Site URL**, coloque o domínio da Vercel: `https://sintonia-app.vercel.app`
3. Em **Redirect URLs**, adicione:
   - `https://sintonia-app.vercel.app/**`
   - `http://localhost:3000/**` (para desenvolvimento local)

### 5. Testar

1. Acesse o app na URL da Vercel
2. Cadastre uma conta como psicóloga (com CRP)
3. Em outro navegador (ou anônimo), cadastre uma conta como paciente
4. Como paciente, vincule-se à psicóloga pelo e-mail dela
5. Faça login como psicóloga e veja o paciente na lista

---

## Rodar localmente (opcional)

```bash
npm install
cp .env.example .env.local
# preencha .env.local com suas credenciais Supabase
npm run dev
```

Abra `http://localhost:3000`.

---

## Estrutura do projeto

```
sintonia-app/
├── app/
│   ├── auth/
│   │   ├── login/          # tela de login
│   │   ├── cadastro/       # tela de cadastro (psicóloga ou paciente)
│   │   └── callback/       # confirmação de email
│   ├── dashboard/          # dashboard da psicóloga
│   ├── pacientes/          # lista e detalhe de pacientes
│   ├── paciente/           # área do paciente
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # home (redireciona conforme login)
├── components/
│   ├── Logo.tsx
│   ├── LogoutButton.tsx
│   └── VincularPsicologa.tsx
├── lib/supabase/
│   ├── client.ts           # cliente para o navegador
│   └── server.ts           # cliente para Server Components
├── supabase/
│   └── schema.sql          # rodar no SQL Editor do Supabase
├── types/
│   └── database.ts         # tipos TypeScript
└── middleware.ts           # protege rotas
```

---

## Segurança e LGPD

- Senhas gerenciadas pelo Supabase Auth (bcrypt)
- Row Level Security (RLS) em todas as tabelas
- Termo de consentimento LGPD obrigatório no cadastro
- Service role key nunca exposta no cliente

## Próximos passos

Quando estiver tudo funcionando, me avise pra começarmos a Parte 2: videochamada + IA.
