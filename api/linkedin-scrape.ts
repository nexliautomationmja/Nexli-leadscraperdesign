import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
// LinkedIn People Search actor — harvestapi/linkedin-profile-search
// 958k+ runs, 4.8/5 stars, no LinkedIn cookies required.
// $0.10 per search page (25 profiles) + $0.004 per full profile.
// Override via env var if you swap actors.
const LINKEDIN_PEOPLE_ACTOR =
  process.env.APIFY_LINKEDIN_PEOPLE_ACTOR || 'harvestapi~linkedin-profile-search';
const APIFY_BASE = 'https://api.apify.com/v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    // Forward whatever shape the frontend sends. The frontend constructs the
    // exact actor input (search keywords, titles, location, maxResults, etc.)
    // so this endpoint stays a thin pass-through — same pattern as /api/scrape.
    const input = req.body;

    const response = await fetch(
      `${APIFY_BASE}/acts/${LINKEDIN_PEOPLE_ACTOR}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Try to parse Apify error JSON for better messages
      try {
        const errorJson = JSON.parse(errorText);

        if (errorJson.error?.type === 'actor-is-not-rented') {
          return res.status(402).json({
            error: `LinkedIn scraper actor is not rented.\n\nRent the actor in Apify console to use this feature.`,
            errorType: 'actor-is-not-rented',
            actor: LINKEDIN_PEOPLE_ACTOR,
            apifyUrl: `https://console.apify.com/actors/${LINKEDIN_PEOPLE_ACTOR.replace('~', '/')}`,
          });
        }

        return res.status(response.status).json({
          error: `Apify error: ${errorJson.error?.message || errorText}`,
        });
      } catch {
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
