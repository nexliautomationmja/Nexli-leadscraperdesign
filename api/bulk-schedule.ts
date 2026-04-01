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

  const { emails, campaign_id, user_id } = req.body;

  if (!emails || !Array.isArray(emails) || !campaign_id || !user_id) {
    return res.status(400).json({ error: 'emails array, campaign_id, and user_id required' });
  }

  try {
    let totalInserted = 0;
    let failedInserts = 0;
    const errors: string[] = [];

    // Batch insert in chunks of 200 (safe payload size with service role)
    const BATCH_SIZE = 200;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('scheduled_emails').insert(batch);
      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        failedInserts += batch.length;
      } else {
        totalInserted += batch.length;
      }
    }

    return res.json({
      success: true,
      totalInserted,
      failedInserts,
      totalRequested: emails.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
