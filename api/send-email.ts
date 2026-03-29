import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;

// Per-sender campaign IDs
const SENDER_CAMPAIGNS: Record<string, string | undefined> = {
  'marcel@nexlioutreach.net': process.env.INSTANTLY_CAMPAIGN_MARCEL,
  'justine@nexlioutreach.net': process.env.INSTANTLY_CAMPAIGN_JUSTINE,
  'bernice@nexlioutreach.net': process.env.INSTANTLY_CAMPAIGN_BERNICE,
  'jian@nexlioutreach.net': process.env.INSTANTLY_CAMPAIGN_JIAN,
};

// Fallback campaign ID
const DEFAULT_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get campaign ID based on sender email
function getCampaignForSender(senderEmail: string): string {
  const campaignId = SENDER_CAMPAIGNS[senderEmail.toLowerCase()] || DEFAULT_CAMPAIGN_ID;
  if (!campaignId) {
    throw new Error(`No campaign configured for sender: ${senderEmail}`);
  }
  return campaignId;
}

// Add a lead to an Instantly campaign via v2 API
async function addLeadToCampaign(lead: {
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  subject: string;
  body: string;
  senderEmail: string;
}) {
  const campaignId = getCampaignForSender(lead.senderEmail);

  // Capitalize first letter of subject (unless it starts with a number)
  const subject = lead.subject && /^[a-z]/.test(lead.subject)
    ? lead.subject.charAt(0).toUpperCase() + lead.subject.slice(1)
    : lead.subject;

  const response = await fetch('https://api.instantly.ai/api/v2/leads/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      skip_if_in_campaign: false,
      leads: [
        {
          email: lead.email,
          first_name: lead.firstName,
          last_name: lead.lastName,
          company_name: lead.companyName || '',
          personalization: lead.body,
          custom_variables: {
            email_subject: subject,
            email_body: lead.body,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instantly API error: ${errorText}`);
  }

  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INSTANTLY_API_KEY) {
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
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

    const result = await addLeadToCampaign({
      email: to,
      firstName: '',
      lastName: '',
      subject,
      body,
      senderEmail: fromEmail || 'justine@nexlioutreach.net',
    });

    return res.json({ success: true, data: result });
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
      instantly_api_key: INSTANTLY_API_KEY ? 'SET' : 'MISSING',
      campaigns: {
        marcel: process.env.INSTANTLY_CAMPAIGN_MARCEL ? 'SET' : 'MISSING',
        justine: process.env.INSTANTLY_CAMPAIGN_JUSTINE ? 'SET' : 'MISSING',
        bernice: process.env.INSTANTLY_CAMPAIGN_BERNICE ? 'SET' : 'MISSING',
        jian: process.env.INSTANTLY_CAMPAIGN_JIAN ? 'SET' : 'MISSING',
        fallback: DEFAULT_CAMPAIGN_ID ? 'SET' : 'MISSING',
      },
    });

    // Step 2: Query Supabase
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
        const nameParts = (email.lead_name || '').split(' ');

        const instantlyResult = await addLeadToCampaign({
          email: email.lead_email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          companyName: email.lead_company || '',
          subject: email.subject,
          body: email.body,
          senderEmail: email.sender_email || 'justine@nexlioutreach.net',
        });

        results.push({
          lead: email.lead_email,
          sender: email.sender_email,
          campaign: getCampaignForSender(email.sender_email || 'justine@nexlioutreach.net'),
          status: 'success',
          instantly_response: instantlyResult,
        });

        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        await supabase.from('email_logs').insert({
          user_id: email.user_id,
          campaign_id: 'scheduled',
          lead_id: email.lead_id,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sender_name: email.sender_name,
          sender_email: email.sender_email,
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
