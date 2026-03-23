import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const LINKEDIN_POST_ACTOR = 'supreme_coder~linkedin-post';
const APIFY_BASE = 'https://api.apify.com/v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    const input = req.body;

    const response = await fetch(
      `${APIFY_BASE}/acts/${LINKEDIN_POST_ACTOR}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Apify error: ${errorText}` });
    }

    const data = await response.json();
    return res.json({
      runId: data.data.id,
      datasetId: data.data.defaultDatasetId,
      status: data.data.status,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
