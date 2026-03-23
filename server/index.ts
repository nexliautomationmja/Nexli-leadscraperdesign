import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const LEAD_SCRAPER_ACTOR = 'pipelinelabs~lead-scraper-apollo-zoominfo-lusha';
const LINKEDIN_POST_ACTOR = 'supreme_coder~linkedin-post';
const APIFY_BASE = 'https://api.apify.com/v2';

// --- Health check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasToken: !!APIFY_TOKEN });
});

// --- Start a lead scrape run ---
app.post('/api/scrape', async (req, res) => {
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
});

// --- Check run status ---
app.get('/api/scrape/:runId', async (req, res) => {
  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    const { runId } = req.params;
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
});

// --- Get results from a completed run ---
app.get('/api/scrape/:runId/results', async (req, res) => {
  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: 'APIFY_TOKEN not configured' });
  }

  try {
    const { runId } = req.params;
    const limit = req.query.limit || '100';
    const offset = req.query.offset || '0';

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
});

// --- Start a LinkedIn post scrape ---
app.post('/api/linkedin-posts', async (req, res) => {
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Nexli API server running on http://localhost:${PORT}`);
});
