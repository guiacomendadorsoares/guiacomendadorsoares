-- Revogar acesso público de funções SECURITY DEFINER críticas
-- Isso resolve os avisos do linter da Supabase sem quebrar a funcionalidade,
-- pois estas funções são usadas internamente por políticas de RLS e triggers.

-- 1. Funções de Auditoria e Notificação (Triggers)
REVOKE EXECUTE ON FUNCTION public.notify_claim_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_claim() FROM anon, authenticated;

-- 2. Funções de Permissão (Usadas em RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;

-- 3. Funções do Módulo de Reivindicação (RBAC)
REVOKE EXECUTE ON FUNCTION public.business_has_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_business_permission(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_business_manager(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_business_ownership(uuid, uuid, text) FROM anon;

-- 4. Funções de Negócio
REVOKE EXECUTE ON FUNCTION public.enforce_claim_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM anon;

-- Garantir que service_role mantenha acesso total
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
