ALTER TABLE public.news ADD COLUMN IF NOT EXISTS source_url text, ADD COLUMN IF NOT EXISTS source_name text, ADD COLUMN IF NOT EXISTS source_date text;
ALTER TABLE public.news ALTER COLUMN published SET DEFAULT false;
DROP POLICY IF EXISTS "auth insert" ON public.news;
DROP POLICY IF EXISTS "owner update own draft" ON public.news;
DROP POLICY IF EXISTS "admin update all" ON public.news;
DROP POLICY IF EXISTS "admin read all" ON public.news;
DROP POLICY IF EXISTS "public read approved" ON public.news;
CREATE POLICY "news admin insert" ON public.news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "news admin update" ON public.news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "news admin read" ON public.news FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "news published read" ON public.news FOR SELECT TO anon, authenticated USING (published = true AND status = 'approved');
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
CREATE OR REPLACE FUNCTION public.enforce_news_admin_publication() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Somente administradores podem cadastrar ou publicar notícias'; END IF;
 IF NEW.published THEN
  NEW.status := 'approved';
  IF TG_OP = 'INSERT' THEN NEW.published_at := now(); NEW.approved_at := now(); NEW.approved_by := auth.uid();
  ELSIF NOT OLD.published THEN NEW.published_at := now(); NEW.approved_at := now(); NEW.approved_by := auth.uid(); END IF;
 ELSE NEW.status := 'draft'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER z_enforce_news_admin_publication BEFORE INSERT OR UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.enforce_news_admin_publication();