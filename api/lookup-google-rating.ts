import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug logging
  console.log('=== Google Rating Lookup API Called ===');
  console.log('Method:', req.method);
  console.log('API Key exists:', !!GOOGLE_MAPS_API_KEY);
  console.log('API Key length:', GOOGLE_MAPS_API_KEY?.length || 0);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('ERROR: GOOGLE_MAPS_API_KEY not configured in environment variables');
    return res.status(500).json({
      error: 'GOOGLE_MAPS_API_KEY not configured',
      debug: {
        envVars: Object.keys(process.env),
        hasKey: !!GOOGLE_MAPS_API_KEY
      }
    });
  }

  try {
    const { companyName, city, state } = req.body;
    console.log('Request body:', { companyName, city, state });

    if (!companyName) {
      return res.status(400).json({ error: 'companyName is required' });
    }

    // Build search query: "Company Name City State"
    const query = [companyName, city, state].filter(Boolean).join(' ');
    console.log('Search query:', query);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('Google API Response Status:', data.status);
    console.log('Results count:', data.results?.length || 0);

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google API Error:', data.error_message);
      return res.status(500).json({
        error: 'Google API request denied',
        message: data.error_message
      });
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const place = data.results[0];
      const rating = place.rating || null;
      const reviewCount = place.user_ratings_total || 0;

      console.log('Found place:', place.name);
      console.log('Rating:', rating, 'Reviews:', reviewCount);

      if (rating) {
        console.log(`✅ SUCCESS: ${companyName} = ${rating}⭐ (${reviewCount} reviews)`);
        return res.json({ rating, reviewCount });
      }
    }

    // No rating found
    console.log(`ℹ️ No rating found for ${companyName}`);
    return res.json({ rating: null, reviewCount: null });
  } catch (error: any) {
    console.error('❌ Error looking up Google rating:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
