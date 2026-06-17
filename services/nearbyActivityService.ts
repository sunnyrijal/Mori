export interface MapMarker {
    id: string;
    title: string;
    description: string;
    category: 'walk' | 'cafe' | 'social';
    latitude: number;
    longitude: number;
    distance: number; // in meters
}

// Haversine formula to compute distance in meters between two lat/lon pairs
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

// Generate realistic mock meetups/social activities centered near the coordinates
function generateMockMeetups(lat: number, lon: number): MapMarker[] {
    const eventTemplates = [
        {
            title: "Board Game Mixer",
            description: "Join local board game enthusiasts for a casual night of games, conversation, and laughs. All experience levels welcome!",
            category: 'social' as const,
        },
        {
            title: "Community Yoga in the Park",
            description: "Start your morning with a relaxing vinyasa yoga flow. Bring your own mat, water, and positive energy.",
            category: 'social' as const,
        },
        {
            title: "Acoustic Night & Open Mic",
            description: "Come listen to local singer-songwriters perform acoustic sets, or share one of your own songs/poems.",
            category: 'social' as const,
        },
        {
            title: "Weekly Running Club Meetup",
            description: "A friendly 5K group run. All paces are welcome, and we usually grab drinks or smoothies afterwards.",
            category: 'social' as const,
        },
        {
            title: "Creative Painting Circle",
            description: "Unwind and paint in a supportive group environment. Canvas, brushes, and basic acrylic paint provided.",
            category: 'social' as const,
        },
        {
            title: "Weekend Farmers & Makers Market",
            description: "Browse fresh local produce, baked goods, handmade crafts, and meet friendly local makers.",
            category: 'social' as const,
        }
    ];

    // Seeded coordinates based on offsets
    return eventTemplates.map((template, idx) => {
        // Offsets between ~150m to ~1200m
        const angle = (idx * (2 * Math.PI / eventTemplates.length)) + 0.5;
        const distRatio = 0.003 + (idx * 0.0015); // degrees approx (1 deg ~ 111km)
        const markerLat = lat + Math.sin(angle) * distRatio;
        const markerLon = lon + Math.cos(angle) * distRatio;
        
        return {
            id: `mock-event-${idx}`,
            title: template.title,
            description: template.description,
            category: template.category,
            latitude: markerLat,
            longitude: markerLon,
            distance: getDistance(lat, lon, markerLat, markerLon)
        };
    });
}

// Fallback places in case the network query fails or is offline
function generateFallbackPlaces(lat: number, lon: number): MapMarker[] {
    const fallbackTemplates = [
        { title: "Greenwood Nature Park", description: "A quiet, green public park with walking trails, picnic benches, and beautiful mature trees.", category: 'walk' as const, offsetLat: 0.005, offsetLon: -0.003 },
        { title: "Riverside Walking Trail", description: "Scenic pathway along the water. Perfect for a brisk walk, jog, or relaxing sunset view.", category: 'walk' as const, offsetLat: -0.004, offsetLon: 0.006 },
        { title: "The Daily Brew Cafe", description: "Cozy local coffee shop known for its hand-crafted espresso, warm pastries, and work-friendly tables.", category: 'cafe' as const, offsetLat: 0.002, offsetLon: 0.002 },
        { title: "Cornerstone Book Cafe", description: "A quiet combination bookshop and bakery. Great place to sit with a hot tea and read.", category: 'cafe' as const, offsetLat: -0.003, offsetLon: -0.004 },
        { title: "Sunset Ridge Trailhead", description: "Popular path heading up to a viewpoint. Offers panoramic views of the local neighborhood.", category: 'walk' as const, offsetLat: 0.008, offsetLon: 0.004 }
    ];

    return fallbackTemplates.map((item, idx) => {
        const markerLat = lat + item.offsetLat;
        const markerLon = lon + item.offsetLon;
        return {
            id: `fallback-place-${idx}`,
            title: item.title,
            description: item.description,
            category: item.category,
            latitude: markerLat,
            longitude: markerLon,
            distance: getDistance(lat, lon, markerLat, markerLon)
        };
    });
}

export async function getNearbyMapActivities(lat: number, lon: number): Promise<MapMarker[]> {
    const mockEvents = generateMockMeetups(lat, lon);
    
    // Construct Overpass API query for parks and cafes
    // Leisure=park and Amenity=cafe
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:10];(node(around:2000,${lat},${lon})[leisure=park];node(around:2000,${lat},${lon})[amenity=cafe];);out;`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
        const response = await fetch(overpassUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Overpass API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.elements)) {
            const places: MapMarker[] = data.elements
                .filter((el: any) => el.lat && el.lon && el.tags && el.tags.name)
                .map((el: any, idx: number) => {
                    const isCafe = el.tags.amenity === 'cafe';
                    return {
                        id: `osm-place-${el.id || idx}`,
                        title: el.tags.name,
                        description: isCafe 
                            ? `Local cafe detected on OpenStreetMap. Perfect for a warm drink and relaxing ambiance.`
                            : `Public park/leisure space. Great spot for fresh air, walking, or resting outdoors.`,
                        category: isCafe ? 'cafe' as const : 'walk' as const,
                        latitude: el.lat,
                        longitude: el.lon,
                        distance: getDistance(lat, lon, el.lat, el.lon)
                    };
                });
            
            // If we didn't find enough places, merge with some generated fallbacks
            if (places.length < 3) {
                const fallbacks = generateFallbackPlaces(lat, lon);
                return [...mockEvents, ...places, ...fallbacks].sort((a, b) => a.distance - b.distance);
            }
            
            return [...mockEvents, ...places].sort((a, b) => a.distance - b.distance);
        }
    } catch (e) {
        console.warn("Failed to fetch real OSM places, falling back to mock places:", e);
    }
    
    // If Overpass query fails, return mock events + fallback places
    const fallbacks = generateFallbackPlaces(lat, lon);
    return [...mockEvents, ...fallbacks].sort((a, b) => a.distance - b.distance);
}
