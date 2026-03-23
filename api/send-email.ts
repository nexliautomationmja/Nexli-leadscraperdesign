import type { VercelRequest, VercelResponse } from '@vercel/node';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INSTANTLY_API_KEY) {
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
  }

  try {
    const { to, subject, body, campaignId, leadId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

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
        from_email: 'justine@nexli.com', // Your COO's email
        from_name: 'Justine',
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
