
-- Create enums
CREATE TYPE public.food_type AS ENUM ('eggs', 'beans', 'fish', 'milk', 'meat');
CREATE TYPE public.availability_status AS ENUM ('available', 'limited', 'not_available');
CREATE TYPE public.validation_status AS ENUM ('pending', 'verified', 'flagged');

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  food_type public.food_type NOT NULL,
  availability public.availability_status NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  photo_url TEXT,
  reporter_id TEXT NOT NULL,
  validation_status public.validation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reporters table
CREATE TABLE public.reporters (
  id TEXT PRIMARY KEY,
  trust_score NUMERIC NOT NULL DEFAULT 0.5,
  total_reports INTEGER NOT NULL DEFAULT 0,
  verified_reports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporters ENABLE ROW LEVEL SECURITY;

-- Public read access for reports and reporters
CREATE POLICY "Anyone can read reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read reporters" ON public.reporters FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reporters" ON public.reporters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reporters" ON public.reporters FOR UPDATE USING (true);

-- Function to update reporter stats after a report is inserted
CREATE OR REPLACE FUNCTION public.update_reporter_on_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.reporters (id, total_reports, trust_score)
  VALUES (NEW.reporter_id, 1, 0.5)
  ON CONFLICT (id) DO UPDATE SET
    total_reports = reporters.total_reports + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_report_insert
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reporter_on_report();

-- Function to auto-verify markets with 3+ independent reports
CREATE OR REPLACE FUNCTION public.auto_verify_reports()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO report_count
  FROM public.reports
  WHERE market_name = NEW.market_name
    AND food_type = NEW.food_type
    AND validation_status != 'flagged';

  IF report_count >= 3 THEN
    UPDATE public.reports
    SET validation_status = 'verified'
    WHERE market_name = NEW.market_name
      AND food_type = NEW.food_type
      AND validation_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_report_auto_verify
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_reports();

-- Indexes
CREATE INDEX idx_reports_market ON public.reports (market_name);
CREATE INDEX idx_reports_created ON public.reports (created_at DESC);
