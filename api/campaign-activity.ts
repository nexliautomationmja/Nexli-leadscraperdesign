import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, user_id } = req.body;
  if (!campaign_id || !user_id) {
    return res.status(400).json({ error: 'campaign_id and user_id required' });
  }

  try {
    // Fetch all email_logs for this campaign
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('user_id', user_id)
      .order('sent_at', { ascending: true });

    if (logsError) throw logsError;

    // Fetch all scheduled_emails for this campaign (including pending future ones)
    const { data: scheduled, error: schedError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('user_id', user_id)
      .order('scheduled_for', { ascending: true });

    if (schedError) throw schedError;

    return res.json({
      email_logs: logs || [],
      scheduled_emails: scheduled || [],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
