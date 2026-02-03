/**
 * Geocoding utilities for TripWise
 * Uses OpenStreetMap Nominatim API for geocoding (free, no API key required)
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: string;
}

export interface DirectionsInfo {
  walking: { duration: number; distance: number };
  publicTransport: { duration: number; distance: number };
  taxi: { duration: number; distance: number; estimatedCost: number };
}

// Geocode a location name to coordinates
export async function geocodeLocation(query: string): Promise<GeocodingResult | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'TripWise/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Get the center coordinates for a destination
export async function getDestinationCenter(destination: string): Promise<{ lat: number; lng: number; country?: string } | null> {
  // Known destinations for faster response and better POI generation
  const knownDestinations: Record<string, { lat: number; lng: number; country: string }> = {
    // France
    'paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
    'nice': { lat: 43.7102, lng: 7.2620, country: 'France' },
    'lyon': { lat: 45.7640, lng: 4.8357, country: 'France' },
    'marseille': { lat: 43.2965, lng: 5.3698, country: 'France' },
    
    // Spain
    'barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain' },
    'madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
    'seville': { lat: 37.3891, lng: -5.9845, country: 'Spain' },
    'valencia': { lat: 39.4699, lng: -0.3763, country: 'Spain' },
    
    // United States
    'new york': { lat: 40.7128, lng: -74.0060, country: 'United States' },
    'los angeles': { lat: 34.0522, lng: -118.2437, country: 'United States' },
    'miami': { lat: 25.7617, lng: -80.1918, country: 'United States' },
    'san francisco': { lat: 37.7749, lng: -122.4194, country: 'United States' },
    'chicago': { lat: 41.8781, lng: -87.6298, country: 'United States' },
    'las vegas': { lat: 36.1699, lng: -115.1398, country: 'United States' },
    'orlando': { lat: 28.5383, lng: -81.3792, country: 'United States' },
    'washington': { lat: 38.9072, lng: -77.0369, country: 'United States' },
    'boston': { lat: 42.3601, lng: -71.0589, country: 'United States' },
    'seattle': { lat: 47.6062, lng: -122.3321, country: 'United States' },
    
    // Italy
    'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy' },
    'venice': { lat: 45.4408, lng: 12.3155, country: 'Italy' },
    'florence': { lat: 43.7696, lng: 11.2558, country: 'Italy' },
    'milan': { lat: 45.4642, lng: 9.1900, country: 'Italy' },
    'naples': { lat: 40.8518, lng: 14.2681, country: 'Italy' },
    
    // Turkey
    'istanbul': { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
    'antalya': { lat: 36.8969, lng: 30.7133, country: 'Turkey' },
    'cappadocia': { lat: 38.6580, lng: 34.6850, country: 'Turkey' },
    
    // Mexico
    'mexico city': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
    'cancun': { lat: 21.1619, lng: -86.8515, country: 'Mexico' },
    'playa del carmen': { lat: 20.6294, lng: -87.0739, country: 'Mexico' },
    'guadalajara': { lat: 20.6597, lng: -103.3496, country: 'Mexico' },
    
    // United Kingdom
    'london': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
    'edinburgh': { lat: 55.9533, lng: -3.1883, country: 'United Kingdom' },
    'manchester': { lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
    'birmingham': { lat: 52.4862, lng: -1.8904, country: 'United Kingdom' },
    'liverpool': { lat: 53.4084, lng: -2.9916, country: 'United Kingdom' },
    
    // China
    'beijing': { lat: 39.9042, lng: 116.4074, country: 'China' },
    'shanghai': { lat: 31.2304, lng: 121.4737, country: 'China' },
    'hong kong': { lat: 22.3193, lng: 114.1694, country: 'China' },
    'chengdu': { lat: 30.5728, lng: 104.0668, country: 'China' },
    'xian': { lat: 34.3416, lng: 108.9398, country: 'China' },
    
    // Germany
    'berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany' },
    'munich': { lat: 48.1351, lng: 11.5820, country: 'Germany' },
    'hamburg': { lat: 53.5511, lng: 9.9937, country: 'Germany' },
    'frankfurt': { lat: 50.1109, lng: 8.6821, country: 'Germany' },
    'cologne': { lat: 50.9375, lng: 6.9603, country: 'Germany' },
    
    // Greece
    'athens': { lat: 37.9838, lng: 23.7275, country: 'Greece' },
    'santorini': { lat: 36.3932, lng: 25.4615, country: 'Greece' },
    'mykonos': { lat: 37.4467, lng: 25.3244, country: 'Greece' },
    'thessaloniki': { lat: 40.6401, lng: 22.9444, country: 'Greece' },
    
    // Other popular destinations
    'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
    'bali': { lat: -8.4095, lng: 115.1889, country: 'Indonesia' },
    'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
    'sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia' },
    'dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE' },
    'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
    'vienna': { lat: 48.2082, lng: 16.3738, country: 'Austria' },
    'prague': { lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
    'bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
    'seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
    'cairo': { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
    'cape town': { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
    'rio de janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brazil' },
    'buenos aires': { lat: -34.6037, lng: -58.3816, country: 'Argentina' },
    'lisbon': { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
    'moscow': { lat: 55.7558, lng: 37.6173, country: 'Russia' },
  };

  const destLower = destination.toLowerCase();

  // Check known destinations
  for (const [key, coords] of Object.entries(knownDestinations)) {
    if (destLower.includes(key)) {
      return coords;
    }
  }

  // Fallback to geocoding API
  const result = await geocodeLocation(destination);
  if (result) {
    return { lat: result.lat, lng: result.lng };
  }

  return null;
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Estimate travel times and costs between two points
export function estimateDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  destinationCountry?: string
): DirectionsInfo {
  const distanceKm = calculateDistance(fromLat, fromLng, toLat, toLng);

  // Estimate walking (5 km/h average speed)
  const walkingDuration = Math.round((distanceKm / 5) * 60); // minutes
  const walkingDistance = distanceKm;

  // Estimate public transport (15-25 km/h average including wait times)
  const publicTransportSpeed = distanceKm < 3 ? 15 : 20;
  const publicTransportDuration = Math.round((distanceKm / publicTransportSpeed) * 60 + 10); // +10 min for waiting
  const publicTransportDistance = distanceKm;

  // Estimate taxi (25-40 km/h in city depending on traffic)
  const taxiSpeed = distanceKm < 5 ? 20 : 35;
  const taxiDuration = Math.round((distanceKm / taxiSpeed) * 60 + 5); // +5 min for pickup
  const taxiDistance = distanceKm;

  // Estimate taxi cost based on destination (rough estimates)
  const taxiRates: Record<string, { baseFare: number; perKm: number }> = {
    'USA': { baseFare: 3.5, perKm: 2.5 },
    'France': { baseFare: 4, perKm: 1.8 },
    'Japan': { baseFare: 5, perKm: 3 },
    'UK': { baseFare: 3, perKm: 2 },
    'Indonesia': { baseFare: 1, perKm: 0.5 },
    'default': { baseFare: 3, perKm: 1.5 },
  };

  const rates = taxiRates[destinationCountry || 'default'] || taxiRates['default'];
  const estimatedCost = Math.round(rates.baseFare + distanceKm * rates.perKm);

  return {
    walking: {
      duration: walkingDuration,
      distance: Math.round(walkingDistance * 10) / 10,
    },
    publicTransport: {
      duration: publicTransportDuration,
      distance: Math.round(publicTransportDistance * 10) / 10,
    },
    taxi: {
      duration: taxiDuration,
      distance: Math.round(taxiDistance * 10) / 10,
      estimatedCost,
    },
  };
}

// Generate POIs around a center point for custom destinations
export function generateGenericPOIs(
  centerLat: number,
  centerLng: number,
  destination: string
): {
  outdoor: Array<{ name: string; lat: number; lng: number; address: string; activityName: string; duration: number; priceRange: { low: number; medium: number; high: number } }>;
  indoor: Array<{ name: string; lat: number; lng: number; address: string; activityName: string; duration: number; priceRange: { low: number; medium: number; high: number } }>;
  nightlife: Array<{ name: string; lat: number; lng: number; address: string; activityName: string; duration: number; priceRange: { low: number; medium: number; high: number } }>;
} {
  // Generate varied coordinates around center (within ~3km radius)
  const generateCoord = (index: number, type: 'lat' | 'lng') => {
    const offset = ((index % 5) - 2) * 0.01 + (Math.random() - 0.5) * 0.005;
    return type === 'lat' ? centerLat + offset : centerLng + offset;
  };

  const outdoorActivities = [
    { name: 'City Park', activityName: 'Park Exploration', duration: 3, priceRange: { low: 0, medium: 10, high: 25 } },
    { name: 'Botanical Garden', activityName: 'Garden Visit', duration: 2, priceRange: { low: 5, medium: 15, high: 35 } },
    { name: 'Historic District', activityName: 'Walking Tour', duration: 3, priceRange: { low: 0, medium: 30, high: 60 } },
    { name: 'Waterfront Area', activityName: 'Waterfront Stroll', duration: 2, priceRange: { low: 0, medium: 15, high: 40 } },
    { name: 'Local Market', activityName: 'Market Visit', duration: 2, priceRange: { low: 10, medium: 30, high: 60 } },
  ];

  const indoorActivities = [
    { name: 'Local Museum', activityName: 'Museum Tour', duration: 3, priceRange: { low: 10, medium: 25, high: 50 } },
    { name: 'Art Gallery', activityName: 'Art Exhibition', duration: 2, priceRange: { low: 8, medium: 20, high: 45 } },
    { name: 'Spa Center', activityName: 'Spa Experience', duration: 3, priceRange: { low: 40, medium: 80, high: 150 } },
    { name: 'Shopping Mall', activityName: 'Shopping & Dining', duration: 3, priceRange: { low: 20, medium: 60, high: 150 } },
    { name: 'Cultural Center', activityName: 'Cultural Experience', duration: 2, priceRange: { low: 15, medium: 35, high: 70 } },
  ];

  const nightlifeActivities = [
    { name: 'Rooftop Bar', activityName: 'Evening Drinks with Views', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
    { name: 'Live Music Venue', activityName: 'Live Music Night', duration: 3, priceRange: { low: 20, medium: 45, high: 90 } },
    { name: 'Local Restaurant', activityName: 'Dinner Experience', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
    { name: 'Night Market', activityName: 'Night Market Exploration', duration: 2, priceRange: { low: 15, medium: 35, high: 70 } },
    { name: 'Entertainment District', activityName: 'Nightlife Tour', duration: 3, priceRange: { low: 30, medium: 70, high: 150 } },
  ];

  return {
    outdoor: outdoorActivities.map((activity, i) => ({
      ...activity,
      lat: generateCoord(i, 'lat'),
      lng: generateCoord(i + 2, 'lng'),
      address: `${activity.name}, ${destination}`,
    })),
    indoor: indoorActivities.map((activity, i) => ({
      ...activity,
      lat: generateCoord(i + 1, 'lat'),
      lng: generateCoord(i + 3, 'lng'),
      address: `${activity.name}, ${destination}`,
    })),
    nightlife: nightlifeActivities.map((activity, i) => ({
      ...activity,
      lat: generateCoord(i + 2, 'lat'),
      lng: generateCoord(i + 1, 'lng'),
      address: `${activity.name}, ${destination}`,
    })),
  };
}
