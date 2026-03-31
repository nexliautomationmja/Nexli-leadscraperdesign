-- Add sequence campaign columns to scheduled_emails table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Add sequence_number column (which step 1-14 in the sequence)
ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Add campaign_id column (links all sequence emails to a campaign)
ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS campaign_id TEXT;

-- Add index on campaign_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_campaign_id ON public.scheduled_emails(campaign_id) WHERE campaign_id IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scheduled_emails'
ORDER BY ordinal_position;
