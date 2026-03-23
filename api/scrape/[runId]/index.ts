import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    const { runId } = req.query;

    const response = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Apify error: ${errorText}` });
    }

    const data = await response.json();
    return res.json({
      runId: data.data.id,
      status: data.data.status,
      datasetId: data.data.defaultDatasetId,
      startedAt: data.data.startedAt,
      finishedAt: data.data.finishedAt,
      stats: data.data.stats,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
