import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender display names
const SENDER_NAMES: Record<string, string> = {
  'marcel@nexlioutreach.net': 'Marcel',
  'justine@nexlioutreach.net': 'Justine',
  'bernice@nexlioutreach.net': 'Bernice',
  'jian@nexlioutreach.net': 'Jian',
};

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Send an email via Resend
async function sendViaResend(params: {
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
}): Promise<{ id: string }> {
  const senderName = SENDER_NAMES[params.senderEmail.toLowerCase()] || 'Nexli';

  // Capitalize first letter of subject (unless it starts with a number)
  const subject = params.subject && /^[a-z]/.test(params.subject)
    ? params.subject.charAt(0).toUpperCase() + params.subject.slice(1)
    : params.subject;

  const { data, error } = await resend.emails.send({
    from: `${senderName} <${params.senderEmail.toLowerCase()}>`,
    to: [params.to],
    subject,
    html: params.body,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return { id: data!.id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    const { to, subject, body, fromEmail, checkScheduled } = req.body;

    // Handle scheduled email checking
    if (checkScheduled) {
      return await handleScheduledEmails(res);
    }

    // Handle regular email sending
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    const result = await sendViaResend({
      to,
      subject,
      body,
      senderEmail: fromEmail || 'justine@nexlioutreach.net',
    });

    return res.json({ success: true, resendId: result.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Handle scheduled email sending
async function handleScheduledEmails(res: VercelResponse) {
  const diagnostics: any[] = [];

  try {
    // Step 1: Check env vars
    diagnostics.push({
      step: 'env_check',
      supabase_url: process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      resend_api_key: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    });

    // Step 2: Query Supabase for pending emails due now
    const now = new Date().toISOString();
    diagnostics.push({ step: 'query_time', now });

    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (fetchError) {
      diagnostics.push({ step: 'supabase_error', error: fetchError.message, code: fetchError.code });
      return res.status(500).json({ error: 'Failed to fetch scheduled emails', diagnostics });
    }

    // Also check ALL emails in table for debugging
    const { data: allEmails, error: allError } = await supabase
      .from('scheduled_emails')
      .select('id, status, scheduled_for, lead_email, lead_name, sender_email')
      .order('created_at', { ascending: false })
      .limit(10);

    diagnostics.push({
      step: 'supabase_query',
      pending_due_count: scheduledEmails?.length || 0,
      all_recent_emails: allEmails || [],
      all_query_error: allError?.message || null,
    });

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return res.status(200).json({ message: 'No scheduled emails to send', sent: 0, diagnostics });
    }

    let sentCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const email of scheduledEmails) {
      try {
        // Send via Resend
        const resendResult = await sendViaResend({
          to: email.lead_email,
          subject: email.subject,
          body: email.body,
          senderEmail: email.sender_email || 'justine@nexlioutreach.net',
        });

        // Mark as sent in scheduled_emails
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        // Log to email_logs with Resend ID for webhook tracking
        const { error: logError } = await supabase.from('email_logs').insert({
          user_id: email.user_id,
          campaign_id: null,
          lead_id: email.lead_id,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sender_name: email.sender_name,
          sender_email: email.sender_email,
          resend_id: resendResult.id,
        });

        let emailLogStatus = 'saved';
        if (logError) {
          console.error('Failed to insert email_log:', logError.message);
          // Try without resend_id column in case migration hasn't run
          const { error: fallbackError } = await supabase.from('email_logs').insert({
            user_id: email.user_id,
            campaign_id: null,
            lead_id: email.lead_id,
            subject: email.subject,
            body: email.body,
            status: 'sent',
            sent_at: new Date().toISOString(),
            sender_name: email.sender_name,
            sender_email: email.sender_email,
          });
          emailLogStatus = fallbackError
            ? `both_failed: ${logError.message} / ${fallbackError.message}`
            : 'saved_without_resend_id';
        }

        results.push({
          lead: email.lead_email,
          sender: email.sender_email,
          status: 'success',
          resend_id: resendResult.id,
          email_log: emailLogStatus,
        });

        sentCount++;
      } catch (error: any) {
        results.push({
          lead: email.lead_email,
          sender: email.sender_email,
          status: 'failed',
          error: error.message,
        });

        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        failedCount++;
      }
    }

    diagnostics.push({ step: 'results', results });

    return res.status(200).json({
      message: `Sent ${sentCount} emails`,
      sent: sentCount,
      failed: failedCount,
      total: scheduledEmails.length,
      diagnostics,
    });
  } catch (error: any) {
    diagnostics.push({ step: 'fatal_error', error: error.message });
    return res.status(500).json({ error: error.message, diagnostics });
  }
}
