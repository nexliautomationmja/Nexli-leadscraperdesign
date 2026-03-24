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

    const prompt = `You are an expert cold email writer specializing in pain-based outreach for accounting firms.

Write a short, personalized cold email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant to their operational challenges.` : 'Use their role and company context.'}

CRITICAL REQUIREMENTS:
- Subject line: 6-10 words, pain-focused or curiosity-driven, NO spam words
- Body: 3 short paragraphs max (keep it tight)
- Opening: Start with THEIR pain point, not about us
  * Common pains: Juggling 5-7 SaaS tools (QuickBooks, Dropbox, DocuSign, payment processors, email)
  * High monthly SaaS costs stacking up ($500-2000/month on disconnected tools)
  * Time wasted switching between platforms and manual data entry
  * Security concerns with sensitive client data spread across multiple systems
  * Client confusion from multiple logins

- Middle: Briefly present the possibility (NOT a pitch)
  * "What if you could consolidate all of that into one military-grade secure platform?"
  * Mention 1-2 specific consolidation benefits: cost savings (50-70% reduction), time savings, or military-grade security
  * DO NOT list features - focus on outcomes they care about

- Close: Soft, consultative CTA
  * "Worth a 15-minute conversation?" or similar low-pressure ask
  * Sign off as "The Nexli Team"

TONE: Consultative, empathetic, not salesy. Write like a peer who understands their struggles, not a vendor pitching.

AVOID: Feature lists, "we do this/that", promotional language, hype words

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
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
