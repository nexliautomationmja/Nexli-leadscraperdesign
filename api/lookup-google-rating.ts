import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  try {
    const { companyName, city, state } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'companyName is required' });
    }

    // Build search query: "Company Name City State"
    const query = [companyName, city, state].filter(Boolean).join(' ');
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const place = data.results[0];
      const rating = place.rating || null;
      const reviewCount = place.user_ratings_total || 0;

      if (rating) {
        console.log(`Found rating for ${companyName}: ${rating}⭐ (${reviewCount} reviews)`);
        return res.json({ rating, reviewCount });
      }
    }

    // No rating found
    return res.json({ rating: null, reviewCount: null });
  } catch (error: any) {
    console.error('Error looking up Google rating:', error);
    return res.status(500).json({ error: error.message });
  }
}
