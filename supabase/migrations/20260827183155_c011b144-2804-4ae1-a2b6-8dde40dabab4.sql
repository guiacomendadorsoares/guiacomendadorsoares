GRANT SELECT ON TABLE public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;