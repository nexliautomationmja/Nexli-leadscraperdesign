import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SENDERS = ['marcel', 'justine', 'bernice', 'jian'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results: Record<string, any> = {};
    const totals = { total: 0, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 };

    for (const sender of SENDERS) {
      const email = `${sender}@nexlioutreach.net`;

      const { data: logs } = await supabase
        .from('email_logs')
        .select('status')
        .ilike('sender_email', email);

      const senderLogs = logs || [];
      const metrics = {
        sent: senderLogs.length,
        delivered: senderLogs.filter(l => ['delivered', 'opened', 'clicked', 'replied'].includes(l.status)).length,
        opened: senderLogs.filter(l => ['opened', 'clicked', 'replied'].includes(l.status)).length,
        clicked: senderLogs.filter(l => ['clicked', 'replied'].includes(l.status)).length,
        replied: senderLogs.filter(l => l.status === 'replied').length,
        bounced: senderLogs.filter(l => l.status === 'bounced').length,
      };

      results[sender] = metrics;
      totals.total += metrics.sent;
      totals.sent += metrics.sent;
      totals.opened += metrics.opened;
      totals.clicked += metrics.clicked;
      totals.replied += metrics.replied;
      totals.bounced += metrics.bounced;
    }

    return res.json({
      senders: results,
      totals,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
