const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// PRODUCT KNOWLEDGE - All senders are experts on the Digital Rainmaker System
const PRODUCT_KNOWLEDGE = `
NEXLI DIGITAL RAINMAKER SYSTEM - Complete Product Knowledge:

🚨 **CRITICAL RULE: NEVER MENTION PRICING IN EMAILS** 🚨
- DO NOT mention what Nexli costs (not even ranges or estimates)
- DO NOT say things like "$700/month" or "starting at $X"
- You CAN mention their current waste (e.g., "spending $2,100/month across 7 tools")
- You CAN mention savings percentages (e.g., "60-70% reduction in software costs")
- Pricing is discussed ONLY on sales calls with Marcel (the founder)
- Your goal: Get them curious enough to hop on a 10-minute call

**3-Part System:**
1. Premium Custom Website (conversion-optimized for CPAs, not templates)
2. AI Automation Layer (24/7 lead response, missed-call text-back, auto-booking, nurture sequences)
3. Google Review Amplification (automated requests, builds firms from 4-12 to 80+ reviews)

**Client Portal (All-in-One Tool):**
- Engagement letters with e-signature
- Tax organizers (secure document collection for W-2s, 1099s, etc.)
- Professional invoicing with online payment tracking
- Client messaging (replaces email chaos)
- CRM/lead management
- Quantum-resistant encryption (AES-256)

**Key Stats:**
- 78% of clients choose the FIRST firm to respond within 5 minutes
- Lead quality drops 80% after the first 5 minutes
- Most CPA firms take 4+ hours to respond (you lose by default)

**Pain Points Solved:**
- Tool overload (6+ disconnected platforms → 1 unified system)
- Missed leads (24/7 AI responds instantly, never miss a call)
- Manual admin work (automation handles intake, scheduling, follow-ups)
- Weak online presence (premium custom site vs outdated competitors)
- Low trust signals (review engine systematically builds credibility)

**Target Customer:** Established CPA firms (owners, partners, managing partners) who are losing leads to faster competitors or drowning in disconnected tools.
`;

// Email variation prompts - OBJECTIVE: GET RESPONSES (check for pulse)
const EMAIL_VARIATIONS = {
  ai_disruption: {
    name: 'AI Disruption & Ownership',
    prompt: (lead, postSummary, sender) => `You are ${sender.name}, ${sender.role} at Nexli Automation.

${PRODUCT_KNOWLEDGE}

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, conversational email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

**CRITICAL MISSION: GET A RESPONSE**
This email's ONLY goal is to spark a reply. Not to pitch. Not to sell. Just to start a conversation and check if there's a pulse on the other end.

STRATEGY - AI DISRUPTION AS CONVERSATION STARTER:
- Subject line: 3-6 words, curiosity-driven question or insight
  Examples: "your tech stack vulnerable?", "5-minute response rule", "AI + per-seat pricing"

- Opening: Pattern interrupt with specific insight or question
  * Start with a thought-provoking question they can't ignore
  * Reference a specific pain point (e.g., "Do you ever lose leads because your team took 2 hours to respond?")
  * Use the 78% stat: "Saw a stat that 78% of clients choose whoever responds first—within 5 minutes. Made me wonder if CPA firms are even equipped for that?"
  * Make it about THEIR reality, not your product

- Middle: Quick insight + soft check-in (2-3 sentences MAX)
  * Share ONE specific insight about the Digital Rainmaker System (24/7 AI response, automated intake, review engine)
  * Frame as "we built this for [exact pain point]" not "we sell this"
  * Example: "We built a system that responds to every lead in under 60 seconds, even at 2am. Some firms went from losing 60% of inbound leads to booking most of them."
  * Keep it conversational, like you're sharing something interesting
  * DO NOT mention pricing - that's for the call only

- Close: LOW-PRESSURE response trigger that leads to a CALL
  * Ask a simple yes/no question they can answer quickly
  * Examples: "Does this resonate with what you're seeing?", "Curious—how are you handling lead response right now?", "Worth a 10-minute call to walk through how this works?"
  * If they seem interested, suggest a brief call: "Happy to show you how a few firms are handling this—10 minutes?"
  * Make replying EASY (one word is fine)
  * Sign off with ${sender.name}'s name only (e.g., "${sender.name}")

TONE: ${sender.name}'s authentic voice. Conversational peer. Genuinely curious. NOT salesy. Like texting a colleague.

AVOID:
- Long emails (keep under 100 words)
- Feature lists or "we do X, Y, Z"
- Aggressive CTAs
- Multiple questions (pick ONE)
- Anything that sounds like a template

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`
  },

  cost_savings: {
    name: 'Cost Savings Focus',
    prompt: (lead, postSummary, sender) => `You are ${sender.name}, ${sender.role} at Nexli Automation.

${PRODUCT_KNOWLEDGE}

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, conversational email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

**CRITICAL MISSION: GET A RESPONSE**
Spark a conversation. Check if there's interest. Don't pitch—just start a dialogue about waste they might not realize exists.

STRATEGY - COST SAVINGS AS CONVERSATION STARTER:
- Subject line: 3-6 words, number-driven curiosity
  Examples: "$20K in duplicate tools?", "your SaaS math", "6 tools → 1 platform"

- Opening: Specific, relatable observation (not a pitch)
  * Start with a question about their tech stack: "Quick question—how many different platforms are you paying for right now? QuickBooks, DocuSign, payment processor, client portal, CRM..."
  * Or share a pattern: "Most CPA firms I talk to are running 6-8 different tools. Adds up to $18K-24K/year and none of them talk to each other."
  * Make it conversational, not accusatory
  * Get them thinking about their actual spend

- Middle: Quick insight + relatable example (2-3 sentences)
  * Share how the Digital Rainmaker consolidates everything: "We built one platform that does all of it—engagement letters with e-sign, tax organizers, invoicing, client messaging, even AI automation. Most firms see 60-70% reduction in software costs."
  * Use a real example of waste (NOT your pricing): "One partner told me they were spending $2,100/month across 7 tools and didn't even realize it until we mapped it out."
  * Keep it brief and specific
  * DO NOT mention what Nexli costs - pricing is discussed on the call only

- Close: Easy question that leads to a CALL
  * "Does this sound familiar?"
  * "Worth a quick call to see what you're actually spending?"
  * "Curious if you've thought about consolidation? Happy to show you the math."
  * "Want to hop on a 10-minute call and I'll show you how this works for CPA firms?"
  * Make replying take 3 seconds, but aim for getting them on a call
  * Sign off: "${sender.name}"

TONE: ${sender.name}'s voice. Like a financial advisor pointing out waste. Helpful, not salesy. Genuinely curious about their situation.

AVOID:
- Long emails (under 100 words)
- Listing all features
- Aggressive "book a demo" language
- Multiple CTAs
- Sounding like a template

Return ONLY valid JSON:
{"subject": "your subject line", "body": "your email body"}`
  },

  time_efficiency: {
    name: 'Time & Efficiency Focus',
    prompt: (lead, postSummary, sender) => `You are ${sender.name}, ${sender.role} at Nexli Automation.

${PRODUCT_KNOWLEDGE}

SENDER PERSONALITY & VOICE:
${sender.personality}

Write a short, conversational email to ${lead.name}, ${lead.role} at ${lead.company}.

${postSummary ? `Recent LinkedIn activity:\n${postSummary}\n\nReference ONE post naturally if relevant.` : 'Use their role and company context.'}

**CRITICAL MISSION: GET A RESPONSE**
Open a conversation about time waste. Make them think "wow, that's my day." Not a pitch—just a reality check that gets them to reply.

STRATEGY - TIME/EFFICIENCY AS CONVERSATION STARTER:
- Subject line: 3-6 words, time-focused observation
  Examples: "10 hours/week to admin?", "your lead response time", "switching between 6 tools"

- Opening: Relatable time-waste observation (specific question)
  * Start with their reality: "Honest question—how much time does your team burn switching between platforms each day? QuickBooks → DocuSign → payment processor → email → CRM..."
  * Or use a specific stat: "Read somewhere that CPA firm owners lose 12-15 hours/week to admin work that should be automated. That's basically 2 workdays gone."
  * Or ask about lead response: "Quick check—when a lead calls or fills out your site at 7pm, how long until someone follows up? Next morning? That's when you lose them."
  * Make it about THEIR time, not your solution

- Middle: Quick automation insight (2-3 sentences)
  * Share what the Digital Rainmaker automates: "We built a system that handles the entire intake automatically—lead comes in, AI responds in 60 seconds, books the appointment, sends reminders, collects documents, even requests reviews after. Zero manual work."
  * Use a relatable example: "One firm calculated they saved 18 hours/week just by automating lead response and document collection. That's a full employee worth of time back."
  * Keep it conversational and brief
  * DO NOT mention pricing - that's discussed on the call with Marcel only

- Close: Simple question that leads to a CALL
  * "Resonate with you?"
  * "Sound familiar?"
  * "Worth a quick 10-minute call to see what you could automate?"
  * "Curious how you're handling this right now? Happy to show you how other CPA firms are tackling it."
  * Make replying effortless, but aim to get them on a call
  * Sign off: "${sender.name}"

TONE: ${sender.name}'s voice. Empathetic peer who gets the pain. Conversational. Not pitching—genuinely curious.

AVOID:
- Long emails (under 100 words)
- Laundry list of features
- "Book a demo" pressure
- Multiple questions or CTAs
- Generic template language

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
