import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to Vercel env vars
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Checking for scheduled emails to send...');

    // Get all pending emails that are due
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
      return res.status(200).json({
        message: 'No scheduled emails to send',
        sent: 0
      });
    }

    console.log(`📧 Found ${scheduledEmails.length} emails to send`);

    let sentCount = 0;
    let failedCount = 0;

    // Send each email
    for (const email of scheduledEmails) {
      try {
        console.log(`  → Sending to ${email.lead_name} (${email.lead_email})`);

        // Send via Instantly.ai
        const instantlyResponse = await fetch('https://api.instantly.ai/api/v1/lead/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.INSTANTLY_API_KEY!,
            campaign_id: process.env.INSTANTLY_CAMPAIGN_ID!,
            email: email.lead_email,
            first_name: email.lead_name.split(' ')[0],
            last_name: email.lead_name.split(' ').slice(1).join(' ') || '',
            company_name: email.lead_company || '',
            personalization: email.body,
            custom_subject: email.subject,
          }),
        });

        if (instantlyResponse.ok) {
          // Mark as sent
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          // Log the sent email
          await supabase
            .from('email_logs')
            .insert({
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

        // Mark as failed
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
    console.error('Error in send-scheduled-emails:', error);
    return res.status(500).json({ error: error.message });
  }
}
