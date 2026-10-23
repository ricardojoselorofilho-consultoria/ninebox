-- =====================================================================
--  RDF Consultoria · Avaliação 360º e Matriz Nine Box
--  Estrutura do banco (Supabase / PostgreSQL)
--
--  Como usar: no Supabase, abra "SQL Editor" > "New query", cole TODO
--  este arquivo e clique em "Run". Depois rode o 02_primeiro_acesso.sql.
--
--  Regras de acesso:
--    • Só e-mails cadastrados em "usuarios_autorizados" conseguem criar conta.
--    • Papel "rh": vê e gerencia tudo.
--    • Papel "gestor": vê resultados apenas dos colaboradores da própria equipe
--      (colaboradores.gestor_email = e-mail do gestor).
--    • Colaboradores NÃO têm conta: respondem pelo link único (token) do convite.
-- =====================================================================

-- ---------- Tabelas ----------

create table if not exists public.usuarios_autorizados (
  email       text primary key check (email = lower(email)),
  nome        text not null,
  papel       text not null check (papel in ('rh', 'gestor')),
  created_at  timestamptz not null default now()
);

create table if not exists public.colaboradores (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text,
  area          text,
  cargo         text,
  gestor_email  text references public.usuarios_autorizados(email) on update cascade on delete set null,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.ciclos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  status      text not null default 'aberto' check (status in ('aberto', 'encerrado')),
  created_at  timestamptz not null default now()
);

create table if not exists public.convites (
  id             uuid primary key default gen_random_uuid(),
  ciclo_id       uuid not null references public.ciclos(id) on delete cascade,
  token          text not null unique
                 default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  tipo           text not null check (tipo in ('auto', 'par', 'gestor')),
  avaliador_id   uuid not null references public.colaboradores(id) on delete cascade,
  avaliado_id    uuid not null references public.colaboradores(id) on delete cascade,
  status         text not null default 'pendente' check (status in ('pendente', 'respondido')),
  criado_por     text default lower(coalesce(auth.jwt() ->> 'email', '')),
  created_at     timestamptz not null default now(),
  respondido_em  timestamptz,
  constraint convite_auto_coerente check ((tipo = 'auto') = (avaliador_id = avaliado_id)),
  constraint convite_unico unique (ciclo_id, tipo, avaliador_id, avaliado_id)
);

create table if not exists public.respostas (
  convite_id  uuid primary key references public.convites(id) on delete cascade,
  notas       smallint[] not null
              check (array_length(notas, 1) = 20 and 1 <= all (notas) and 5 >= all (notas)),
  created_at  timestamptz not null default now()
);

create index if not exists convites_ciclo_idx    on public.convites (ciclo_id);
create index if not exists convites_avaliado_idx on public.convites (avaliado_id);
create index if not exists colab_gestor_idx      on public.colaboradores (gestor_email);

-- ---------- Funções auxiliares de permissão ----------

create or replace function public.meu_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.meu_papel()
returns text language sql stable security definer set search_path = public as $$
  select papel from public.usuarios_autorizados where email = public.meu_email()
$$;

create or replace function public.is_rh()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.meu_papel() = 'rh', false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.meu_papel() is not null
$$;

-- Verdadeiro se o usuário é RH ou se o colaborador pertence à equipe do gestor logado
create or replace function public.e_da_minha_equipe(p_colaborador uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_rh() or exists (
    select 1 from public.colaboradores c
    where c.id = p_colaborador and c.gestor_email = public.meu_email()
  )
$$;

-- ---------- Segurança em nível de linha (RLS) ----------

alter table public.usuarios_autorizados enable row level security;
alter table public.colaboradores        enable row level security;
alter table public.ciclos               enable row level security;
alter table public.convites             enable row level security;
alter table public.respostas            enable row level security;

-- Visitantes sem login não acessam nenhuma tabela diretamente
revoke all on public.usuarios_autorizados, public.colaboradores, public.ciclos,
              public.convites, public.respostas from anon;

-- usuarios_autorizados
drop policy if exists ua_select on public.usuarios_autorizados;
drop policy if exists ua_write  on public.usuarios_autorizados;
create policy ua_select on public.usuarios_autorizados for select to authenticated
  using (public.is_admin());
create policy ua_write on public.usuarios_autorizados for all to authenticated
  using (public.is_rh()) with check (public.is_rh());

-- colaboradores: todos os administradores leem a lista (para escolher pares);
-- gestor só cria/edita/remove os da própria equipe.
drop policy if exists col_select on public.colaboradores;
drop policy if exists col_insert on public.colaboradores;
drop policy if exists col_update on public.colaboradores;
drop policy if exists col_delete on public.colaboradores;
create policy col_select on public.colaboradores for select to authenticated
  using (public.is_admin());
create policy col_insert on public.colaboradores for insert to authenticated
  with check (public.is_rh() or (public.is_admin() and gestor_email = public.meu_email()));
create policy col_update on public.colaboradores for update to authenticated
  using (public.is_rh() or gestor_email = public.meu_email())
  with check (public.is_rh() or gestor_email = public.meu_email());
create policy col_delete on public.colaboradores for delete to authenticated
  using (public.is_rh() or gestor_email = public.meu_email());

-- ciclos: todos leem; só RH cria, encerra ou apaga
drop policy if exists cic_select on public.ciclos;
drop policy if exists cic_write  on public.ciclos;
create policy cic_select on public.ciclos for select to authenticated
  using (public.is_admin());
create policy cic_write on public.ciclos for all to authenticated
  using (public.is_rh()) with check (public.is_rh());

-- convites: gestor vê e cria convites cujo AVALIADO é da sua equipe
drop policy if exists conv_select on public.convites;
drop policy if exists conv_insert on public.convites;
drop policy if exists conv_delete on public.convites;
create policy conv_select on public.convites for select to authenticated
  using (public.e_da_minha_equipe(avaliado_id) or criado_por = public.meu_email());
create policy conv_insert on public.convites for insert to authenticated
  with check (public.e_da_minha_equipe(avaliado_id));
create policy conv_delete on public.convites for delete to authenticated
  using (public.is_rh() or (public.e_da_minha_equipe(avaliado_id) and status = 'pendente'));

-- respostas: leitura só para RH ou gestor do avaliado. Gravação só pela função enviar_avaliacao.
drop policy if exists resp_select on public.respostas;
create policy resp_select on public.respostas for select to authenticated
  using (exists (
    select 1 from public.convites v
    where v.id = convite_id and public.e_da_minha_equipe(v.avaliado_id)
  ));

-- ---------- Funções públicas usadas pelo link do colaborador ----------

create or replace function public.obter_convite(p_token text)
returns table (tipo text, avaliador text, avaliado text, ciclo text, status text, ciclo_aberto boolean)
language sql stable security definer set search_path = public as $$
  select v.tipo, a.nome, b.nome, c.nome, v.status, (c.status = 'aberto')
  from public.convites v
  join public.colaboradores a on a.id = v.avaliador_id
  join public.colaboradores b on b.id = v.avaliado_id
  join public.ciclos c        on c.id = v.ciclo_id
  where v.token = p_token
$$;

create or replace function public.enviar_avaliacao(p_token text, p_notas smallint[])
returns void language plpgsql security definer set search_path = public as $$
declare
  conv record;
begin
  select v.id, v.status, c.status as ciclo_status
    into conv
    from public.convites v
    join public.ciclos c on c.id = v.ciclo_id
   where v.token = p_token
   for update of v;

  if not found then
    raise exception 'Link de avaliação inválido.';
  end if;
  if conv.status <> 'pendente' then
    raise exception 'Esta avaliação já foi respondida.';
  end if;
  if conv.ciclo_status <> 'aberto' then
    raise exception 'Este ciclo de avaliação já foi encerrado.';
  end if;
  if coalesce(array_length(p_notas, 1), 0) <> 20
     or not (1 <= all (p_notas) and 5 >= all (p_notas)) then
    raise exception 'Responda as 20 perguntas com notas de 1 a 5.';
  end if;

  insert into public.respostas (convite_id, notas) values (conv.id, p_notas);
  update public.convites set status = 'respondido', respondido_em = now() where id = conv.id;
end
$$;

revoke all on function public.obter_convite(text)                 from public;
revoke all on function public.enviar_avaliacao(text, smallint[])  from public;
grant execute on function public.obter_convite(text)                to anon, authenticated;
grant execute on function public.enviar_avaliacao(text, smallint[]) to anon, authenticated;
grant execute on function public.meu_papel() to authenticated;

-- ---------- Trava de cadastro: só e-mails autorizados criam conta ----------

create or replace function public.bloquear_cadastro_nao_autorizado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.usuarios_autorizados where email = lower(new.email)) then
    raise exception 'E-mail não autorizado para acessar o painel.';
  end if;
  return new;
end
$$;

drop trigger if exists antes_criar_usuario on auth.users;
create trigger antes_criar_usuario
  before insert on auth.users
  for each row execute function public.bloquear_cadastro_nao_autorizado();
