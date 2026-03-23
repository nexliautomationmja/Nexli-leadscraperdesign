import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data } = req.body;

    // Instantly.ai uses "emails.all" event that captures all email activities
    // Event types within emails.all:
    // - sent, delivered, opened, clicked, replied, bounced, unsubscribed

    console.log('Instantly webhook event:', event, data);

    // Extract campaign_id and lead_id from custom_fields if available
    const { campaign_id, lead_id } = data?.custom_fields || {};

    // Extract event type from the data (e.g., "opened", "clicked", etc.)
    const eventType = data?.event_type || event;

    // In a production app, you would:
    // 1. Update a database (Supabase, Firebase, etc.) with the event
    // 2. Trigger real-time updates to the client
    // 3. Send notifications if needed
    // 4. Map event_type to update EmailLog status accordingly

    // For now, just log and acknowledge receipt
    return res.json({
      success: true,
      received: event,
      eventType,
      campaign_id,
      lead_id
    });
  } catch (error: any) {
    console.error('Instantly webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
