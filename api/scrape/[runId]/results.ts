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
    const limit = (req.query.limit as string) || '100';
    const offset = (req.query.offset as string) || '0';

    // First get the datasetId from the run
    const runResponse = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );

    if (!runResponse.ok) {
      return res.status(runResponse.status).json({ error: 'Failed to get run info' });
    }

    const runData = await runResponse.json();
    const datasetId = runData.data.defaultDatasetId;

    // Fetch dataset items
    const dataResponse = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&limit=${limit}&offset=${offset}`
    );

    if (!dataResponse.ok) {
      return res.status(dataResponse.status).json({ error: 'Failed to get dataset' });
    }

    const items = await dataResponse.json();
    return res.json({
      total: parseInt(dataResponse.headers.get('x-apify-pagination-total') || '0'),
      count: items.length,
      items,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
