DROP POLICY IF EXISTS "auth insert" ON public.events;
CREATE POLICY "auth insert"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());