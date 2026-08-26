-- ============================================================
-- Admin master — Guia Comendador Soares
-- Execute no SQL Editor como:
--   SELECT create_master_admin();
-- ============================================================

CREATE OR REPLACE FUNCTION create_master_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auth_id uuid := '3a31ffda-2c63-43a3-994b-6a2a9bf3dc3c';
  _email   text  := 'comercial.guiacomendadorsoares@gmail.com';
BEGIN
  -- Insere ou atualiza profile
  INSERT INTO public.profiles (id, user_id, email, full_name, current_plan, plan_status, created_at, updated_at)
  VALUES (gen_random_uuid(), _auth_id, _email, 'Administrador', 'ouro', 'active', now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET full_name   = EXCLUDED.full_name,
        current_plan = EXCLUDED.current_plan,
        plan_status  = EXCLUDED.plan_status,
        updated_at   = now();

  -- Insere papel admin
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (_auth_id, 'admin', now())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Permite leitura pública de user_roles (para o hook de auth)
DROP POLICY IF EXISTS "public_read_user_roles" ON public.user_roles;
CREATE POLICY "public_read_user_roles" ON public.user_roles
  FOR SELECT USING (true);

-- Permite INSERT público via função (ignora RLS de insert)
DROP POLICY IF EXISTS "public_insert_user_roles" ON public.user_roles;
CREATE POLICY "public_insert_user_roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- Permite UPDATE público via função
DROP POLICY IF EXISTS "public_update_user_roles" ON public.user_roles;
CREATE POLICY "public_update_user_roles" ON public.user_roles
  FOR UPDATE USING (true) WITH CHECK (true);
