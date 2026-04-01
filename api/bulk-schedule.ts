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

  const { campaign_id, user_id, start_date, leads, sender_groups, subjects, themes, senders, step_start, step_end } = req.body;

  if (!campaign_id || !user_id || !start_date || !leads || !sender_groups || !subjects || !themes || !senders) {
    return res.status(400).json({
      error: 'Missing required fields',
    });
  }

  const fromStep = typeof step_start === 'number' ? step_start : 0;
  const toStep = typeof step_end === 'number' ? step_end : 13;

  try {
    const leadMap = new Map<string, { id: string; name: string; email: string; company: string; role: string }>();
    for (const lead of leads) {
      leadMap.set(lead.id, lead);
    }
    const senderMap = new Map<string, { name: string; email: string }>();
    for (const s of senders) {
      senderMap.set(s.email, s);
    }

    const startDT = new Date(start_date);
    const allPayloads: any[] = [];

    for (let step = fromStep; step <= toStep; step++) {
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

    // Insert in 2 sequential batches max (~460 rows each for 5 steps × 184 leads)
    let totalInserted = 0;
    let failedInserts = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 500;

    for (let i = 0; i < allPayloads.length; i += BATCH_SIZE) {
      const batch = allPayloads.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('scheduled_emails').insert(batch);
      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} (steps ${fromStep + 1}-${toStep + 1}): ${error.message}`);
        failedInserts += batch.length;
      } else {
        totalInserted += batch.length;
      }
    }

    return res.json({
      success: true,
      totalInserted,
      failedInserts,
      stepsProcessed: `${fromStep + 1}-${toStep + 1}`,
      totalBuilt: allPayloads.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
