-- Add Resend tracking columns to email_logs table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Add resend_id column for webhook event matching
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS resend_id TEXT;

-- Add updated_at column for tracking status changes
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique index on resend_id for fast webhook lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_id) WHERE resend_id IS NOT NULL;

-- Add 'delivered' and 'clicked' as valid status values
-- (No constraint change needed if status is TEXT; if there's a CHECK constraint, update it)
DO $$
BEGIN
  -- Drop old check constraint if it exists
  ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_status_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;
