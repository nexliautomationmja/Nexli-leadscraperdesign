-- Add variation tracking to email_logs table
-- Run this in your Supabase SQL Editor

-- Add variation column to email_logs
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS variation TEXT;

-- Add index for faster filtering by variation
CREATE INDEX IF NOT EXISTS idx_email_logs_variation
ON public.email_logs(variation);

-- Add check constraint to ensure valid variation values
ALTER TABLE public.email_logs
DROP CONSTRAINT IF EXISTS email_logs_variation_check;

ALTER TABLE public.email_logs
ADD CONSTRAINT email_logs_variation_check
CHECK (variation IN ('ai_disruption', 'cost_savings', 'time_efficiency'));

-- Optional: Add variation_name for human-readable display
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS variation_name TEXT;

COMMENT ON COLUMN public.email_logs.variation IS 'Email variation used for A/B testing: ai_disruption, cost_savings, or time_efficiency';
COMMENT ON COLUMN public.email_logs.variation_name IS 'Human-readable variation name for display';
