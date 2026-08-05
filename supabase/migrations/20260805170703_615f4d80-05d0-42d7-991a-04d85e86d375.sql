-- Revogar acesso de execução para funções SECURITY DEFINER restantes que dispararam o linter
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_pending_on_insert() FROM anon, authenticated;

-- Garantir acesso ao service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
