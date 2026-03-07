
-- Allow anyone to update report validation_status (for admin dashboard)
CREATE POLICY "Anyone can update reports" ON public.reports FOR UPDATE USING (true);
