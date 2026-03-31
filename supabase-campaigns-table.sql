-- Campaigns Table Migration
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- ============================================
-- 1. Create campaigns table
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own campaigns
CREATE POLICY "Users can view own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for API endpoints)
CREATE POLICY "Service role full access"
  ON public.campaigns FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. Verify
-- ============================================
SELECT 'campaigns table' as check_type, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;
