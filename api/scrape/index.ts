import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const LEAD_SCRAPER_ACTOR = 'pipelinelabs~lead-scraper-apollo-zoominfo-lusha';
const APIFY_BASE = 'https://api.apify.com/v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    const filters = req.body;

    const response = await fetch(
      `${APIFY_BASE}/acts/${LEAD_SCRAPER_ACTOR}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Try to parse JSON error response
      try {
        const errorJson = JSON.parse(errorText);

        // Check for specific error types
        if (errorJson.error?.type === 'actor-is-not-rented') {
          return res.status(402).json({
            error: '⚠️ Apify Free Trial Expired\n\nThe lead scraping actor needs to be rented.\n\nOptions:\n1. Rent at: https://console.apify.com/actors/VYRyEF4ygTTkaIghe\n2. Use a different free actor\n3. Contact support for alternatives',
            errorType: 'actor-is-not-rented',
            apifyUrl: 'https://console.apify.com/actors/VYRyEF4ygTTkaIghe'
          });
        }

        return res.status(response.status).json({
          error: `Apify error: ${errorJson.error?.message || errorText}`
        });
      } catch {
        // If not JSON, return raw text
        return res.status(response.status).json({ error: `Apify error: ${errorText}` });
      }
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
