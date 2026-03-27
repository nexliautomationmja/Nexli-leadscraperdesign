-- Create scheduled_emails table in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_company TEXT,
  lead_role TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX idx_scheduled_emails_status ON scheduled_emails(status);

-- Enable Row Level Security
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled emails"
  ON scheduled_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled emails"
  ON scheduled_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled emails"
  ON scheduled_emails FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled emails"
  ON scheduled_emails FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to update any scheduled email (for the API endpoint)
CREATE POLICY "Service role can update any scheduled email"
  ON scheduled_emails FOR UPDATE
  USING (true);

COMMENT ON TABLE scheduled_emails IS 'Stores scheduled emails that will be sent via Instantly.ai';
