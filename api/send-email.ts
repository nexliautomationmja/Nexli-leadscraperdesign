import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'justine@nexli.com';
const FROM_NAME = process.env.FROM_NAME || 'Justine';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INSTANTLY_API_KEY) {
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
  }

  try {
    const { to, subject, body, campaignId, leadId, fromEmail, fromName, checkScheduled } = req.body;

    // Handle scheduled email checking
    if (checkScheduled) {
      return await handleScheduledEmails(res);
    }

    // Handle regular email sending

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    // Use dynamic sender (for rotation) or fall back to env variables
    const senderEmail = fromEmail || FROM_EMAIL;
    const senderName = fromName || FROM_NAME;

    // Send via Instantly.ai API
    const response = await fetch('https://api.instantly.ai/api/v1/send/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        from_email: senderEmail, // Rotated sender or default from env
        from_name: senderName,
        track_opens: true,
        track_clicks: true,
        custom_fields: {
          campaign_id: campaignId || '',
          lead_id: leadId || '',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Instantly API error: ${errorText}` });
    }

    const data = await response.json();
    return res.json({ success: true, messageId: data.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Handle scheduled email sending
async function handleScheduledEmails(res: VercelResponse) {
  try {
    console.log('🔍 Checking for scheduled emails to send...');

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
      console.log('✅ No scheduled emails to send');
      return res.status(200).json({ message: 'No scheduled emails to send', sent: 0 });
    }

    console.log(`📧 Found ${scheduledEmails.length} emails to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const email of scheduledEmails) {
      try {
        console.log(`  → Sending to ${email.lead_name} (${email.lead_email})`);

        const instantlyResponse = await fetch('https://api.instantly.ai/api/v1/send/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
          },
          body: JSON.stringify({
            to: email.lead_email,
            subject: email.subject,
            body: email.body,
            from_email: email.sender_email || FROM_EMAIL,
            from_name: email.sender_name || FROM_NAME,
            track_opens: true,
            track_clicks: true,
          }),
        });

        if (instantlyResponse.ok) {
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

          console.log(`  ✅ Sent to ${email.lead_name}`);
          sentCount++;
        } else {
          const errorText = await instantlyResponse.text();
          throw new Error(`Instantly API error: ${errorText}`);
        }
      } catch (error: any) {
        console.error(`  ❌ Failed to send to ${email.lead_name}:`, error.message);

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

    console.log(`✅ Sent ${sentCount} emails, ${failedCount} failed`);

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
