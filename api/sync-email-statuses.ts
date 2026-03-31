import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map Resend statuses to our status values
const RESEND_STATUS_MAP: Record<string, string> = {
  sent: 'sent',
  delivered: 'delivered',
  opened: 'opened',
  clicked: 'clicked',
  bounced: 'bounced',
  complained: 'bounced',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Step 1: Get all email_logs for this user
    const { data: logs, error: logsError } = await supabase
      .from('email_logs')
      .select('id, resend_id, status, lead_email, subject, sent_at')
      .eq('user_id', user_id)
      .order('sent_at', { ascending: false });

    if (logsError) {
      return res.status(500).json({ error: logsError.message });
    }

    if (!logs || logs.length === 0) {
      return res.json({ message: 'No email logs found', updated: 0 });
    }

    let updated = 0;
    let matched = 0;
    let errors: string[] = [];

    // Step 2: For emails WITH resend_id, fetch status from Resend API
    const logsWithResendId = logs.filter(l => l.resend_id);
    const logsWithoutResendId = logs.filter(l => !l.resend_id);

    for (const log of logsWithResendId) {
      try {
        const { data: emailData } = await resend.emails.get(log.resend_id);
        if (emailData) {
          const lastEvent = emailData.last_event;
          const newStatus = lastEvent ? (RESEND_STATUS_MAP[lastEvent] || log.status) : log.status;

          if (newStatus !== log.status) {
            await supabase
              .from('email_logs')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', log.id);
            updated++;
          }
        }
      } catch (err: any) {
        errors.push(`${log.id}: ${err.message}`);
      }
    }

    // Step 3: For emails WITHOUT resend_id, try to find them via Resend's batch endpoint
    // We'll search by recipient email to try to match
    if (logsWithoutResendId.length > 0) {
      try {
        // Resend's list endpoint - fetch recent emails
        const response = await fetch('https://api.resend.com/emails', {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
        });

        if (response.ok) {
          const listData = await response.json();
          const resendEmails = listData.data || [];

          // Build a lookup map: recipient+subject → resend email
          for (const log of logsWithoutResendId) {
            // Try to find matching Resend email by recipient
            const match = resendEmails.find((re: any) => {
              const toMatch = Array.isArray(re.to)
                ? re.to.some((t: string) => t.toLowerCase() === log.lead_email?.toLowerCase())
                : re.to?.toLowerCase() === log.lead_email?.toLowerCase();
              return toMatch && re.subject === log.subject;
            });

            if (match) {
              const lastEvent = match.last_event;
              const newStatus = lastEvent ? (RESEND_STATUS_MAP[lastEvent] || 'sent') : 'sent';

              await supabase
                .from('email_logs')
                .update({
                  resend_id: match.id,
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', log.id);
              matched++;
              updated++;
            }
          }
        }
      } catch (err: any) {
        errors.push(`List fetch: ${err.message}`);
      }
    }

    return res.json({
      message: `Synced ${updated} email statuses`,
      updated,
      matched_missing_ids: matched,
      total_logs: logs.length,
      with_resend_id: logsWithResendId.length,
      without_resend_id: logsWithoutResendId.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
