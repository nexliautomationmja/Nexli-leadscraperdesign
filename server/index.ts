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

// --- Generate AI personalized email ---
app.post('/api/generate-email', async (req, res) => {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { lead, posts } = req.body;

    const postSummary = (posts || [])
      .slice(0, 5)
      .map((p: any, i: number) => `Post ${i + 1}: "${(p.text || p.postText || '').slice(0, 300)}"`)
      .join('\n');

    const prompt = `You are an expert cold email writer for Nexli, a premium automation agency that helps accounting firms scale with AI-powered solutions.

Write a short, personalized cold email to ${lead.name}, who is ${lead.role} at ${lead.company}.

${postSummary ? `Here are their recent LinkedIn posts for personalization:\n${postSummary}\n\nReference ONE specific post naturally in the opening line.` : 'No LinkedIn posts available, so use their role and company for personalization.'}

Requirements:
- Subject line: 6-10 words, curiosity-driven, NO spam words
- Body: 3-4 short paragraphs max
- Opening: Reference their LinkedIn activity or role specifically
- Value prop: How Nexli's AI automation can help their accounting firm save time, reduce manual work, or scale
- CTA: Soft ask for a quick 15-min call
- Tone: Professional but conversational, not salesy
- Sign off as "The Nexli Team"

Return ONLY valid JSON with this exact format:
{"subject": "your subject line", "body": "your email body"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Claude API error: ${errorText}` });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const email = JSON.parse(jsonMatch[0]);
    return res.json(email);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Push leads to CRM webhook ---
app.post('/api/webhook', async (req, res) => {
  try {
    const { webhookUrl, leads } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array is required' });
    }

    const results: { name: string; success: boolean; error?: string }[] = [];

    for (const lead of leads) {
      try {
        const nameParts = (lead.name || '').split(' ');
        const payload = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: lead.email || '',
          phone: lead.phone || '',
          companyName: lead.company || '',
          website: lead.orgWebsite || '',
          tags: ['nexli-scraper', lead.orgIndustry || 'accounting'].filter(Boolean),
          customField: {
            role: lead.role || '',
            linkedin: lead.linkedin || '',
            city: lead.city || '',
            state: lead.state || '',
            country: lead.country || '',
            companySize: lead.orgSize || '',
            industry: lead.orgIndustry || '',
            leadScore: lead.score || 0,
            source: 'Nexli Lead Scraper',
          },
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        results.push({ name: lead.name, success: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` });
      } catch (err: any) {
        results.push({ name: lead.name, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return res.json({ total: leads.length, success: successCount, failed: leads.length - successCount, results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Send email via Zapier webhook ---
app.post('/api/send-email', async (req, res) => {
  try {
    const { webhookUrl, to, subject, body, senderName } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'Zapier webhookUrl is required' });
    }
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, senderName: senderName || 'Nexli Team' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Zapier error: ${errorText}` });
    }

    return res.json({ success: true, message: 'Email sent via Zapier' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Nexli API server running on http://localhost:${PORT}`);
});
