-- Add retry_count column to scheduled_emails table
-- Run this in Supabase SQL Editor if the table already exists

ALTER TABLE scheduled_emails ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
