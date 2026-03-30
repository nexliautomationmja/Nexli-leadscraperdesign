-- Add lead_name and lead_email columns to email_logs table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Add lead_name column
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS lead_name TEXT;

-- Add lead_email column
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS lead_email TEXT;

-- Backfill existing rows from the leads table
UPDATE public.email_logs el
SET
  lead_name = l.name,
  lead_email = l.email
FROM public.leads l
WHERE el.lead_id = l.id::text
  AND (el.lead_name IS NULL OR el.lead_email IS NULL);

-- Verify
SELECT id, lead_name, lead_email, subject, status, sender_email
FROM public.email_logs
ORDER BY sent_at DESC
LIMIT 20;
