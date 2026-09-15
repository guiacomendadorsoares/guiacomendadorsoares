GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.businesses TO authenticated;
GRANT ALL ON TABLE public.businesses TO service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT EXECUTE ON FUNCTION public.is_business_manager(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_business_permission(uuid, uuid, text) TO authenticated;