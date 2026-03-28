-- Add missing columns to campaigns table
-- Run this in Supabase SQL Editor

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS follow_up_sequence JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS ab_test JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS scheduled_send JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to email_logs table
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sender_email TEXT;

-- Add retry_count to scheduled_emails table (if not already added)
ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
