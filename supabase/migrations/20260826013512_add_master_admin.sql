-- Adiciona profile e papel admin para o usuário master do site

-- Insere profile para o usuário criado no Supabase Auth
INSERT INTO public.profiles (id, user_id, email, full_name, current_plan, plan_status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '3a31ffda-2c63-43a3-994b-6a2a9bf3dc3c',
  'comercial.guiacomendadorsoares@gmail.com',
  'Administrador',
  'ouro',
  'active',
  now(),
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- Insere papel admin para o usuário
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES ('3a31ffda-2c63-43a3-994b-6a2a9bf3dc3c', 'admin', now())
ON CONFLICT (user_id, role) DO NOTHING;
