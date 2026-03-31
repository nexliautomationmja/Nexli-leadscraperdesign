import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender metadata
const SENDERS: Record<string, { name: string; role: string; photo: string | null }> = {
  'marcel@nexlioutreach.net': { name: 'Marcel Allen', role: 'Founder & CEO', photo: 'marcel.png' },
  'justine@nexlioutreach.net': { name: 'Justine Adams', role: 'COO', photo: 'justine.png' },
  'bernice@nexlioutreach.net': { name: 'Bernice Hall', role: 'Business Development Manager', photo: 'bernice.png' },
  'jian@nexlioutreach.net': { name: 'Jian Wei', role: 'CTO', photo: 'jian.png' },
};

const BASE_URL = 'https://leadscraper.nexli.net';

// Wrap plain text email body in branded HTML template
function wrapInTemplate(body: string, senderEmail: string): string {
  const sender = SENDERS[senderEmail.toLowerCase()];
  const senderName = sender?.name || 'Nexli';
  const senderRole = sender?.role || '';
  const firstName = senderName.split(' ')[0];

  // Convert plain text to HTML paragraphs
  const htmlBody = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p class="nx-text" style="color: #d1d5db; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n              ');

  // Sender avatar: photo or initial circle
  const avatarHtml = sender?.photo
    ? `<img src="${BASE_URL}/sender-photos/${sender.photo}" alt="${firstName}" width="44" height="44" style="border-radius: 50%; display: block;" />`
    : `<div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #2563EB, #06B6D4); text-align: center; line-height: 44px; color: white; font-size: 18px; font-weight: 600;">${firstName.charAt(0)}</div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<style>
  :root { color-scheme: dark light; }
  @media (prefers-color-scheme: light) {
    .nx-outer { background-color: #f3f4f6 !important; }
    .nx-header { background-color: #ffffff !important; }
    .nx-logo { color: #111827 !important; }
    .nx-body { background-color: #ffffff !important; }
    .nx-text { color: #374151 !important; }
    .nx-divider { border-top-color: #e5e7eb !important; }
    .nx-name { color: #111827 !important; }
    .nx-role { color: #6b7280 !important; }
    .nx-link { color: #2563EB !important; }
    .nx-footer { background-color: #ffffff !important; }
    .nx-footer-text { color: #9ca3af !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="nx-outer" style="padding: 24px; background-color: #ffffff;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <!-- Header -->
        <tr><td class="nx-header" style="background-color: #000000; border-radius: 12px 12px 0 0; padding: 24px 32px; text-align: center;">
          <a href="https://www.nexli.net" style="text-decoration: none; display: inline-block;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="display: inline-table;"><tr>
              <td style="vertical-align: middle;">
                <img src="${BASE_URL}/favicon.svg" alt="Nexli" width="32" height="32" style="display: block;" />
              </td>
              <td style="vertical-align: middle; padding-left: 10px;">
                <span class="nx-logo" style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 1px;">NEXLI</span>
              </td>
            </tr></table>
          </a>
        </td></tr>
        <!-- Gradient line -->
        <tr><td style="height: 3px; background: linear-gradient(to right, #2563EB, #06B6D4); font-size: 0; line-height: 0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td class="nx-body" style="background-color: #000000; padding: 36px 32px;">
              ${htmlBody}
              <!-- Signature divider -->
              <div class="nx-divider" style="border-top: 1px solid #2d3548; margin: 8px 0 24px 0;"></div>
              <!-- Sender signature -->
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align: top; padding-right: 14px;">
                  ${avatarHtml}
                </td>
                <td style="vertical-align: top;">
                  <p class="nx-name" style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 2px 0;">${senderName}</p>
                  <p class="nx-role" style="color: #9ca3af; font-size: 13px; margin: 0 0 2px 0;">${senderRole}</p>
                  <p style="margin: 0;"><a class="nx-link" href="https://www.nexli.net/rainmaker" style="color: #60a5fa; font-size: 13px; text-decoration: none;">nexli.net/rainmaker</a></p>
                </td>
              </tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td class="nx-footer" style="background-color: #000000; border-radius: 0 0 12px 12px; padding: 20px 32px; text-align: center;">
          <p class="nx-footer-text" style="color: #6b7280; font-size: 11px; margin: 0 0 4px 0;">NEXLI Outreach &bull; Automated Lead Intelligence</p>
          <p class="nx-footer-text" style="color: #4b5563; font-size: 11px; margin: 0;">You're receiving this because your profile matched our outreach criteria.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
  const sender = SENDERS[params.senderEmail.toLowerCase()];
  const senderName = sender?.name || 'Nexli';

  // Capitalize first letter of subject (unless it starts with a number)
  const subject = params.subject && /^[a-z]/.test(params.subject)
    ? params.subject.charAt(0).toUpperCase() + params.subject.slice(1)
    : params.subject;

  // Wrap plain text body in branded HTML template
  const html = wrapInTemplate(params.body, params.senderEmail);

  const { data, error } = await resend.emails.send({
    from: `${senderName} <${params.senderEmail.toLowerCase()}>`,
    to: [params.to],
    subject,
    html,
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
          campaign_id: email.campaign_id || null,
          lead_id: email.lead_id,
          lead_name: email.lead_name || '',
          lead_email: email.lead_email,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sender_name: email.sender_name,
          sender_email: email.sender_email,
          resend_id: resendResult.id,
          sequence_number: email.sequence_number || null,
        });

        let emailLogStatus = 'saved';
        if (logError) {
          console.error('Failed to insert email_log:', logError.message);
          // Try without newer columns in case migration hasn't run
          const { error: fallbackError } = await supabase.from('email_logs').insert({
            user_id: email.user_id,
            campaign_id: email.campaign_id || null,
            lead_id: email.lead_id,
            subject: email.subject,
            body: email.body,
            status: 'sent',
            sent_at: new Date().toISOString(),
            sender_name: email.sender_name,
            sender_email: email.sender_email,
            resend_id: resendResult.id,
          });
          emailLogStatus = fallbackError
            ? `both_failed: ${logError.message} / ${fallbackError.message}`
            : 'saved_without_lead_info';
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
