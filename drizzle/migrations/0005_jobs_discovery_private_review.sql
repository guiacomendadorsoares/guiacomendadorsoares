ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url text, ADD COLUMN IF NOT EXISTS source_name text, ADD COLUMN IF NOT EXISTS discovered boolean NOT NULL DEFAULT false;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_discovered_source_unique ON public.jobs(source_url) WHERE discovered AND source_url IS NOT NULL;
DROP POLICY IF EXISTS "admin read all" ON public.jobs;
CREATE POLICY "admin read all" ON public.jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR (NOT discovered AND public.has_role(auth.uid(),'editor')));
DROP POLICY IF EXISTS "owner read own" ON public.jobs;
CREATE POLICY "owner read own" ON public.jobs FOR SELECT TO authenticated USING (submitted_by=auth.uid() AND NOT discovered);
CREATE OR REPLACE FUNCTION public.enforce_jobs_discovery_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.discovered AND NOT NEW.discovered THEN RAISE EXCEPTION 'A origem da vaga não pode ser alterada.'; END IF;
  IF NEW.discovered THEN
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Somente administradores podem gerenciar vagas descobertas.'; END IF;
    IF TG_OP='INSERT' THEN NEW.status:='draft'; NEW.approved_by:=NULL; NEW.approved_at:=NULL;
    ELSIF NEW.status='approved' THEN
      IF btrim(NEW.title)='' OR btrim(NEW.company)='' OR btrim(NEW.location)='' OR coalesce(btrim(NEW.description),'')='' OR (coalesce(btrim(NEW.apply_url),'')='' AND coalesce(btrim(NEW.whatsapp),'')='') THEN RAISE EXCEPTION 'Revise os dados e o contato antes de publicar a vaga.'; END IF;
      IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN RAISE EXCEPTION 'Esta vaga está expirada.'; END IF;
      NEW.approved_by:=auth.uid(); NEW.approved_at:=now();
    ELSE NEW.approved_by:=NULL; NEW.approved_at:=NULL; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER z_enforce_jobs_discovery_review BEFORE INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.enforce_jobs_discovery_review();