GRANT SELECT ON TABLE public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.businesses TO authenticated;
GRANT ALL ON TABLE public.businesses TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;