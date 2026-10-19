GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_property_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.submitted_by := actor;
    IF public.has_role(actor, 'admin') THEN
      NEW.status := 'approved';
      NEW.approved_by := actor;
      NEW.approved_at := now();
      NEW.rejection_reason := NULL;
    ELSE
      NEW.status := 'pending';
      NEW.approved_by := NULL;
      NEW.approved_at := NULL;
      NEW.rejection_reason := NULL;
    END IF;
  ELSIF NOT public.has_role(actor, 'admin') THEN
    NEW.submitted_by := OLD.submitted_by;
    NEW.status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_pending ON public.properties;
CREATE TRIGGER trg_enforce_property_approval BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.enforce_property_approval();
DROP POLICY IF EXISTS "admin update all" ON public.properties;
CREATE POLICY "admin update all" ON public.properties FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
