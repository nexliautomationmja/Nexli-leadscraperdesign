import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        // Format lead for GoHighLevel / generic CRM webhook
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

        results.push({
          name: lead.name,
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (err: any) {
        results.push({
          name: lead.name,
          success: false,
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return res.json({
      total: leads.length,
      success: successCount,
      failed: leads.length - successCount,
      results,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
