import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { webhookUrl, to, subject, body, senderName } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Zapier webhookUrl is required' });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    // Send to Zapier webhook which triggers Gmail
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        senderName: senderName || 'Nexli Team',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Zapier error: ${errorText}` });
    }

    return res.json({ success: true, message: 'Email sent via Zapier' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
