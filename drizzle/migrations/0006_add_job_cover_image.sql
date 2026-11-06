ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cover_url text;
COMMENT ON COLUMN public.jobs.cover_url IS 'Optional job image displayed on the Home card.';