import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Gemini error: ${errorText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    const email = JSON.parse(jsonMatch[0]);
    return res.json(email);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
