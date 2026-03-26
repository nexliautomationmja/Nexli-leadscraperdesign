const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Email variation prompts for A/B/C testing
const EMAIL_VARIATIONS = {
  ai_disruption: {
    name: 'AI Disruption & Ownership',
    prompt: (lead, postSummary, sender) => `You are writing as ${sender.name}, ${sender.role} at Nexli Automation.

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, personalized cold email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

IMPORTANT: Write this email in ${sender.name}'s voice and personality as described above. The tone and style should authentically match ${sender.name}'s character.

CRITICAL REQUIREMENTS - AI DISRUPTION ANGLE:
- Subject line: 4-8 words, mention "AI" or "software" or specific pain, NO spam words
  Examples: "AI making your software obsolete?", "Goldman Sachs SaaS warning", "software squeeze ahead"

- Opening: Start with AI disruption threat or future pain
  * "Goldman Sachs just warned that most software tools have 5 years before AI makes them obsolete"
  * "As AI replaces headcount, SaaS vendors are going to squeeze the clients who stayed"
  * "What happens to your per-seat licenses when AI cuts your team size in half?"
  * Lead with THEIR future pain, not current pain

- Middle: Present ownership/control as the solution
  * "You don't even own the data sitting in those platforms"
  * "Annual contracts and per-seat pricing = counter-party risk"
  * "What if you could own the platform instead of renting it?"
  * Focus on: data ownership, no vendor lock-in, no per-seat squeeze
  * Mention: military-grade security, future-proof

- Close: Soft, consultative CTA
  * "Worth exploring before the squeeze hits?"
  * "Open to a quick conversation about ownership models?"
  * Sign off with ${sender.name}'s name (e.g., "Best, ${sender.name}")

TONE: Forward-thinking, protective (like warning a peer), not salesy.

AVOID: Feature lists, "we do this/that", promotional language

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`
  },

  cost_savings: {
    name: 'Cost Savings Focus',
    prompt: (lead, postSummary, sender) => `You are writing as ${sender.name}, ${sender.role} at Nexli Automation.

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, personalized cold email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

IMPORTANT: Write this email in ${sender.name}'s voice and personality as described above. The tone and style should authentically match ${sender.name}'s character.

CRITICAL REQUIREMENTS - COST SAVINGS ANGLE:
- Subject line: 4-8 words, include number/cost, NO spam words
  Examples: "saving $18K/year on tech", "$2,000/month tech waste?", "SaaS consolidation math"

- Opening: Start with specific cost pain
  * "Most CPA firms are spending $1,500-2,000/month across QuickBooks, Dropbox, DocuSign, payment processors..."
  * "That tech stack adds up to $18K-24K per year—and it's all disconnected"
  * "5-7 different SaaS subscriptions eating 50-70% of your monthly software budget"
  * Use SPECIFIC numbers and dollar amounts

- Middle: Present consolidation savings
  * "What if you could cut that by 60-70% and get everything in one platform?"
  * "Most firms save $12K-15K/year just by consolidating"
  * "Military-grade secure, one login, one bill"
  * Focus on: concrete savings, ROI, cost reduction
  * Mention: typical payback period of 3-4 months

- Close: Soft, consultative CTA
  * "Worth running the numbers together?"
  * "Curious what consolidation could save you specifically?"
  * Sign off with ${sender.name}'s name (e.g., "Best, ${sender.name}")

TONE: Financial advisor helping them find waste, not salesy.

AVOID: Feature lists, "we do this/that", promotional language, hype

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`
  },

  time_efficiency: {
    name: 'Time & Efficiency Focus',
    prompt: (lead, postSummary, sender) => `You are writing as ${sender.name}, ${sender.role} at Nexli Automation.

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, personalized cold email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

IMPORTANT: Write this email in ${sender.name}'s voice and personality as described above. The tone and style should authentically match ${sender.name}'s character.

CRITICAL REQUIREMENTS - TIME/EFFICIENCY ANGLE:
- Subject line: 4-8 words, mention "time" or "hours" or specific task, NO spam words
  Examples: "12 hours of admin per week", "platform-switching time drain", "manual work elimination"

- Opening: Start with time waste pain
  * "How much time is your team spending switching between platforms and manually chasing documents?"
  * "Most CPA firm owners tell me they lose 10-15 hours per week to admin work that shouldn't exist"
  * "Platform-switching, manual data entry, invoice follow-ups—it adds up fast"
  * Focus on TIME as the scarce resource (more valuable than money)

- Middle: Present automation/efficiency gain
  * "What if you could eliminate 12+ hours of manual work per week without hiring?"
  * "One platform that handles client docs, invoicing, e-signatures, payment tracking—all automated"
  * "Your team focuses on advisory work instead of admin busywork"
  * Focus on: time savings, automation, leverage existing team
  * Mention: military-grade security, unified dashboard

- Close: Soft, consultative CTA
  * "Worth 15 minutes to explore what you could automate?"
  * "Open to seeing how other firms are saving this time?"
  * Sign off with ${sender.name}'s name (e.g., "Best, ${sender.name}")

TONE: Empathetic peer who knows they're overworked, not salesy.

AVOID: Feature lists, "we do this/that", promotional language, hype

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`
  }
};

export default async function handler(req, res) {
  // Debug logging
  console.log('API Key exists:', !!ANTHROPIC_API_KEY);
  console.log('API Key length:', ANTHROPIC_API_KEY?.length || 0);

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
    const { lead, posts, variation, sender } = req.body;

    // Validate sender info
    if (!sender || !sender.name || !sender.personality) {
      return res.status(400).json({ error: 'Sender information with personality required' });
    }

    // Prepare post summary
    const postSummary = (posts || [])
      .slice(0, 5)
      .map((p, i) => `Post ${i + 1}: "${(p.text || p.postText || '').slice(0, 300)}"`)
      .join('\n');

    // Randomly select variation if not specified
    const variationKeys = Object.keys(EMAIL_VARIATIONS);
    const selectedVariation = variation || variationKeys[Math.floor(Math.random() * variationKeys.length)];
    const variationConfig = EMAIL_VARIATIONS[selectedVariation];

    console.log('Selected variation:', selectedVariation);
    console.log('Sender:', sender.name, '-', sender.role);

    // Generate prompt for selected variation with sender personality
    const prompt = variationConfig.prompt(lead, postSummary, sender);

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

    // Return email with variation metadata
    return res.json({
      ...email,
      variation: selectedVariation,
      variationName: variationConfig.name
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
