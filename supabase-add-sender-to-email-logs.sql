-- Add sender tracking columns to email_logs table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Add sender_name and sender_email columns
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sender_email TEXT;

-- Make campaign_id nullable TEXT-friendly (allow non-UUID values or NULL)
-- The column is already nullable, but we need to drop the foreign key constraint
-- so we can store NULL for scheduled emails (which don't have a campaigns table entry)
ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_campaign_id_fkey;

-- Also drop the lead_id foreign key constraint since scheduled emails
-- may reference leads that exist only in local state
ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_lead_id_fkey;

-- Add indexes for sender queries
CREATE INDEX IF NOT EXISTS idx_email_logs_sender_email ON public.email_logs(sender_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;
