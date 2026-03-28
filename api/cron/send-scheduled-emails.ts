import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'justine@nexli.com';
const FROM_NAME = process.env.FROM_NAME || 'Justine';

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends GET requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!INSTANTLY_API_KEY) {
    console.error('INSTANTLY_API_KEY not configured');
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
  }

  try {
    const now = new Date().toISOString();

    // Fetch pending emails that are due (scheduled_for <= now)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process in batches to avoid timeout

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch scheduled emails', details: fetchError.message });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return res.status(200).json({ message: 'No scheduled emails to send', sent: 0, failed: 0 });
    }

    console.log(`Found ${pendingEmails.length} scheduled emails to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const email of pendingEmails) {
      try {
        // Use the sender from the scheduled email (rotation was applied at schedule time)
        const senderEmail = email.sender_email || FROM_EMAIL;
        const senderName = email.sender_name || FROM_NAME;

        // Send via Instantly.ai direct send endpoint
        const sendResponse = await fetch('https://api.instantly.ai/api/v1/send/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
          },
          body: JSON.stringify({
            to: email.lead_email,
            subject: email.subject,
            body: email.body,
            from_email: senderEmail,
            from_name: senderName,
            track_opens: true,
            track_clicks: true,
          }),
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          throw new Error(`Instantly API ${sendResponse.status}: ${errorText}`);
        }

        // Mark as sent in database
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        // Log the sent email
        await supabase.from('email_logs').insert({
          user_id: email.user_id,
          campaign_id: 'scheduled',
          lead_id: email.lead_id,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sender_name: senderName,
          sender_email: senderEmail,
        });

        console.log(`Sent to ${email.lead_name} (${email.lead_email})`);
        sentCount++;
      } catch (error: any) {
        console.error(`Failed to send to ${email.lead_name}:`, error.message);

        // Increment retry count or mark as failed after 3 attempts
        const retryCount = (email.retry_count || 0) + 1;

        if (retryCount >= 3) {
          // Mark as failed permanently after 3 retries
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: `Failed after ${retryCount} attempts: ${error.message}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', email.id);
        } else {
          // Keep as pending but log the error for retry on next cron run
          await supabase
            .from('scheduled_emails')
            .update({
              retry_count: retryCount,
              error_message: `Attempt ${retryCount} failed: ${error.message}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', email.id);
        }

        failedCount++;
      }
    }

    console.log(`Cron complete: ${sentCount} sent, ${failedCount} failed out of ${pendingEmails.length}`);

    return res.status(200).json({
      message: `Processed ${pendingEmails.length} emails`,
      sent: sentCount,
      failed: failedCount,
      total: pendingEmails.length,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}
