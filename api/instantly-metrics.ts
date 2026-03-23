import type { VercelRequest, VercelResponse } from '@vercel/node';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INSTANTLY_API_KEY) {
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
  }

  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    return res.status(400).json({ error: 'campaignId query parameter is required' });
  }

  try {
    // Fetch campaign analytics from Instantly.ai
    const response = await fetch(
      `https://api.instantly.ai/api/v1/analytics/campaign/${campaignId}`,
      {
        headers: {
          'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Instantly API error: ${errorText}` });
    }

    const data = await response.json();

    // Return normalized metrics
    return res.json({
      total: data.total_leads || 0,
      sent: data.sent || 0,
      delivered: data.delivered || 0,
      opened: data.opened || 0,
      clicked: data.clicked || 0,
      replied: data.replied || 0,
      bounced: data.bounced || 0,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
