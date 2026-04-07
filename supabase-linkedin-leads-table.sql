-- Create linkedin_leads table in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
--
-- This table stores LinkedIn-only leads (CPA firm owners) for direct LinkedIn / Sales Navigator outreach.
-- These are completely separate from the email-driven `leads` table — no campaign integration, no email sending.

CREATE TABLE IF NOT EXISTS linkedin_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  headline TEXT,
  profile_url TEXT NOT NULL,
  company TEXT,
  title TEXT,
  location TEXT,
  profile_image_url TEXT,
  followers INTEGER,
  connections INTEGER,
  last_activity_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  contact_status TEXT DEFAULT 'new', -- 'new' | 'messaged' | 'replied' | 'passed'
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  raw_data JSONB, -- full Apify response for any future fields
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_url) -- prevent duplicate profiles per user
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_user_id ON linkedin_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_favorite ON linkedin_leads(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_status ON linkedin_leads(user_id, contact_status);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_scraped_at ON linkedin_leads(user_id, scraped_at DESC);

-- Enable Row Level Security
ALTER TABLE linkedin_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop-then-create makes this script safe to re-run)
DROP POLICY IF EXISTS "Users can view their own linkedin leads" ON linkedin_leads;
CREATE POLICY "Users can view their own linkedin leads"
  ON linkedin_leads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own linkedin leads" ON linkedin_leads;
CREATE POLICY "Users can insert their own linkedin leads"
  ON linkedin_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own linkedin leads" ON linkedin_leads;
CREATE POLICY "Users can update their own linkedin leads"
  ON linkedin_leads FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own linkedin leads" ON linkedin_leads;
CREATE POLICY "Users can delete their own linkedin leads"
  ON linkedin_leads FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE linkedin_leads IS 'Stores LinkedIn profiles of active CPA firm owners scraped via Apify for direct LinkedIn / Sales Navigator outreach. Separate from the email-driven leads table.';
