import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;
const FROM_EMAIL = process.env.FROM_EMAIL || 'justine@nexli.com';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Add a lead to an Instantly campaign via v2 API
async function addLeadToCampaign(lead: {
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  subject: string;
  body: string;
}) {
  const campaignId = INSTANTLY_CAMPAIGN_ID;
  if (!campaignId) {
    throw new Error('INSTANTLY_CAMPAIGN_ID not configured');
  }

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
            email_subject: lead.subject,
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
    const { to, subject, body, checkScheduled } = req.body;

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
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Handle scheduled email sending
async function handleScheduledEmails(res: VercelResponse) {
  try {
    console.log('Checking for scheduled emails to send...');

    const now = new Date().toISOString();
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch scheduled emails' });
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('No scheduled emails to send');
      return res.status(200).json({ message: 'No scheduled emails to send', sent: 0 });
    }

    console.log(`Found ${scheduledEmails.length} emails to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const email of scheduledEmails) {
      try {
        console.log(`  Sending to ${email.lead_name} (${email.lead_email})`);

        const nameParts = (email.lead_name || '').split(' ');
        await addLeadToCampaign({
          email: email.lead_email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          companyName: email.lead_company || '',
          subject: email.subject,
          body: email.body,
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

        console.log(`  Sent to ${email.lead_name}`);
        sentCount++;
      } catch (error: any) {
        console.error(`  Failed to send to ${email.lead_name}:`, error.message);

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

    console.log(`Sent ${sentCount} emails, ${failedCount} failed`);

    return res.status(200).json({
      message: `Sent ${sentCount} emails`,
      sent: sentCount,
      failed: failedCount,
      total: scheduledEmails.length,
    });
  } catch (error: any) {
    console.error('Error in handleScheduledEmails:', error);
    return res.status(500).json({ error: error.message });
  }
}
