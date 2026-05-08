-- ============================================================
-- SINTONIA - Schema do banco de dados
-- ============================================================
-- Como usar:
-- 1. Acesse seu projeto em supabase.com/dashboard
-- 2. Vá em "SQL Editor" no menu lateral
-- 3. Clique em "New query"
-- 4. Cole TUDO desse arquivo e clique em "Run"
-- ============================================================

-- ENUM de tipo de usuário
create type user_role as enum ('psicologa', 'paciente');

-- ============================================================
-- TABELA: profiles (estende auth.users do Supabase)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nome_completo text not null,
  role user_role not null default 'paciente',
  -- campos psicóloga
  crp text,
  -- campos paciente
  data_nascimento date,
  telefone text,
  psicologa_id uuid references public.profiles(id),
  -- LGPD
  aceite_lgpd boolean not null default false,
  aceite_lgpd_em timestamptz,
  -- timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_psicologa on public.profiles(psicologa_id);

-- ============================================================
-- TABELA: pacientes_info (anamnese e dados clínicos)
-- ============================================================
create table public.pacientes_info (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid not null references public.profiles(id) on delete cascade unique,
  queixa_principal text,
  historia_clinica text,
  medicamentos text,
  observacoes_psicologa text,
  temas_recorrentes text[],
  plano_terapeutico text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- TABELA: sessoes
-- ============================================================
create table public.sessoes (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid not null references public.profiles(id) on delete cascade,
  psicologa_id uuid not null references public.profiles(id) on delete cascade,
  data_agendada timestamptz not null,
  duracao_minutos int default 50,
  status text not null default 'agendada' check (status in ('agendada', 'em_andamento', 'concluida', 'cancelada', 'falta')),
  iniciada_em timestamptz,
  finalizada_em timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_sessoes_paciente on public.sessoes(paciente_id);
create index idx_sessoes_psicologa on public.sessoes(psicologa_id);
create index idx_sessoes_data on public.sessoes(data_agendada);

-- ============================================================
-- TABELA: transcricoes (Parte 2 vai usar)
-- ============================================================
create table public.transcricoes (
  id uuid default gen_random_uuid() primary key,
  sessao_id uuid not null references public.sessoes(id) on delete cascade,
  conteudo text not null,
  falante text check (falante in ('paciente', 'psicologa')),
  timestamp_segundos int,
  created_at timestamptz default now() not null
);

create index idx_transcricoes_sessao on public.transcricoes(sessao_id);

-- ============================================================
-- TABELA: resumos_ia (Parte 2 vai usar)
-- ============================================================
create table public.resumos_ia (
  id uuid default gen_random_uuid() primary key,
  sessao_id uuid not null references public.sessoes(id) on delete cascade unique,
  tema_principal text,
  pontos_principais text[],
  insights jsonb,
  sugestoes_proxima_sessao text,
  notas_psicologa text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - segurança crítica
-- ============================================================
alter table public.profiles enable row level security;
alter table public.pacientes_info enable row level security;
alter table public.sessoes enable row level security;
alter table public.transcricoes enable row level security;
alter table public.resumos_ia enable row level security;

-- PROFILES: cada usuário vê o próprio perfil + psicóloga vê seus pacientes
create policy "usuarios veem proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "psicologa ve seus pacientes"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'psicologa'
        and public.profiles.psicologa_id = me.id
    )
  );

create policy "usuarios atualizam proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "qualquer um pode criar perfil ao cadastrar"
  on public.profiles for insert
  with check (auth.uid() = id);

-- PACIENTES_INFO: paciente vê o próprio + psicóloga vê dos pacientes dela
create policy "paciente ve propria info"
  on public.pacientes_info for select
  using (auth.uid() = paciente_id);

create policy "psicologa ve info dos pacientes"
  on public.pacientes_info for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = pacientes_info.paciente_id
        and p.psicologa_id = auth.uid()
    )
  );

create policy "psicologa edita info dos pacientes"
  on public.pacientes_info for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = pacientes_info.paciente_id
        and p.psicologa_id = auth.uid()
    )
  );

create policy "paciente cria propria info"
  on public.pacientes_info for insert
  with check (auth.uid() = paciente_id);

-- SESSOES: ambos os lados veem suas sessões
create policy "psicologa ve suas sessoes"
  on public.sessoes for select
  using (auth.uid() = psicologa_id);

create policy "paciente ve suas sessoes"
  on public.sessoes for select
  using (auth.uid() = paciente_id);

create policy "psicologa gerencia sessoes"
  on public.sessoes for all
  using (auth.uid() = psicologa_id);

-- TRANSCRICOES E RESUMOS: só psicóloga (paciente não vê transcrições por padrão)
create policy "psicologa ve transcricoes"
  on public.transcricoes for all
  using (
    exists (
      select 1 from public.sessoes s
      where s.id = transcricoes.sessao_id and s.psicologa_id = auth.uid()
    )
  );

create policy "psicologa ve resumos"
  on public.resumos_ia for all
  using (
    exists (
      select 1 from public.sessoes s
      where s.id = resumos_ia.sessao_id and s.psicologa_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: criar profile automaticamente ao cadastrar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nome_completo, role, aceite_lgpd, aceite_lgpd_em)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome_completo', 'Usuário'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'paciente'),
    coalesce((new.raw_user_meta_data->>'aceite_lgpd')::boolean, false),
    case when (new.raw_user_meta_data->>'aceite_lgpd')::boolean = true then now() else null end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger pacientes_info_updated_at before update on public.pacientes_info
  for each row execute function public.handle_updated_at();

create trigger sessoes_updated_at before update on public.sessoes
  for each row execute function public.handle_updated_at();

create trigger resumos_ia_updated_at before update on public.resumos_ia
  for each row execute function public.handle_updated_at();
