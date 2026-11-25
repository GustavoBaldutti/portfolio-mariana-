-- =====================================================================
--  Maari Mobile · configuração do painel (rodar UMA vez no Supabase)
--  Supabase → SQL Editor → New query → cole tudo → Run
--
--  ANTES DE RODAR: troque o e-mail na linha marcada com  <<< TROQUE
-- =====================================================================

-- Quem pode entrar no painel ------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- ninguém lê pela internet

insert into public.admins (email)
values ('email-da-mariana@exemplo.com')   -- <<< TROQUE pelo e-mail de login da Mariana
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Trabalhos do portfólio -----------------------------------------------------
create table if not exists public.trabalhos (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  categoria  text not null check (categoria in ('marcas', 'casamentos', 'eventos', 'reels')),
  capa_url   text,
  video_url  text,
  formato    text not null default 'normal' check (formato in ('normal', 'alto', 'largo')),
  ordem      integer not null default 0,
  visivel    boolean not null default true,
  criado_em  timestamptz not null default now()
);
alter table public.trabalhos enable row level security;

drop policy if exists "site lê trabalhos visíveis" on public.trabalhos;
create policy "site lê trabalhos visíveis" on public.trabalhos
  for select using (visivel or public.is_admin());

drop policy if exists "admin cria trabalhos" on public.trabalhos;
create policy "admin cria trabalhos" on public.trabalhos
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita trabalhos" on public.trabalhos;
create policy "admin edita trabalhos" on public.trabalhos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin apaga trabalhos" on public.trabalhos;
create policy "admin apaga trabalhos" on public.trabalhos
  for delete to authenticated using (public.is_admin());

-- Fotos fixas do site (topo, sobre e cards de serviço) -----------------------
create table if not exists public.fotos_site (
  slot          text primary key,
  url           text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.fotos_site enable row level security;

drop policy if exists "site lê fotos" on public.fotos_site;
create policy "site lê fotos" on public.fotos_site
  for select using (true);

drop policy if exists "admin cria fotos" on public.fotos_site;
create policy "admin cria fotos" on public.fotos_site
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita fotos" on public.fotos_site;
create policy "admin edita fotos" on public.fotos_site
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin apaga fotos" on public.fotos_site;
create policy "admin apaga fotos" on public.fotos_site
  for delete to authenticated using (public.is_admin());

-- Pasta de arquivos (fotos e vídeos), pública para leitura -------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midia', 'midia', true, 52428800,  -- 50 MB por arquivo (limite do plano grátis)
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin vê arquivos" on storage.objects;
create policy "admin vê arquivos" on storage.objects
  for select to authenticated using (bucket_id = 'midia' and public.is_admin());

drop policy if exists "admin envia arquivos" on storage.objects;
create policy "admin envia arquivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'midia' and public.is_admin());

drop policy if exists "admin troca arquivos" on storage.objects;
create policy "admin troca arquivos" on storage.objects
  for update to authenticated using (bucket_id = 'midia' and public.is_admin());

drop policy if exists "admin apaga arquivos" on storage.objects;
create policy "admin apaga arquivos" on storage.objects
  for delete to authenticated using (bucket_id = 'midia' and public.is_admin());
