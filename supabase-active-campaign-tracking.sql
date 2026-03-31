-- Active Campaign Tracking Migration
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- ============================================
-- 1. Add campaign tracking columns to LEADS table
-- ============================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS in_campaign BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS active_campaign_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS active_campaign_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for fast filtering of in-campaign leads
CREATE INDEX IF NOT EXISTS idx_leads_in_campaign ON public.leads(in_campaign) WHERE in_campaign = true;

-- ============================================
-- 2. Add sequence_number to EMAIL_LOGS table
-- ============================================
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sequence_number INTEGER;

-- Index for campaign + step queries (activity tracker)
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_step ON public.email_logs(campaign_id, sequence_number) WHERE campaign_id IS NOT NULL;

-- ============================================
-- 3. Backfill campaign_id and sequence_number
--    from scheduled_emails into email_logs
--    (recovers linkage broken by the null bug)
-- ============================================
UPDATE public.email_logs el
SET
  campaign_id = se.campaign_id,
  sequence_number = se.sequence_number
FROM public.scheduled_emails se
WHERE se.status = 'sent'
  AND se.lead_email = el.lead_email
  AND se.sender_email = el.sender_email
  AND se.subject = el.subject
  AND el.campaign_id IS NULL
  AND se.campaign_id IS NOT NULL;

-- ============================================
-- 4. Verify changes
-- ============================================
SELECT 'leads columns' as check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name IN ('in_campaign', 'active_campaign_id', 'active_campaign_name')
UNION ALL
SELECT 'email_logs columns', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_logs' AND column_name IN ('sequence_number', 'campaign_id')
ORDER BY check_type, column_name;
