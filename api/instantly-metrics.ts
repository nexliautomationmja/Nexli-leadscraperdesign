import type { VercelRequest, VercelResponse } from '@vercel/node';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;

// Per-sender campaign IDs
const SENDER_CAMPAIGNS: Record<string, string | undefined> = {
  marcel: process.env.INSTANTLY_CAMPAIGN_MARCEL,
  justine: process.env.INSTANTLY_CAMPAIGN_JUSTINE,
  bernice: process.env.INSTANTLY_CAMPAIGN_BERNICE,
  jian: process.env.INSTANTLY_CAMPAIGN_JIAN,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INSTANTLY_API_KEY) {
    return res.status(500).json({ error: 'INSTANTLY_API_KEY not configured' });
  }

  const { campaignId } = req.query;

  try {
    // If a specific campaign ID is provided, fetch just that one
    if (campaignId && typeof campaignId === 'string') {
      const metrics = await fetchCampaignAnalytics(campaignId);
      return res.json(metrics);
    }

    // Otherwise, fetch metrics for all 4 sender campaigns
    const results: Record<string, any> = {};
    const senderTotals = {
      total: 0,
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
    };

    for (const [sender, cId] of Object.entries(SENDER_CAMPAIGNS)) {
      if (!cId) {
        results[sender] = { error: 'Campaign ID not configured' };
        continue;
      }

      const metrics = await fetchCampaignAnalytics(cId);
      results[sender] = { campaignId: cId, ...metrics };

      // Aggregate totals
      senderTotals.total += metrics.total || 0;
      senderTotals.sent += metrics.sent || 0;
      senderTotals.opened += metrics.opened || 0;
      senderTotals.clicked += metrics.clicked || 0;
      senderTotals.replied += metrics.replied || 0;
      senderTotals.bounced += metrics.bounced || 0;
    }

    return res.json({
      senders: results,
      totals: senderTotals,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function fetchCampaignAnalytics(campaignId: string) {
  try {
    const response = await fetch(
      `https://api.instantly.ai/api/v2/campaigns/analytics/overview?id=${campaignId}`,
      {
        headers: {
          'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${errorText}` };
    }

    const data = await response.json();

    return {
      total: data.total_leads || data.total || 0,
      sent: data.sent || data.contacted || 0,
      delivered: data.delivered || 0,
      opened: data.unique_opened || data.opened || 0,
      clicked: data.unique_clicks || data.clicked || 0,
      replied: data.unique_replies || data.replied || 0,
      bounced: data.bounced || 0,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}
