import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map Resend event types to email_logs status values
const EVENT_TO_STATUS: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'bounced',
};

// Status priority — only upgrade, never downgrade (except bounced always overrides)
const STATUS_PRIORITY = ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    const resendEmailId = data?.email_id;

    if (!resendEmailId || !type) {
      return res.status(400).json({ error: 'Missing type or email_id' });
    }

    const newStatus = EVENT_TO_STATUS[type];
    if (!newStatus) {
      return res.json({ success: true, skipped: true, type });
    }

    // Find the email_log row matching this resend_id
    const { data: existing } = await supabase
      .from('email_logs')
      .select('id, status')
      .eq('resend_id', resendEmailId)
      .single();

    if (existing) {
      const currentPriority = STATUS_PRIORITY.indexOf(existing.status);
      const newPriority = STATUS_PRIORITY.indexOf(newStatus);

      // Only update if new status is higher priority (or bounced always overrides)
      if (newPriority > currentPriority || newStatus === 'bounced') {
        await supabase
          .from('email_logs')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    }

    return res.json({ success: true, type, resendEmailId });
  } catch (error: any) {
    console.error('Resend webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
