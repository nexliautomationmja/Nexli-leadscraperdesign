import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEQ_DAY_OFFSETS = [0, 2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32];

interface LeadInfo {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
}

interface SenderInfo {
  name: string;
  email: string;
}

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
    // Build a lookup map for leads
    const leadMap = new Map<string, LeadInfo>();
    for (const lead of leads) {
      leadMap.set(lead.id, lead);
    }

    // Build a lookup map for senders
    const senderMap = new Map<string, SenderInfo>();
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

    // Batch insert in chunks of 100 (safe payload size for Supabase)
    let totalInserted = 0;
    let failedInserts = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < allPayloads.length; i += BATCH_SIZE) {
      const batch = allPayloads.slice(i, i + BATCH_SIZE);
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
      totalRequested: allPayloads.length,
      totalBuilt: allPayloads.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
