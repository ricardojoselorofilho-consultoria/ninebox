-- =====================================================================
--  Primeiro acesso: cadastra VOCÊ como RH (administrador geral).
--
--  1. Troque o e-mail e o nome abaixo pelos seus (e-mail em minúsculas).
--  2. Rode no SQL Editor do Supabase.
--  3. Abra o site, clique em "Primeiro acesso" e crie sua senha com esse e-mail.
--
--  Depois disso, os demais usuários (RH e gestores) são cadastrados pelo
--  próprio site, na tela "Usuários".
-- =====================================================================

insert into public.usuarios_autorizados (email, nome, papel)
values ('ricardojoselorofilho@gmail.com', 'Ricardo', 'rh')
on conflict (email) do update set nome = excluded.nome, papel = excluded.papel;
