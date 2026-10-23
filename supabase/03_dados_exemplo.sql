-- =====================================================================
--  OPCIONAL: dados de exemplo (1 ciclo, 6 pessoas, 15 avaliações respondidas)
--  para ver o dashboard funcionando antes de cadastrar a equipe real.
--  Rode DEPOIS do 02_primeiro_acesso.sql. Todos ficam na equipe do primeiro
--  usuário RH cadastrado. Para remover depois: apague o ciclo
--  "Ciclo de exemplo" e os colaboradores de exemplo na tela Colaboradores.
-- =====================================================================
do $$
declare
  v_gestor text := (select email from public.usuarios_autorizados where papel = 'rh' order by created_at limit 1);
  v_ciclo  uuid;
  v_conv   uuid;
begin
  if v_gestor is null then
    raise exception 'Rode primeiro o 02_primeiro_acesso.sql';
  end if;

  insert into public.ciclos (nome) values ('Ciclo de exemplo') returning id into v_ciclo;

  create temporary table tmp_p (nome text primary key, id uuid) on commit drop;

  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Marcos Lima', 'Comercial', 'Gerente Comercial (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Marcos Lima', id from x;
  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Ana Ribeiro', 'Comercial', 'Executiva de Contas (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Ana Ribeiro', id from x;
  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Bruno Teixeira', 'Comercial', 'Vendedor Sênior (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Bruno Teixeira', id from x;
  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Carla Mendes', 'Operações', 'Analista de Processos (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Carla Mendes', id from x;
  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Diego Alves', 'Operações', 'Assistente Operacional (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Diego Alves', id from x;
  with x as (insert into public.colaboradores (nome, area, cargo, gestor_email)
             values ('Elisa Prado', 'Comercial', 'Analista de CRM (exemplo)', v_gestor) returning id)
  insert into tmp_p select 'Elisa Prado', id from x;

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'auto', (select id from tmp_p where nome = 'Ana Ribeiro'), (select id from tmp_p where nome = 'Ana Ribeiro'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{5,4,4,5,4,4,4,5,4,5,5,4,4,5,4,5,4,5,4,5}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'par', (select id from tmp_p where nome = 'Carla Mendes'), (select id from tmp_p where nome = 'Ana Ribeiro'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{5,4,4,5,4,5,4,5,4,5,5,5,4,5,4,5,4,5,4,5}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'gestor', (select id from tmp_p where nome = 'Marcos Lima'), (select id from tmp_p where nome = 'Ana Ribeiro'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{5,5,4,5,4,5,4,5,4,5,5,5,4,5,4,5,4,5,5,5}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'auto', (select id from tmp_p where nome = 'Bruno Teixeira'), (select id from tmp_p where nome = 'Bruno Teixeira'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{5,5,4,5,4,5,4,5,4,5,4,4,4,5,4,4,4,5,4,4}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'par', (select id from tmp_p where nome = 'Elisa Prado'), (select id from tmp_p where nome = 'Bruno Teixeira'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{5,4,4,5,4,4,4,5,4,5,3,3,2,3,2,3,2,3,2,3}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'gestor', (select id from tmp_p where nome = 'Marcos Lima'), (select id from tmp_p where nome = 'Bruno Teixeira'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,4,4,4,4,4,4,4,4,4,2,2,2,3,2,2,2,3,2,2}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'auto', (select id from tmp_p where nome = 'Carla Mendes'), (select id from tmp_p where nome = 'Carla Mendes'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{3,3,3,4,3,3,3,4,3,3,4,4,4,5,4,4,4,5,4,4}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'par', (select id from tmp_p where nome = 'Ana Ribeiro'), (select id from tmp_p where nome = 'Carla Mendes'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,3,3,4,3,4,3,4,3,4,5,4,4,5,4,4,4,5,4,5}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'gestor', (select id from tmp_p where nome = 'Marcos Lima'), (select id from tmp_p where nome = 'Carla Mendes'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,3,3,4,3,3,3,4,3,4,5,4,4,5,4,4,4,5,4,4}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'auto', (select id from tmp_p where nome = 'Diego Alves'), (select id from tmp_p where nome = 'Diego Alves'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'par', (select id from tmp_p where nome = 'Bruno Teixeira'), (select id from tmp_p where nome = 'Diego Alves'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{3,2,2,3,2,3,2,3,2,3,3,2,2,3,2,2,2,3,2,3}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'gestor', (select id from tmp_p where nome = 'Marcos Lima'), (select id from tmp_p where nome = 'Diego Alves'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{2,2,2,2,2,2,2,2,2,2,2,2,2,3,2,2,2,2,2,2}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'auto', (select id from tmp_p where nome = 'Elisa Prado'), (select id from tmp_p where nome = 'Elisa Prado'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,4,3,4,3,4,3,4,3,4,4,3,3,4,3,4,3,4,3,4}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'par', (select id from tmp_p where nome = 'Diego Alves'), (select id from tmp_p where nome = 'Elisa Prado'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,3,3,4,3,3,3,4,3,4,4,3,3,4,3,3,3,4,3,3}');

  insert into public.convites (ciclo_id, tipo, avaliador_id, avaliado_id, status, respondido_em, criado_por)
  values (v_ciclo, 'gestor', (select id from tmp_p where nome = 'Marcos Lima'), (select id from tmp_p where nome = 'Elisa Prado'), 'respondido', now(), v_gestor)
  returning id into v_conv;
  insert into public.respostas (convite_id, notas) values (v_conv, '{4,3,3,4,3,4,3,4,3,4,4,3,3,4,3,3,3,4,3,4}');

end
$$;
