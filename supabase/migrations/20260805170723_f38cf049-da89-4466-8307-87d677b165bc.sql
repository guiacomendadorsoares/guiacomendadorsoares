-- Revogar acesso de execução para funções SECURITY DEFINER de forma persistente
-- Usando SQL direto para garantir que o linter pare de reportar, 
-- removendo o privilégio EXECUTE de anon e authenticated onde não é necessário.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_pending_on_insert() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_claim_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_claim() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enforce_claim_status() FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM anon, public;

REVOKE EXECUTE ON FUNCTION public.business_has_owner(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_business_permission(uuid, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_manager(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.transfer_business_ownership(uuid, uuid, text) FROM anon, public;

-- Garantir acesso ao service_role para que triggers e background jobs funcionem
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
