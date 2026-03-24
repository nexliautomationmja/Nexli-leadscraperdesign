const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  // Debug logging
  console.log('API Key exists:', !!ANTHROPIC_API_KEY);
  console.log('API Key length:', ANTHROPIC_API_KEY?.length || 0);
  console.log('All env vars:', Object.keys(process.env));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured',
      debug: {
        envVars: Object.keys(process.env),
        hasKey: !!ANTHROPIC_API_KEY
      }
    });
  }

  try {
    const { lead, posts } = req.body;

    const postSummary = (posts || [])
      .slice(0, 5)
      .map((p, i) => `Post ${i + 1}: "${(p.text || p.postText || '').slice(0, 300)}"`)
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

    // Parse JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const email = JSON.parse(jsonMatch[0]);
    return res.json(email);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
