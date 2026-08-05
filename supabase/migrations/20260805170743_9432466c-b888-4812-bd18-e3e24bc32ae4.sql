-- Revogar acesso de execução para funções SECURITY DEFINER de usuários autenticados
-- Estas funções são usadas em políticas de RLS ou triggers, 
-- e não precisam ser chamadas diretamente via API REST pelos clientes.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.business_has_owner(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_business_permission(uuid, uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_manager(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.transfer_business_ownership(uuid, uuid, text) FROM authenticated;

-- Garantir que service_role tenha acesso total
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
