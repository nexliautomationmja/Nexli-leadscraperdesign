import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Paginated fetch to bypass Supabase max-rows limit (default 1000)
async function fetchAll(table: string, filters: Record<string, string>, orderCol: string) {
  const PAGE_SIZE = 1000;
  let allRows: any[] = [];
  let page = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select('*')
      .order(orderCol, { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }

    const { data, error } = await query;
    if (error) throw error;

    allRows = allRows.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    page++;
  }

  return allRows;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, user_id } = req.body;
  if (!campaign_id || !user_id) {
    return res.status(400).json({ error: 'campaign_id and user_id required' });
  }

  try {
    const filters = { campaign_id, user_id };

    const [logs, scheduled] = await Promise.all([
      fetchAll('email_logs', filters, 'sent_at'),
      fetchAll('scheduled_emails', filters, 'scheduled_for'),
    ]);

    return res.json({
      email_logs: logs,
      scheduled_emails: scheduled,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
