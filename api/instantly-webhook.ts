import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data } = req.body;

    // Events from Instantly:
    // - email_sent
    // - email_delivered
    // - email_opened
    // - email_clicked
    // - email_replied
    // - email_bounced

    console.log('Instantly webhook event:', event, data);

    // Extract campaign_id and lead_id from custom_fields
    const { campaign_id, lead_id } = data.custom_fields || {};

    // In a production app, you would:
    // 1. Update a database (Supabase, Firebase, etc.) with the event
    // 2. Trigger real-time updates to the client
    // 3. Send notifications if needed

    // For now, just log and acknowledge receipt
    return res.json({ success: true, received: event, campaign_id, lead_id });
  } catch (error: any) {
    console.error('Instantly webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
