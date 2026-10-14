import { Router } from 'express';

const router = Router();

router.post('/search', async (req, res) => {
  try {
    const { query, latitude, longitude } = req.body;
    
    if (!query || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'paused') {
      return res.status(503).json({ error: 'Places API key not configured' });
    }

    // Google Places API (New) Text Search
    const requestBody = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: 10000.0 // 10km radius
        }
      }
    };

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Places API Error:', errText);
      return res.status(response.status).json({ error: 'Failed to fetch places' });
    }

    const data = await response.json();
    
    if (!data.places || data.places.length === 0) {
       return res.json({ place: null });
    }

    // Return the top result
    res.json({ place: data.places[0] });

  } catch (err: any) {
    console.error('Places Search error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
