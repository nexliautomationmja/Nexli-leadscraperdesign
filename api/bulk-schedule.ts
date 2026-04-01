import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEQ_DAY_OFFSETS = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, user_id, start_date, leads, sender_groups, subjects, themes, senders } = req.body;

  if (!campaign_id || !user_id || !start_date || !leads || !sender_groups || !subjects || !themes || !senders) {
    return res.status(400).json({
      error: 'campaign_id, user_id, start_date, leads, sender_groups, subjects, themes, and senders required',
    });
  }

  try {
    // Build lookup maps
    const leadMap = new Map<string, { id: string; name: string; email: string; company: string; role: string }>();
    for (const lead of leads) {
      leadMap.set(lead.id, lead);
    }
    const senderMap = new Map<string, { name: string; email: string }>();
    for (const s of senders) {
      senderMap.set(s.email, s);
    }

    const startDT = new Date(start_date);

    // Build all email payloads server-side
    const allPayloads: any[] = [];

    for (let step = 0; step < 14; step++) {
      const dayOffset = SEQ_DAY_OFFSETS[step];
      const scheduledDate = new Date(startDT);
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      const templateSubject = subjects[step] || `Email ${step + 1}`;
      const templateBody = themes[step] || '';

      for (const [senderEmail, leadIds] of Object.entries(sender_groups)) {
        const sender = senderMap.get(senderEmail);
        if (!sender) continue;

        for (const leadId of (leadIds as string[])) {
          const lead = leadMap.get(leadId);
          if (!lead) continue;

          const firstName = lead.name.split(' ')[0] || lead.name;
          allPayloads.push({
            id: randomUUID(),
            user_id,
            lead_id: lead.id,
            lead_name: lead.name,
            lead_email: lead.email,
            lead_company: lead.company || '',
            lead_role: lead.role || '',
            subject: templateSubject.replace(/\{firstName\}/g, firstName),
            body: templateBody.replace(/\{firstName\}/g, firstName),
            scheduled_for: scheduledDate.toISOString(),
            sender_name: sender.name,
            sender_email: sender.email,
            status: 'pending',
            sequence_number: step + 1,
            campaign_id,
          });
        }
      }
    }

    // PARALLEL batch insert — fire all batches at once to beat 10s Vercel timeout
    // 500 rows per batch × ~800 bytes each = ~400KB per batch (safe for Supabase)
    const BATCH_SIZE = 500;
    const batches: any[][] = [];
    for (let i = 0; i < allPayloads.length; i += BATCH_SIZE) {
      batches.push(allPayloads.slice(i, i + BATCH_SIZE));
    }

    // Fire ALL batches simultaneously
    const results = await Promise.all(
      batches.map((batch, idx) =>
        supabase.from('scheduled_emails').insert(batch).then(
          ({ error }) => ({ idx, count: batch.length, error }),
          (err: any) => ({ idx, count: batch.length, error: { message: err.message } })
        )
      )
    );

    let totalInserted = 0;
    let failedInserts = 0;
    const errors: string[] = [];

    for (const r of results) {
      if (r.error) {
        errors.push(`Batch ${r.idx + 1}: ${r.error.message}`);
        failedInserts += r.count;
      } else {
        totalInserted += r.count;
      }
    }

    return res.json({
      success: true,
      totalInserted,
      failedInserts,
      totalRequested: allPayloads.length,
      batchCount: batches.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
