import { TravelStyle, BudgetLevel, ActivityType, WeatherCondition, TripType } from './db';
import { simulateWeather } from './weather';

interface Activity {
  name: string;
  type: ActivityType;
  duration: number; // in hours
  location: { lat: number; lng: number; name: string; address: string };
  price: number; // price per person in dollars
}

interface DayPlan {
  dayNumber: number;
  date: Date;
  weather: WeatherCondition;
  // Daytime activities
  daytimeActivity: Activity;
  daytimeAlternativeActivity: Activity;
  // Nighttime activities
  nighttimeActivity: Activity;
  nighttimeAlternativeActivity: Activity;
  // Selections default to 'main'
  selectedDaytimeActivity: 'main' | 'alternative';
  selectedNighttimeActivity: 'main' | 'alternative';
  // Legacy fields for backward compatibility
  mainActivity: Activity;
  alternativeActivity: Activity;
}

// Destination data with real coordinates and POIs
interface DestinationData {
  center: { lat: number; lng: number };
  country: string;
  currency: string;
  timezone: string;
  image: string;
  pois: {
    relax: { outdoor: POI[]; indoor: POI[]; nightlife: POI[] };
    adventure: { outdoor: POI[]; indoor: POI[]; nightlife: POI[] };
    cultural: { outdoor: POI[]; indoor: POI[]; nightlife: POI[] };
    food: { outdoor: POI[]; indoor: POI[]; nightlife: POI[] };
  };
}

interface POI {
  name: string;
  lat: number;
  lng: number;
  address: string;
  activityName: string;
  duration: number;
  priceRange: { low: number; medium: number; high: number }; // Price per person in dollars
}

// Price multipliers based on trip type
const TRIP_TYPE_MULTIPLIERS: Record<TripType, number> = {
  solo: 1.0,
  couple: 0.9, // Slight discount for couples
  family: 0.8, // Family discounts
  friends: 0.85, // Group discounts
};

// Get price based on budget level
function getPrice(poi: POI, budgetLevel: BudgetLevel, tripType: TripType): number {
  const basePrice = poi.priceRange[budgetLevel];
  const multiplier = TRIP_TYPE_MULTIPLIERS[tripType];
  return Math.round(basePrice * multiplier);
}

// Real destination data with actual coordinates and pricing
const DESTINATIONS: Record<string, DestinationData> = {
  paris: {
    center: { lat: 48.8566, lng: 2.3522 },
    country: 'France',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    image: 'paris',
    pois: {
      relax: {
        outdoor: [
          { name: 'Luxembourg Gardens', lat: 48.8462, lng: 2.3372, address: 'Rue de Médicis, 75006 Paris', activityName: 'Garden Stroll at Luxembourg', duration: 3, priceRange: { low: 0, medium: 15, high: 30 } },
          { name: 'Tuileries Garden', lat: 48.8634, lng: 2.3275, address: 'Place de la Concorde, 75001 Paris', activityName: 'Picnic at Tuileries', duration: 3, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Canal Saint-Martin', lat: 48.8714, lng: 2.3656, address: 'Quai de Valmy, 75010 Paris', activityName: 'Canal-side Walk', duration: 2, priceRange: { low: 0, medium: 10, high: 25 } },
          { name: 'Parc des Buttes-Chaumont', lat: 48.8809, lng: 2.3825, address: '1 Rue Botzaris, 75019 Paris', activityName: 'Park Relaxation', duration: 3, priceRange: { low: 0, medium: 10, high: 20 } },
          { name: 'Seine River Banks', lat: 48.8566, lng: 2.3522, address: 'Berges de Seine, Paris', activityName: 'Seine Riverside Walk', duration: 2, priceRange: { low: 0, medium: 15, high: 35 } },
        ],
        indoor: [
          { name: 'Le Marais Hammam', lat: 48.8566, lng: 2.3592, address: '31 Rue des Rosiers, 75004 Paris', activityName: 'Traditional Hammam Spa', duration: 3, priceRange: { low: 40, medium: 80, high: 150 } },
          { name: 'Café de Flore', lat: 48.8540, lng: 2.3325, address: '172 Boulevard Saint-Germain, 75006 Paris', activityName: 'Iconic Café Experience', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Shakespeare and Company', lat: 48.8526, lng: 2.3471, address: '37 Rue de la Bûcherie, 75005 Paris', activityName: 'Literary Bookstore Visit', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Galeries Lafayette Rooftop', lat: 48.8738, lng: 2.3320, address: '40 Boulevard Haussmann, 75009 Paris', activityName: 'Rooftop Relaxation', duration: 2, priceRange: { low: 0, medium: 25, high: 60 } },
          { name: 'Palais Royal Gardens', lat: 48.8636, lng: 2.3370, address: '8 Rue de Montpensier, 75001 Paris', activityName: 'Covered Garden Visit', duration: 2, priceRange: { low: 0, medium: 10, high: 25 } },
        ],
        nightlife: [
          { name: 'Seine River Cruise', lat: 48.8584, lng: 2.2945, address: 'Port de la Bourdonnais, 75007 Paris', activityName: 'Evening Seine Cruise', duration: 2, priceRange: { low: 15, medium: 45, high: 120 } },
          { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, address: 'Champ de Mars, 75007 Paris', activityName: 'Eiffel Tower at Night', duration: 3, priceRange: { low: 25, medium: 40, high: 100 } },
          { name: 'Le Comptoir du Panthéon', lat: 48.8462, lng: 2.3462, address: '16 Rue Soufflot, 75005 Paris', activityName: 'Evening Wine & Cheese', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Montmartre', lat: 48.8867, lng: 2.3431, address: 'Place du Tertre, 75018 Paris', activityName: 'Sunset at Sacré-Cœur', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Jazz Club Duc des Lombards', lat: 48.8609, lng: 2.3488, address: '42 Rue des Lombards, 75001 Paris', activityName: 'Live Jazz Evening', duration: 3, priceRange: { low: 25, medium: 50, high: 100 } },
        ],
      },
      adventure: {
        outdoor: [
          { name: 'Eiffel Tower Stairs', lat: 48.8584, lng: 2.2945, address: 'Champ de Mars, 75007 Paris', activityName: 'Climb the Eiffel Tower', duration: 3, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Bois de Boulogne', lat: 48.8621, lng: 2.2517, address: 'Route de Suresnes, 75016 Paris', activityName: 'Cycling in Bois de Boulogne', duration: 4, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Montmartre Hills', lat: 48.8867, lng: 2.3431, address: 'Rue Lepic, 75018 Paris', activityName: 'Montmartre Hill Climb', duration: 3, priceRange: { low: 0, medium: 15, high: 35 } },
          { name: 'Seine River', lat: 48.8566, lng: 2.3522, address: 'Port de la Bourdonnais, 75007 Paris', activityName: 'Kayaking on the Seine', duration: 3, priceRange: { low: 35, medium: 60, high: 100 } },
          { name: 'Catacombs Entrance', lat: 48.8338, lng: 2.3324, address: '1 Avenue du Colonel Henri Rol-Tanguy, 75014 Paris', activityName: 'Catacombs Exploration', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
        ],
        indoor: [
          { name: 'Arkose Nation', lat: 48.8486, lng: 2.3925, address: '85 Rue de Charenton, 75012 Paris', activityName: 'Indoor Rock Climbing', duration: 3, priceRange: { low: 20, medium: 35, high: 60 } },
          { name: 'Lock Academy Paris', lat: 48.8697, lng: 2.3490, address: '20 Rue Duperré, 75009 Paris', activityName: 'Escape Room Adventure', duration: 2, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'Aquaboulevard', lat: 48.8312, lng: 2.2867, address: '4-6 Rue Louis Armand, 75015 Paris', activityName: 'Water Park Adventure', duration: 4, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'Mk2 VR', lat: 48.8423, lng: 2.3730, address: '32 Quai de la Loire, 75019 Paris', activityName: 'Virtual Reality Experience', duration: 2, priceRange: { low: 20, medium: 35, high: 60 } },
          { name: 'Laser Game Evolution', lat: 48.8844, lng: 2.3390, address: '10 Rue de Steinkerque, 75018 Paris', activityName: 'Laser Tag Battle', duration: 2, priceRange: { low: 15, medium: 25, high: 45 } },
        ],
        nightlife: [
          { name: 'Moulin Rouge Area', lat: 48.8841, lng: 2.3323, address: '82 Boulevard de Clichy, 75018 Paris', activityName: 'Pigalle Night Walk', duration: 2, priceRange: { low: 0, medium: 30, high: 180 } },
          { name: 'Rex Club', lat: 48.8702, lng: 2.3481, address: '5 Boulevard Poissonnière, 75002 Paris', activityName: 'Underground Clubbing', duration: 4, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Pont Alexandre III', lat: 48.8637, lng: 2.3136, address: 'Pont Alexandre III, Paris', activityName: 'Night Photography Walk', duration: 2, priceRange: { low: 0, medium: 40, high: 100 } },
          { name: 'Le Baron', lat: 48.8656, lng: 2.3075, address: '6 Avenue Marceau, 75008 Paris', activityName: 'Exclusive Nightclub', duration: 4, priceRange: { low: 30, medium: 80, high: 200 } },
          { name: 'Batofar', lat: 48.8341, lng: 2.3760, address: 'Port de la Gare, 75013 Paris', activityName: 'Boat Party on Seine', duration: 4, priceRange: { low: 15, medium: 35, high: 80 } },
        ],
      },
      cultural: {
        outdoor: [
          { name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499, address: '6 Parvis Notre-Dame, 75004 Paris', activityName: 'Notre-Dame Architecture Tour', duration: 2, priceRange: { low: 0, medium: 15, high: 45 } },
          { name: 'Sacré-Cœur Basilica', lat: 48.8867, lng: 2.3431, address: '35 Rue du Chevalier de la Barre, 75018 Paris', activityName: 'Sacré-Cœur Visit', duration: 3, priceRange: { low: 0, medium: 10, high: 30 } },
          { name: 'Le Marais District', lat: 48.8566, lng: 2.3592, address: 'Rue des Francs Bourgeois, 75003 Paris', activityName: 'Historic Le Marais Walk', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
          { name: 'Père Lachaise Cemetery', lat: 48.8614, lng: 2.3936, address: '16 Rue du Repos, 75020 Paris', activityName: 'Famous Graves Tour', duration: 3, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Latin Quarter', lat: 48.8505, lng: 2.3470, address: 'Rue de la Huchette, 75005 Paris', activityName: 'Latin Quarter History Walk', duration: 2, priceRange: { low: 0, medium: 20, high: 45 } },
        ],
        indoor: [
          { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, address: 'Rue de Rivoli, 75001 Paris', activityName: 'Louvre Masterpieces Tour', duration: 4, priceRange: { low: 17, medium: 35, high: 80 } },
          { name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266, address: '1 Rue de la Légion d\'Honneur, 75007 Paris', activityName: 'Impressionist Art Tour', duration: 3, priceRange: { low: 16, medium: 30, high: 70 } },
          { name: 'Palace of Versailles', lat: 48.8049, lng: 2.1204, address: 'Place d\'Armes, 78000 Versailles', activityName: 'Versailles Palace Tour', duration: 5, priceRange: { low: 20, medium: 45, high: 120 } },
          { name: 'Centre Pompidou', lat: 48.8607, lng: 2.3524, address: 'Place Georges-Pompidou, 75004 Paris', activityName: 'Modern Art Experience', duration: 3, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Opéra Garnier', lat: 48.8720, lng: 2.3316, address: 'Place de l\'Opéra, 75009 Paris', activityName: 'Opera House Tour', duration: 2, priceRange: { low: 14, medium: 25, high: 55 } },
        ],
        nightlife: [
          { name: 'Opéra Garnier', lat: 48.8720, lng: 2.3316, address: 'Place de l\'Opéra, 75009 Paris', activityName: 'Evening Opera Performance', duration: 3, priceRange: { low: 40, medium: 120, high: 350 } },
          { name: 'Moulin Rouge', lat: 48.8841, lng: 2.3323, address: '82 Boulevard de Clichy, 75018 Paris', activityName: 'Moulin Rouge Show', duration: 3, priceRange: { low: 90, medium: 150, high: 300 } },
          { name: 'Crazy Horse', lat: 48.8656, lng: 2.3055, address: '12 Avenue George V, 75008 Paris', activityName: 'Cabaret Experience', duration: 2, priceRange: { low: 80, medium: 140, high: 280 } },
          { name: 'Lido de Paris', lat: 48.8688, lng: 2.3069, address: '116 Avenue des Champs-Élysées, 75008 Paris', activityName: 'Dinner Show', duration: 3, priceRange: { low: 100, medium: 180, high: 350 } },
          { name: 'Comédie-Française', lat: 48.8636, lng: 2.3370, address: 'Place Colette, 75001 Paris', activityName: 'French Theater Night', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
        ],
      },
      food: {
        outdoor: [
          { name: 'Marché Bastille', lat: 48.8533, lng: 2.3692, address: 'Boulevard Richard-Lenoir, 75011 Paris', activityName: 'Bastille Market Tour', duration: 3, priceRange: { low: 20, medium: 50, high: 100 } },
          { name: 'Rue Mouffetard', lat: 48.8425, lng: 2.3499, address: 'Rue Mouffetard, 75005 Paris', activityName: 'Street Food Safari', duration: 3, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Champagne Region', lat: 49.2583, lng: 4.0317, address: 'Avenue de Champagne, 51200 Épernay', activityName: 'Champagne Vineyard Tour', duration: 6, priceRange: { low: 80, medium: 150, high: 300 } },
          { name: 'Marché d\'Aligre', lat: 48.8486, lng: 2.3789, address: 'Place d\'Aligre, 75012 Paris', activityName: 'Local Market Experience', duration: 2, priceRange: { low: 15, medium: 35, high: 70 } },
          { name: 'Seine River Cruise', lat: 48.8584, lng: 2.2945, address: 'Port de la Bourdonnais, 75007 Paris', activityName: 'Lunch Cruise on Seine', duration: 3, priceRange: { low: 50, medium: 100, high: 200 } },
        ],
        indoor: [
          { name: 'Le Cordon Bleu', lat: 48.8492, lng: 2.3046, address: '13-15 Quai André Citroën, 75015 Paris', activityName: 'French Cooking Class', duration: 4, priceRange: { low: 80, medium: 150, high: 300 } },
          { name: 'Le Jules Verne', lat: 48.8584, lng: 2.2945, address: 'Eiffel Tower, 75007 Paris', activityName: 'Fine Dining at Eiffel Tower', duration: 3, priceRange: { low: 150, medium: 250, high: 450 } },
          { name: 'Cave des Abbesses', lat: 48.8842, lng: 2.3389, address: '43 Rue des Abbesses, 75018 Paris', activityName: 'Wine Tasting Session', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Jacques Genin', lat: 48.8612, lng: 2.3607, address: '133 Rue de Turenne, 75003 Paris', activityName: 'Chocolate Workshop', duration: 2, priceRange: { low: 40, medium: 80, high: 150 } },
          { name: 'Café Verlet', lat: 48.8631, lng: 2.3391, address: '256 Rue Saint-Honoré, 75001 Paris', activityName: 'Coffee Roasting Tour', duration: 2, priceRange: { low: 20, medium: 40, high: 80 } },
        ],
        nightlife: [
          { name: 'Le Train Bleu', lat: 48.8449, lng: 2.3737, address: 'Gare de Lyon, 75012 Paris', activityName: 'Belle Époque Dinner', duration: 3, priceRange: { low: 60, medium: 120, high: 220 } },
          { name: 'Pink Mamma', lat: 48.8633, lng: 2.3800, address: '20 bis Rue de Douai, 75009 Paris', activityName: 'Italian Feast', duration: 2, priceRange: { low: 35, medium: 60, high: 110 } },
          { name: 'Septime', lat: 48.8533, lng: 2.3780, address: '80 Rue de Charonne, 75011 Paris', activityName: 'Michelin Star Tasting', duration: 3, priceRange: { low: 100, medium: 180, high: 350 } },
          { name: 'Wine Bar Le Baron Rouge', lat: 48.8486, lng: 2.3789, address: '1 Rue Théophile Roussel, 75012 Paris', activityName: 'Natural Wine Evening', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Bouillon Chartier', lat: 48.8748, lng: 2.3425, address: '7 Rue du Faubourg Montmartre, 75009 Paris', activityName: 'Historic Bistro Dinner', duration: 2, priceRange: { low: 20, medium: 35, high: 60 } },
        ],
      },
    },
  },
  tokyo: {
    center: { lat: 35.6762, lng: 139.6503 },
    country: 'Japan',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    image: 'tokyo',
    pois: {
      relax: {
        outdoor: [
          { name: 'Shinjuku Gyoen', lat: 35.6852, lng: 139.7100, address: '11 Naitomachi, Shinjuku City, Tokyo', activityName: 'Garden Meditation Walk', duration: 3, priceRange: { low: 5, medium: 10, high: 25 } },
          { name: 'Ueno Park', lat: 35.7146, lng: 139.7732, address: 'Uenokoen, Taito City, Tokyo', activityName: 'Cherry Blossom Viewing', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Odaiba Beach', lat: 35.6267, lng: 139.7756, address: 'Daiba, Minato City, Tokyo', activityName: 'Seaside Relaxation', duration: 3, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Meiji Shrine Gardens', lat: 35.6764, lng: 139.6993, address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo', activityName: 'Sacred Forest Walk', duration: 2, priceRange: { low: 0, medium: 10, high: 25 } },
          { name: 'Sumida River', lat: 35.7100, lng: 139.8107, address: 'Sumida River, Tokyo', activityName: 'River Cruise', duration: 2, priceRange: { low: 10, medium: 25, high: 50 } },
        ],
        indoor: [
          { name: 'Oedo Onsen Monogatari', lat: 35.6184, lng: 139.7695, address: '2-6-3 Aomi, Koto City, Tokyo', activityName: 'Traditional Onsen Experience', duration: 4, priceRange: { low: 25, medium: 45, high: 100 } },
          { name: 'Cat Cafe Mocha', lat: 35.6595, lng: 139.7005, address: '1-19-14 Jinnan, Shibuya City, Tokyo', activityName: 'Cat Café Relaxation', duration: 2, priceRange: { low: 12, medium: 20, high: 35 } },
          { name: 'Park Hyatt Spa', lat: 35.6856, lng: 139.6907, address: '3-7-1-2 Nishi-Shinjuku, Shinjuku City, Tokyo', activityName: 'Luxury Spa Treatment', duration: 3, priceRange: { low: 80, medium: 150, high: 300 } },
          { name: 'Tsutaya Books', lat: 35.6604, lng: 139.6984, address: '17-5 Sarugakucho, Shibuya City, Tokyo', activityName: 'Design Bookstore Visit', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Aman Tokyo', lat: 35.6857, lng: 139.7634, address: 'The Otemachi Tower, Tokyo', activityName: 'Zen Meditation Session', duration: 2, priceRange: { low: 50, medium: 100, high: 200 } },
        ],
        nightlife: [
          { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454, address: '4-2-8 Shibakoen, Minato City, Tokyo', activityName: 'Night Tower Views', duration: 2, priceRange: { low: 10, medium: 20, high: 40 } },
          { name: 'Odaiba', lat: 35.6267, lng: 139.7756, address: 'Daiba, Minato City, Tokyo', activityName: 'Rainbow Bridge Night Walk', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Roppongi Hills', lat: 35.6605, lng: 139.7292, address: '6-10-1 Roppongi, Minato City, Tokyo', activityName: 'Sky Deck Night Views', duration: 2, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Yakatabune Boat', lat: 35.6267, lng: 139.7756, address: 'Tokyo Bay', activityName: 'Traditional Boat Dinner', duration: 3, priceRange: { low: 60, medium: 120, high: 200 } },
          { name: 'Bar High Five', lat: 35.6712, lng: 139.7630, address: '4-2 Ginza, Chuo City, Tokyo', activityName: 'World-Class Cocktails', duration: 2, priceRange: { low: 40, medium: 80, high: 150 } },
        ],
      },
      adventure: {
        outdoor: [
          { name: 'Mount Takao', lat: 35.6251, lng: 139.2436, address: 'Takaomachi, Hachioji, Tokyo', activityName: 'Mountain Hiking', duration: 5, priceRange: { low: 10, medium: 25, high: 60 } },
          { name: 'Tokyo Bay', lat: 35.6267, lng: 139.7756, address: 'Tokyo Bay Area', activityName: 'Kayaking Adventure', duration: 3, priceRange: { low: 40, medium: 70, high: 120 } },
          { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, address: 'Shibuya Crossing, Tokyo', activityName: 'Urban Photography Walk', duration: 2, priceRange: { low: 0, medium: 30, high: 80 } },
          { name: 'Asakusa', lat: 35.7148, lng: 139.7967, address: 'Asakusa, Taito City, Tokyo', activityName: 'Rickshaw Tour', duration: 2, priceRange: { low: 30, medium: 60, high: 100 } },
          { name: 'Imperial Palace', lat: 35.6852, lng: 139.7528, address: '1-1 Chiyoda, Chiyoda City, Tokyo', activityName: 'Palace Running Course', duration: 2, priceRange: { low: 0, medium: 15, high: 40 } },
        ],
        indoor: [
          { name: 'B-Pump Tokyo', lat: 35.7071, lng: 139.6499, address: '2-9-1 Honmachi, Shibuya City, Tokyo', activityName: 'Indoor Bouldering', duration: 3, priceRange: { low: 20, medium: 35, high: 60 } },
          { name: 'Real Escape Game', lat: 35.6595, lng: 139.7004, address: 'Shibuya, Tokyo', activityName: 'Escape Room Challenge', duration: 2, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'VR Zone Shinjuku', lat: 35.6938, lng: 139.7034, address: '3-29-1 Kabukicho, Shinjuku City, Tokyo', activityName: 'VR Gaming Experience', duration: 3, priceRange: { low: 30, medium: 50, high: 90 } },
          { name: 'Round1 Stadium', lat: 35.6612, lng: 139.6984, address: 'Shibuya, Tokyo', activityName: 'Arcade Gaming Marathon', duration: 3, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'teamLab Borderless', lat: 35.6267, lng: 139.7756, address: 'Odaiba, Tokyo', activityName: 'Digital Art Adventure', duration: 3, priceRange: { low: 25, medium: 35, high: 60 } },
        ],
        nightlife: [
          { name: 'Robot Restaurant', lat: 35.6938, lng: 139.7034, address: 'Kabukicho, Shinjuku City, Tokyo', activityName: 'Robot Show Experience', duration: 2, priceRange: { low: 60, medium: 90, high: 150 } },
          { name: 'Golden Gai', lat: 35.6938, lng: 139.7034, address: 'Kabukicho, Shinjuku City, Tokyo', activityName: 'Bar Hopping Adventure', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Womb Club', lat: 35.6595, lng: 139.6984, address: 'Maruyamacho, Shibuya City, Tokyo', activityName: 'Techno Clubbing', duration: 4, priceRange: { low: 25, medium: 45, high: 80 } },
          { name: 'Shibuya Sky', lat: 35.6595, lng: 139.7004, address: 'Shibuya Scramble Square, Tokyo', activityName: 'Night Observation Deck', duration: 2, priceRange: { low: 20, medium: 25, high: 40 } },
          { name: 'Ageha', lat: 35.6267, lng: 139.8107, address: 'Koto City, Tokyo', activityName: 'Mega Club Experience', duration: 5, priceRange: { low: 35, medium: 60, high: 100 } },
        ],
      },
      cultural: {
        outdoor: [
          { name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, address: '2-3-1 Asakusa, Taito City, Tokyo', activityName: 'Ancient Temple Visit', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Meiji Shrine', lat: 35.6764, lng: 139.6993, address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo', activityName: 'Shinto Shrine Experience', duration: 2, priceRange: { low: 0, medium: 10, high: 30 } },
          { name: 'Harajuku', lat: 35.6702, lng: 139.7027, address: 'Harajuku, Shibuya City, Tokyo', activityName: 'Japanese Fashion Tour', duration: 3, priceRange: { low: 0, medium: 30, high: 80 } },
          { name: 'Yanaka District', lat: 35.7246, lng: 139.7662, address: 'Yanaka, Taito City, Tokyo', activityName: 'Old Tokyo Walking Tour', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
          { name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, address: '4-16-2 Tsukiji, Chuo City, Tokyo', activityName: 'Fish Market Culture', duration: 2, priceRange: { low: 15, medium: 40, high: 80 } },
        ],
        indoor: [
          { name: 'Tokyo National Museum', lat: 35.7189, lng: 139.7765, address: '13-9 Uenokoen, Taito City, Tokyo', activityName: 'Japanese Art & History', duration: 4, priceRange: { low: 10, medium: 20, high: 50 } },
          { name: 'Edo-Tokyo Museum', lat: 35.6966, lng: 139.7963, address: '1-4-1 Yokoami, Sumida City, Tokyo', activityName: 'Edo Period Exhibition', duration: 3, priceRange: { low: 10, medium: 20, high: 45 } },
          { name: 'Kabuki-za Theatre', lat: 35.6693, lng: 139.7679, address: '4-12-15 Ginza, Chuo City, Tokyo', activityName: 'Kabuki Performance', duration: 4, priceRange: { low: 25, medium: 60, high: 150 } },
          { name: 'Mori Art Museum', lat: 35.6605, lng: 139.7292, address: '6-10-1 Roppongi, Minato City, Tokyo', activityName: 'Contemporary Art Tour', duration: 3, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Sumo Museum', lat: 35.6966, lng: 139.7933, address: '1-3-28 Yokoami, Sumida City, Tokyo', activityName: 'Sumo Culture Experience', duration: 2, priceRange: { low: 0, medium: 15, high: 35 } },
        ],
        nightlife: [
          { name: 'Kabuki-za Theatre', lat: 35.6693, lng: 139.7679, address: '4-12-15 Ginza, Chuo City, Tokyo', activityName: 'Evening Kabuki Show', duration: 3, priceRange: { low: 40, medium: 100, high: 200 } },
          { name: 'Geisha District', lat: 35.7148, lng: 139.7967, address: 'Asakusa, Tokyo', activityName: 'Geisha Entertainment', duration: 3, priceRange: { low: 100, medium: 200, high: 400 } },
          { name: 'Sumo Stable', lat: 35.6966, lng: 139.7933, address: 'Ryogoku, Tokyo', activityName: 'Sumo Dinner Experience', duration: 3, priceRange: { low: 60, medium: 120, high: 250 } },
          { name: 'National Theatre', lat: 35.6852, lng: 139.7528, address: 'Hayabusacho, Chiyoda City, Tokyo', activityName: 'Traditional Arts Night', duration: 3, priceRange: { low: 35, medium: 70, high: 150 } },
          { name: 'Tokyo Dome', lat: 35.7056, lng: 139.7519, address: '1-3-61 Koraku, Bunkyo City, Tokyo', activityName: 'Baseball Night', duration: 3, priceRange: { low: 30, medium: 60, high: 150 } },
        ],
      },
      food: {
        outdoor: [
          { name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, address: '4-16-2 Tsukiji, Chuo City, Tokyo', activityName: 'Fish Market Food Tour', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Ameya-Yokocho', lat: 35.7100, lng: 139.7747, address: 'Ueno, Taito City, Tokyo', activityName: 'Street Food Adventure', duration: 3, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Yanaka Ginza', lat: 35.7246, lng: 139.7662, address: 'Yanaka, Taito City, Tokyo', activityName: 'Traditional Snack Walk', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Omoide Yokocho', lat: 35.6938, lng: 139.6997, address: 'Nishishinjuku, Shinjuku City, Tokyo', activityName: 'Yakitori Alley Experience', duration: 3, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Depachika Food Halls', lat: 35.6812, lng: 139.7671, address: 'Various Department Stores, Tokyo', activityName: 'Department Store Food Tour', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
        ],
        indoor: [
          { name: 'ABC Cooking Studio', lat: 35.6595, lng: 139.7004, address: 'Shibuya, Tokyo', activityName: 'Japanese Cooking Class', duration: 3, priceRange: { low: 50, medium: 80, high: 150 } },
          { name: 'Sukiyabashi Jiro', lat: 35.6712, lng: 139.7630, address: '4-2-15 Ginza, Chuo City, Tokyo', activityName: 'Legendary Sushi Experience', duration: 2, priceRange: { low: 250, medium: 350, high: 500 } },
          { name: 'Sake Plaza', lat: 35.6668, lng: 139.7628, address: '1-1-21 Nishi-Shimbashi, Minato City, Tokyo', activityName: 'Sake Tasting Session', duration: 2, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Shiroi Koibito Park', lat: 35.6762, lng: 139.7002, address: 'Tokyo Branch', activityName: 'Chocolate Making Class', duration: 2, priceRange: { low: 30, medium: 50, high: 90 } },
          { name: 'Blue Bottle Coffee', lat: 35.6570, lng: 139.7035, address: 'Nakameguro, Tokyo', activityName: 'Coffee Brewing Workshop', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
        ],
        nightlife: [
          { name: 'Izakaya Alley', lat: 35.6938, lng: 139.7034, address: 'Shinjuku, Tokyo', activityName: 'Izakaya Hopping', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Ramen Street', lat: 35.6812, lng: 139.7671, address: 'Tokyo Station, Tokyo', activityName: 'Late Night Ramen', duration: 2, priceRange: { low: 12, medium: 20, high: 40 } },
          { name: 'Ginza Sushi', lat: 35.6712, lng: 139.7630, address: 'Ginza, Chuo City, Tokyo', activityName: 'Omakase Dinner', duration: 3, priceRange: { low: 100, medium: 200, high: 400 } },
          { name: 'Whisky Bar Zoetrope', lat: 35.6938, lng: 139.7034, address: 'Shinjuku, Tokyo', activityName: 'Japanese Whisky Tasting', duration: 2, priceRange: { low: 40, medium: 80, high: 160 } },
          { name: 'Kagari', lat: 35.6712, lng: 139.7630, address: 'Ginza, Tokyo', activityName: 'Michelin Ramen Experience', duration: 2, priceRange: { low: 15, medium: 25, high: 45 } },
        ],
      },
    },
  },
  'new york': {
    center: { lat: 40.7128, lng: -74.0060 },
    country: 'USA',
    currency: 'USD',
    timezone: 'America/New_York',
    image: 'newyork',
    pois: {
      relax: {
        outdoor: [
          { name: 'Central Park', lat: 40.7829, lng: -73.9654, address: 'Central Park, New York, NY', activityName: 'Central Park Stroll', duration: 4, priceRange: { low: 0, medium: 20, high: 60 } },
          { name: 'High Line', lat: 40.7480, lng: -74.0048, address: 'High Line, New York, NY', activityName: 'Elevated Park Walk', duration: 2, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Brooklyn Bridge Park', lat: 40.7024, lng: -73.9963, address: 'Brooklyn Bridge Park, Brooklyn, NY', activityName: 'Waterfront Relaxation', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Hudson River Park', lat: 40.7316, lng: -74.0108, address: 'Hudson River Park, New York, NY', activityName: 'River Park Sunset', duration: 2, priceRange: { low: 0, medium: 10, high: 30 } },
          { name: 'The Battery', lat: 40.7033, lng: -74.0170, address: 'The Battery, New York, NY', activityName: 'Harbor Garden Visit', duration: 2, priceRange: { low: 0, medium: 10, high: 25 } },
        ],
        indoor: [
          { name: 'Aire Ancient Baths', lat: 40.7209, lng: -74.0009, address: '88 Franklin St, New York, NY', activityName: 'Roman Bath Experience', duration: 3, priceRange: { low: 80, medium: 130, high: 220 } },
          { name: 'McNally Jackson Books', lat: 40.7236, lng: -73.9965, address: '52 Prince St, New York, NY', activityName: 'Bookstore Browsing', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Russian & Turkish Baths', lat: 40.7281, lng: -73.9829, address: '268 E 10th St, New York, NY', activityName: 'Traditional Baths', duration: 3, priceRange: { low: 40, medium: 60, high: 100 } },
          { name: 'The Strand', lat: 40.7333, lng: -73.9910, address: '828 Broadway, New York, NY', activityName: 'Iconic Bookstore Visit', duration: 2, priceRange: { low: 0, medium: 25, high: 60 } },
          { name: 'MNDFL Meditation', lat: 40.7336, lng: -73.9943, address: '10 E 14th St, New York, NY', activityName: 'Guided Meditation', duration: 2, priceRange: { low: 20, medium: 35, high: 60 } },
        ],
        nightlife: [
          { name: 'Top of the Rock', lat: 40.7587, lng: -73.9787, address: '30 Rockefeller Plaza, New York, NY', activityName: 'Night City Views', duration: 2, priceRange: { low: 40, medium: 45, high: 70 } },
          { name: 'Jazz at Lincoln Center', lat: 40.7687, lng: -73.9832, address: '10 Columbus Circle, New York, NY', activityName: 'Evening Jazz Concert', duration: 3, priceRange: { low: 35, medium: 75, high: 150 } },
          { name: 'Rooftop Bar 230 Fifth', lat: 40.7442, lng: -73.9879, address: '230 5th Ave, New York, NY', activityName: 'Rooftop Drinks', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, address: 'Brooklyn Bridge, New York, NY', activityName: 'Night Bridge Walk', duration: 2, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'DUMBO', lat: 40.7033, lng: -73.9883, address: 'DUMBO, Brooklyn, NY', activityName: 'Brooklyn Waterfront Evening', duration: 2, priceRange: { low: 0, medium: 25, high: 60 } },
        ],
      },
      adventure: {
        outdoor: [
          { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, address: 'Brooklyn Bridge, New York, NY', activityName: 'Bridge Walk Adventure', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Hudson River', lat: 40.7456, lng: -74.0089, address: 'Pier 40, New York, NY', activityName: 'Kayaking Hudson River', duration: 3, priceRange: { low: 40, medium: 70, high: 120 } },
          { name: 'Governors Island', lat: 40.6892, lng: -74.0167, address: 'Governors Island, New York, NY', activityName: 'Island Cycling', duration: 4, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445, address: 'Liberty Island, New York, NY', activityName: 'Crown Climb', duration: 4, priceRange: { low: 24, medium: 35, high: 70 } },
          { name: 'Central Park', lat: 40.7829, lng: -73.9654, address: 'Central Park, New York, NY', activityName: 'Rowboat Adventure', duration: 2, priceRange: { low: 20, medium: 35, high: 60 } },
        ],
        indoor: [
          { name: 'Brooklyn Boulders', lat: 40.6782, lng: -73.9442, address: '575 Degraw St, Brooklyn, NY', activityName: 'Indoor Rock Climbing', duration: 3, priceRange: { low: 35, medium: 50, high: 80 } },
          { name: 'Mission Escape', lat: 40.7527, lng: -73.9772, address: '265 W 37th St, New York, NY', activityName: 'Escape Room Challenge', duration: 2, priceRange: { low: 35, medium: 50, high: 80 } },
          { name: 'Sky Zone', lat: 40.8568, lng: -73.8438, address: 'Bronx, NY', activityName: 'Trampoline Park', duration: 2, priceRange: { low: 25, medium: 40, high: 60 } },
          { name: 'VR World NYC', lat: 40.7505, lng: -73.9934, address: '4 E 34th St, New York, NY', activityName: 'Virtual Reality Gaming', duration: 2, priceRange: { low: 35, medium: 55, high: 90 } },
          { name: 'RPM Raceway', lat: 40.8176, lng: -73.9166, address: '99 Caven Point Rd, Jersey City, NJ', activityName: 'Indoor Go-Kart Racing', duration: 2, priceRange: { low: 30, medium: 50, high: 80 } },
        ],
        nightlife: [
          { name: 'Edge Observation Deck', lat: 40.7538, lng: -74.0014, address: '30 Hudson Yards, New York, NY', activityName: 'Night Sky Deck', duration: 2, priceRange: { low: 38, medium: 45, high: 80 } },
          { name: 'Output Brooklyn', lat: 40.7214, lng: -73.9579, address: 'Williamsburg, Brooklyn, NY', activityName: 'Rooftop Club Night', duration: 4, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Sleep No More', lat: 40.7505, lng: -74.0065, address: '530 W 27th St, New York, NY', activityName: 'Immersive Theater', duration: 3, priceRange: { low: 100, medium: 140, high: 200 } },
          { name: 'House of Yes', lat: 40.7049, lng: -73.9228, address: '2 Wyckoff Ave, Brooklyn, NY', activityName: 'Performance Club Night', duration: 4, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Please Don\'t Tell', lat: 40.7265, lng: -73.9838, address: '113 St Marks Pl, New York, NY', activityName: 'Speakeasy Experience', duration: 2, priceRange: { low: 40, medium: 70, high: 120 } },
        ],
      },
      cultural: {
        outdoor: [
          { name: 'Times Square', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY', activityName: 'Broadway District Walk', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'SoHo', lat: 40.7233, lng: -74.0030, address: 'SoHo, New York, NY', activityName: 'Art Gallery Hopping', duration: 3, priceRange: { low: 0, medium: 30, high: 80 } },
          { name: 'Greenwich Village', lat: 40.7336, lng: -74.0027, address: 'Greenwich Village, New York, NY', activityName: 'Historic Village Tour', duration: 3, priceRange: { low: 0, medium: 30, high: 70 } },
          { name: 'Harlem', lat: 40.8116, lng: -73.9465, address: 'Harlem, New York, NY', activityName: 'Harlem Renaissance Walk', duration: 3, priceRange: { low: 0, medium: 35, high: 80 } },
          { name: 'Little Italy', lat: 40.7191, lng: -73.9973, address: 'Little Italy, New York, NY', activityName: 'Immigrant Heritage Tour', duration: 2, priceRange: { low: 0, medium: 25, high: 60 } },
        ],
        indoor: [
          { name: 'Metropolitan Museum', lat: 40.7794, lng: -73.9632, address: '1000 5th Ave, New York, NY', activityName: 'Met Museum Tour', duration: 4, priceRange: { low: 25, medium: 40, high: 80 } },
          { name: 'MoMA', lat: 40.7614, lng: -73.9776, address: '11 W 53rd St, New York, NY', activityName: 'Modern Art Experience', duration: 3, priceRange: { low: 25, medium: 35, high: 60 } },
          { name: 'American Museum of Natural History', lat: 40.7813, lng: -73.9740, address: '200 Central Park West, New York, NY', activityName: 'Natural History Tour', duration: 4, priceRange: { low: 23, medium: 35, high: 60 } },
          { name: 'Broadway Theater', lat: 40.7590, lng: -73.9845, address: 'Broadway, New York, NY', activityName: 'Broadway Show', duration: 3, priceRange: { low: 80, medium: 150, high: 350 } },
          { name: 'Guggenheim Museum', lat: 40.7830, lng: -73.9590, address: '1071 5th Ave, New York, NY', activityName: 'Spiral Art Tour', duration: 3, priceRange: { low: 25, medium: 35, high: 60 } },
        ],
        nightlife: [
          { name: 'Broadway', lat: 40.7590, lng: -73.9845, address: 'Broadway, New York, NY', activityName: 'Evening Broadway Show', duration: 3, priceRange: { low: 100, medium: 200, high: 450 } },
          { name: 'Blue Note Jazz Club', lat: 40.7308, lng: -74.0006, address: '131 W 3rd St, New York, NY', activityName: 'Live Jazz Performance', duration: 3, priceRange: { low: 35, medium: 75, high: 150 } },
          { name: 'Carnegie Hall', lat: 40.7651, lng: -73.9799, address: '881 7th Ave, New York, NY', activityName: 'Classical Concert', duration: 3, priceRange: { low: 40, medium: 100, high: 250 } },
          { name: 'Comedy Cellar', lat: 40.7303, lng: -74.0003, address: '117 MacDougal St, New York, NY', activityName: 'Stand-Up Comedy Night', duration: 2, priceRange: { low: 25, medium: 40, high: 75 } },
          { name: 'Apollo Theater', lat: 40.8100, lng: -73.9500, address: '253 W 125th St, New York, NY', activityName: 'Harlem Music Night', duration: 3, priceRange: { low: 35, medium: 65, high: 130 } },
        ],
      },
      food: {
        outdoor: [
          { name: 'Smorgasburg', lat: 40.7214, lng: -73.9579, address: 'Williamsburg, Brooklyn, NY', activityName: 'Food Market Festival', duration: 3, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Chinatown', lat: 40.7158, lng: -73.9970, address: 'Chinatown, New York, NY', activityName: 'Chinatown Food Tour', duration: 3, priceRange: { low: 20, medium: 45, high: 90 } },
          { name: 'Chelsea Market', lat: 40.7424, lng: -74.0061, address: '75 9th Ave, New York, NY', activityName: 'Market Exploration', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Finger Lakes', lat: 42.5400, lng: -76.9000, address: 'Finger Lakes Region, NY', activityName: 'Vineyard Day Trip', duration: 8, priceRange: { low: 100, medium: 200, high: 400 } },
          { name: 'Jackson Heights', lat: 40.7557, lng: -73.8831, address: 'Jackson Heights, Queens, NY', activityName: 'Multi-Cultural Food Safari', duration: 3, priceRange: { low: 20, medium: 45, high: 90 } },
        ],
        indoor: [
          { name: 'Institute of Culinary Education', lat: 40.7459, lng: -74.0077, address: '225 Liberty St, New York, NY', activityName: 'NYC Cooking Class', duration: 4, priceRange: { low: 100, medium: 180, high: 300 } },
          { name: 'Le Bernardin', lat: 40.7614, lng: -73.9817, address: '155 W 51st St, New York, NY', activityName: 'Michelin Star Dining', duration: 3, priceRange: { low: 180, medium: 280, high: 450 } },
          { name: 'Eataly NYC', lat: 40.7421, lng: -73.9893, address: '200 5th Ave, New York, NY', activityName: 'Italian Food Hall Tour', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Li-Lac Chocolates', lat: 40.7340, lng: -74.0027, address: '40 8th Ave, New York, NY', activityName: 'Chocolate Making Class', duration: 2, priceRange: { low: 45, medium: 75, high: 130 } },
          { name: 'La Colombe', lat: 40.7234, lng: -73.9989, address: '270 Lafayette St, New York, NY', activityName: 'Coffee Roasting Tour', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
        ],
        nightlife: [
          { name: 'Katz\'s Delicatessen', lat: 40.7223, lng: -73.9874, address: '205 E Houston St, New York, NY', activityName: 'Late Night Deli', duration: 2, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'Eleven Madison Park', lat: 40.7417, lng: -73.9867, address: '11 Madison Ave, New York, NY', activityName: 'Fine Dining Experience', duration: 3, priceRange: { low: 250, medium: 350, high: 500 } },
          { name: 'Balthazar', lat: 40.7234, lng: -73.9978, address: '80 Spring St, New York, NY', activityName: 'French Bistro Dinner', duration: 2, priceRange: { low: 60, medium: 100, high: 180 } },
          { name: 'Dead Rabbit', lat: 40.7033, lng: -74.0100, address: '30 Water St, New York, NY', activityName: 'Award-Winning Cocktails', duration: 2, priceRange: { low: 40, medium: 70, high: 130 } },
          { name: 'Joe\'s Pizza', lat: 40.7336, lng: -74.0027, address: '7 Carmine St, New York, NY', activityName: 'Iconic NYC Pizza', duration: 1, priceRange: { low: 8, medium: 15, high: 30 } },
        ],
      },
    },
  },
  london: {
    center: { lat: 51.5074, lng: -0.1278 },
    country: 'United Kingdom',
    currency: 'GBP',
    timezone: 'Europe/London',
    image: 'london',
    pois: {
      relax: {
        outdoor: [
          { name: 'Hyde Park', lat: 51.5073, lng: -0.1657, address: 'Hyde Park, London', activityName: 'Royal Park Stroll', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: "Regent's Park", lat: 51.5313, lng: -0.1570, address: "Regent's Park, London", activityName: 'Rose Garden Visit', duration: 3, priceRange: { low: 0, medium: 15, high: 35 } },
          { name: 'Hampstead Heath', lat: 51.5606, lng: -0.1636, address: 'Hampstead Heath, London', activityName: 'Heath Walking', duration: 4, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Kew Gardens', lat: 51.4787, lng: -0.2956, address: 'Royal Botanic Gardens, Kew, London', activityName: 'Botanical Gardens', duration: 4, priceRange: { low: 20, medium: 25, high: 50 } },
          { name: 'South Bank', lat: 51.5055, lng: -0.1147, address: 'South Bank, London', activityName: 'Thames Riverside Walk', duration: 2, priceRange: { low: 0, medium: 15, high: 35 } },
        ],
        indoor: [
          { name: 'ESPA Life at Corinthia', lat: 51.5073, lng: -0.1234, address: 'Whitehall Place, London', activityName: 'Luxury Spa Day', duration: 4, priceRange: { low: 150, medium: 250, high: 450 } },
          { name: 'Daunt Books', lat: 51.5210, lng: -0.1536, address: '83 Marylebone High St, London', activityName: 'Historic Bookshop Visit', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: "Fortnum & Mason's", lat: 51.5088, lng: -0.1375, address: '181 Piccadilly, London', activityName: 'Afternoon Tea', duration: 3, priceRange: { low: 50, medium: 80, high: 150 } },
          { name: 'Porchester Spa', lat: 51.5178, lng: -0.1881, address: 'Queensway, London', activityName: 'Turkish Bath Experience', duration: 3, priceRange: { low: 35, medium: 50, high: 90 } },
          { name: 'The Wolseley', lat: 51.5073, lng: -0.1413, address: '160 Piccadilly, London', activityName: 'Grand Café Experience', duration: 2, priceRange: { low: 40, medium: 70, high: 130 } },
        ],
        nightlife: [
          { name: 'Sky Garden', lat: 51.5113, lng: -0.0836, address: '20 Fenchurch St, London', activityName: 'Night City Views', duration: 2, priceRange: { low: 0, medium: 30, high: 80 } },
          { name: 'Ronnie Scott\'s', lat: 51.5134, lng: -0.1326, address: '47 Frith St, London', activityName: 'Live Jazz Evening', duration: 3, priceRange: { low: 40, medium: 70, high: 130 } },
          { name: 'Nightjar', lat: 51.5269, lng: -0.0879, address: '129 City Rd, London', activityName: 'Speakeasy Cocktails', duration: 2, priceRange: { low: 35, medium: 60, high: 110 } },
          { name: 'Thames Path', lat: 51.5055, lng: -0.1147, address: 'South Bank, London', activityName: 'Night Thames Walk', duration: 2, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Sketch', lat: 51.5126, lng: -0.1424, address: '9 Conduit St, London', activityName: 'Art Gallery Bar', duration: 2, priceRange: { low: 45, medium: 80, high: 150 } },
        ],
      },
      adventure: {
        outdoor: [
          { name: 'The O2', lat: 51.5033, lng: 0.0032, address: 'Peninsula Square, London', activityName: 'O2 Roof Walk', duration: 2, priceRange: { low: 35, medium: 45, high: 75 } },
          { name: 'Lee Valley', lat: 51.6069, lng: -0.0366, address: 'Lee Valley, London', activityName: 'White Water Rafting', duration: 3, priceRange: { low: 50, medium: 70, high: 110 } },
          { name: 'Thames', lat: 51.5074, lng: -0.1278, address: 'Thames River, London', activityName: 'Thames RIB Speedboat', duration: 2, priceRange: { low: 45, medium: 65, high: 100 } },
          { name: 'Richmond Park', lat: 51.4429, lng: -0.2745, address: 'Richmond Park, London', activityName: 'Deer Park Cycling', duration: 4, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'ArcelorMittal Orbit', lat: 51.5385, lng: -0.0134, address: 'Queen Elizabeth Olympic Park, London', activityName: 'Orbit Slide', duration: 2, priceRange: { low: 20, medium: 30, high: 50 } },
        ],
        indoor: [
          { name: 'The Castle Climbing Centre', lat: 51.5625, lng: -0.0821, address: 'Green Lanes, London', activityName: 'Indoor Rock Climbing', duration: 3, priceRange: { low: 20, medium: 35, high: 60 } },
          { name: 'clueQuest', lat: 51.5313, lng: -0.1094, address: "169-171 Caledonian Rd, King's Cross, London", activityName: 'Escape Room Mission', duration: 2, priceRange: { low: 30, medium: 45, high: 75 } },
          { name: 'Oxygen Freejumping', lat: 51.4987, lng: -0.0247, address: 'Greenwich, London', activityName: 'Trampoline Park', duration: 2, priceRange: { low: 15, medium: 25, high: 45 } },
          { name: 'DNA VR', lat: 51.5250, lng: -0.0757, address: '95 Aldgate High St, London', activityName: 'VR Gaming Experience', duration: 2, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'TeamSport Karting', lat: 51.5074, lng: -0.0899, address: 'Tower Bridge, London', activityName: 'Indoor Go-Karting', duration: 2, priceRange: { low: 35, medium: 55, high: 90 } },
        ],
        nightlife: [
          { name: 'Fabric', lat: 51.5204, lng: -0.1033, address: '77A Charterhouse St, London', activityName: 'Legendary Club Night', duration: 5, priceRange: { low: 20, medium: 35, high: 60 } },
          { name: 'Ministry of Sound', lat: 51.4977, lng: -0.0984, address: '103 Gaunt St, London', activityName: 'Electronic Music Night', duration: 5, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'Printworks', lat: 51.4976, lng: -0.0254, address: 'Surrey Quays Rd, London', activityName: 'Industrial Venue Party', duration: 4, priceRange: { low: 25, medium: 45, high: 80 } },
          { name: 'Shard', lat: 51.5045, lng: -0.0865, address: '32 London Bridge St, London', activityName: 'Night Views from The Shard', duration: 2, priceRange: { low: 35, medium: 45, high: 80 } },
          { name: 'XOYO', lat: 51.5269, lng: -0.0823, address: '32-37 Cowper St, London', activityName: 'Live Music & DJs', duration: 4, priceRange: { low: 15, medium: 25, high: 50 } },
        ],
      },
      cultural: {
        outdoor: [
          { name: 'Tower of London', lat: 51.5081, lng: -0.0759, address: 'Tower of London, London', activityName: 'Historic Tower Visit', duration: 4, priceRange: { low: 30, medium: 40, high: 70 } },
          { name: 'Westminster Abbey', lat: 51.4994, lng: -0.1273, address: 'Westminster Abbey, London', activityName: 'Abbey Architecture Tour', duration: 2, priceRange: { low: 25, medium: 30, high: 55 } },
          { name: 'Borough Market Area', lat: 51.5055, lng: -0.0910, address: 'Borough Market, London', activityName: 'Historic Southwark Walk', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
          { name: 'Notting Hill', lat: 51.5111, lng: -0.2055, address: 'Notting Hill, London', activityName: 'Colorful Streets Tour', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'Greenwich', lat: 51.4820, lng: -0.0089, address: 'Greenwich, London', activityName: 'Maritime Heritage Walk', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
        ],
        indoor: [
          { name: 'British Museum', lat: 51.5194, lng: -0.1270, address: 'Great Russell St, London', activityName: 'World History Tour', duration: 4, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: 'National Gallery', lat: 51.5089, lng: -0.1283, address: 'Trafalgar Square, London', activityName: 'Masterpieces Tour', duration: 3, priceRange: { low: 0, medium: 18, high: 45 } },
          { name: 'Victoria and Albert Museum', lat: 51.4966, lng: -0.1722, address: 'Cromwell Rd, London', activityName: 'Design & Art Tour', duration: 3, priceRange: { low: 0, medium: 20, high: 50 } },
          { name: "Shakespeare's Globe", lat: 51.5081, lng: -0.0971, address: '21 New Globe Walk, London', activityName: 'Theatre Experience', duration: 3, priceRange: { low: 20, medium: 40, high: 80 } },
          { name: 'Natural History Museum', lat: 51.4967, lng: -0.1764, address: 'Cromwell Rd, London', activityName: 'Natural Wonders Tour', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
        ],
        nightlife: [
          { name: 'West End', lat: 51.5134, lng: -0.1276, address: 'Leicester Square, London', activityName: 'West End Theatre', duration: 3, priceRange: { low: 40, medium: 100, high: 250 } },
          { name: 'Royal Albert Hall', lat: 51.5009, lng: -0.1774, address: 'Kensington Gore, London', activityName: 'Classical Concert', duration: 3, priceRange: { low: 40, medium: 90, high: 200 } },
          { name: "Shakespeare's Globe", lat: 51.5081, lng: -0.0971, address: '21 New Globe Walk, London', activityName: 'Evening Performance', duration: 3, priceRange: { low: 25, medium: 55, high: 120 } },
          { name: 'National Theatre', lat: 51.5067, lng: -0.1147, address: 'South Bank, London', activityName: 'Drama Night', duration: 3, priceRange: { low: 25, medium: 60, high: 130 } },
          { name: 'The Comedy Store', lat: 51.5117, lng: -0.1318, address: '1a Oxendon St, London', activityName: 'Stand-Up Comedy', duration: 2, priceRange: { low: 20, medium: 30, high: 55 } },
        ],
      },
      food: {
        outdoor: [
          { name: 'Borough Market', lat: 51.5055, lng: -0.0910, address: '8 Southwark St, London', activityName: 'Gourmet Market Tour', duration: 3, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Broadway Market', lat: 51.5377, lng: -0.0613, address: 'Broadway Market, London', activityName: 'East London Food Walk', duration: 3, priceRange: { low: 20, medium: 45, high: 90 } },
          { name: 'Brick Lane', lat: 51.5215, lng: -0.0717, address: 'Brick Lane, London', activityName: 'Curry Mile Adventure', duration: 3, priceRange: { low: 15, medium: 35, high: 70 } },
          { name: 'Surrey Hills', lat: 51.2243, lng: -0.3857, address: 'Surrey Hills', activityName: 'English Vineyard Tour', duration: 6, priceRange: { low: 60, medium: 120, high: 220 } },
          { name: 'Maltby Street Market', lat: 51.4989, lng: -0.0772, address: 'Maltby St, London', activityName: 'Artisan Food Market', duration: 2, priceRange: { low: 20, medium: 40, high: 80 } },
        ],
        indoor: [
          { name: 'Leiths School of Food', lat: 51.5107, lng: -0.2088, address: '16-20 Wendell Rd, London', activityName: 'British Cooking Class', duration: 4, priceRange: { low: 100, medium: 180, high: 300 } },
          { name: 'The Ledbury', lat: 51.5115, lng: -0.2029, address: '127 Ledbury Rd, London', activityName: 'Michelin Star Experience', duration: 3, priceRange: { low: 150, medium: 250, high: 400 } },
          { name: 'Gordon\'s Wine Bar', lat: 51.5082, lng: -0.1241, address: '47 Villiers St, London', activityName: 'Historic Wine Tasting', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Hotel Chocolat', lat: 51.5134, lng: -0.1322, address: 'Covent Garden, London', activityName: 'Chocolate Tasting', duration: 2, priceRange: { low: 30, medium: 50, high: 90 } },
          { name: 'Monmouth Coffee', lat: 51.5134, lng: -0.1254, address: '27 Monmouth St, London', activityName: 'Coffee Cupping Session', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
        ],
        nightlife: [
          { name: 'Duck & Waffle', lat: 51.5152, lng: -0.0823, address: '110 Bishopsgate, London', activityName: '24hr Fine Dining', duration: 2, priceRange: { low: 50, medium: 90, high: 160 } },
          { name: 'Dishoom', lat: 51.5175, lng: -0.1268, address: '12 Upper St Martin\'s Ln, London', activityName: 'Bombay Café Dinner', duration: 2, priceRange: { low: 30, medium: 50, high: 90 } },
          { name: 'Hawksmoor', lat: 51.5204, lng: -0.1033, address: '157 Commercial St, London', activityName: 'Steakhouse Evening', duration: 2, priceRange: { low: 60, medium: 100, high: 180 } },
          { name: 'The Clove Club', lat: 51.5269, lng: -0.0823, address: '380 Old St, London', activityName: 'Tasting Menu', duration: 3, priceRange: { low: 120, medium: 180, high: 300 } },
          { name: 'St. John', lat: 51.5204, lng: -0.1033, address: '26 St John St, London', activityName: 'Nose-to-Tail Dinner', duration: 2, priceRange: { low: 50, medium: 80, high: 140 } },
        ],
      },
    },
  },
  bali: {
    center: { lat: -8.4095, lng: 115.1889 },
    country: 'Indonesia',
    currency: 'IDR',
    timezone: 'Asia/Makassar',
    image: 'bali',
    pois: {
      relax: {
        outdoor: [
          { name: 'Seminyak Beach', lat: -8.6924, lng: 115.1573, address: 'Seminyak Beach, Bali', activityName: 'Beach Sunset Session', duration: 4, priceRange: { low: 0, medium: 15, high: 40 } },
          { name: 'Tegallalang Rice Terraces', lat: -8.4312, lng: 115.2793, address: 'Tegallalang, Gianyar, Bali', activityName: 'Rice Terrace Walk', duration: 3, priceRange: { low: 5, medium: 15, high: 35 } },
          { name: 'Tirta Gangga', lat: -8.4125, lng: 115.5874, address: 'Tirta Gangga, Karangasem, Bali', activityName: 'Water Palace Visit', duration: 3, priceRange: { low: 5, medium: 12, high: 30 } },
          { name: 'Nusa Dua Beach', lat: -8.7993, lng: 115.2350, address: 'Nusa Dua, Bali', activityName: 'Luxury Beach Day', duration: 4, priceRange: { low: 10, medium: 30, high: 80 } },
          { name: 'Munduk Waterfalls', lat: -8.2756, lng: 115.0803, address: 'Munduk, Buleleng, Bali', activityName: 'Waterfall Meditation', duration: 4, priceRange: { low: 5, medium: 15, high: 40 } },
        ],
        indoor: [
          { name: 'Fivelements', lat: -8.5478, lng: 115.2630, address: 'Mambal, Abiansemal, Bali', activityName: 'Balinese Spa Retreat', duration: 4, priceRange: { low: 80, medium: 150, high: 300 } },
          { name: 'Yoga Barn', lat: -8.5076, lng: 115.2620, address: 'Pengosekan, Ubud, Bali', activityName: 'Yoga & Meditation', duration: 3, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Como Shambhala', lat: -8.5076, lng: 115.2620, address: 'Banjar Begawan, Ubud, Bali', activityName: 'Wellness Sanctuary', duration: 4, priceRange: { low: 150, medium: 280, high: 500 } },
          { name: 'Kopi Luwak Farm', lat: -8.4312, lng: 115.2793, address: 'Tegallalang, Gianyar, Bali', activityName: 'Coffee Plantation Visit', duration: 2, priceRange: { low: 10, medium: 25, high: 50 } },
          { name: 'Ubud Wellness Spa', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Traditional Balinese Massage', duration: 3, priceRange: { low: 20, medium: 45, high: 100 } },
        ],
        nightlife: [
          { name: 'Rock Bar Bali', lat: -8.8291, lng: 115.0849, address: 'Ayana Resort, Jimbaran, Bali', activityName: 'Cliff-side Sunset Drinks', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
          { name: 'Potato Head Beach Club', lat: -8.6656, lng: 115.1356, address: 'Seminyak, Bali', activityName: 'Beach Club Evening', duration: 4, priceRange: { low: 25, medium: 60, high: 150 } },
          { name: 'La Plancha', lat: -8.7020, lng: 115.1670, address: 'Seminyak Beach, Bali', activityName: 'Beachfront Sunset', duration: 3, priceRange: { low: 15, medium: 35, high: 80 } },
          { name: 'Single Fin', lat: -8.8128, lng: 115.0940, address: 'Uluwatu, Bali', activityName: 'Sunset Cliff Views', duration: 3, priceRange: { low: 20, medium: 45, high: 100 } },
          { name: 'Ku De Ta', lat: -8.6924, lng: 115.1573, address: 'Seminyak, Bali', activityName: 'Upscale Beach Evening', duration: 3, priceRange: { low: 40, medium: 80, high: 180 } },
        ],
      },
      adventure: {
        outdoor: [
          { name: 'Mount Batur', lat: -8.2395, lng: 115.3752, address: 'Mount Batur, Kintamani, Bali', activityName: 'Sunrise Volcano Trek', duration: 6, priceRange: { low: 35, medium: 60, high: 120 } },
          { name: 'Ayung River', lat: -8.4495, lng: 115.2195, address: 'Ayung River, Ubud, Bali', activityName: 'White Water Rafting', duration: 4, priceRange: { low: 30, medium: 55, high: 100 } },
          { name: 'Nusa Penida', lat: -8.7275, lng: 115.5445, address: 'Nusa Penida, Bali', activityName: 'Island Adventure Day', duration: 8, priceRange: { low: 50, medium: 90, high: 180 } },
          { name: 'Uluwatu Cliffs', lat: -8.8291, lng: 115.0849, address: 'Uluwatu, Bali', activityName: 'Cliff Surfing Experience', duration: 4, priceRange: { low: 25, medium: 50, high: 100 } },
          { name: 'Bali Swing', lat: -8.4312, lng: 115.2793, address: 'Bongkasa Pertiwi, Bali', activityName: 'Jungle Swing Adventure', duration: 3, priceRange: { low: 25, medium: 40, high: 80 } },
        ],
        indoor: [
          { name: 'Bali Treetop Adventure', lat: -8.2756, lng: 115.1519, address: 'Bedugul, Bali', activityName: 'Treetop Climbing', duration: 3, priceRange: { low: 25, medium: 40, high: 70 } },
          { name: 'Bali Marine Walk', lat: -8.7538, lng: 115.5096, address: 'Sanur, Bali', activityName: 'Underwater Walking', duration: 2, priceRange: { low: 50, medium: 80, high: 140 } },
          { name: 'Mason Adventures', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'ATV & Buggy Adventure', duration: 3, priceRange: { low: 45, medium: 75, high: 140 } },
          { name: 'Finns Recreation Club', lat: -8.6656, lng: 115.1356, address: 'Canggu, Bali', activityName: 'Waterpark Fun', duration: 4, priceRange: { low: 25, medium: 45, high: 90 } },
          { name: 'Bali Safari', lat: -8.5837, lng: 115.3247, address: 'Gianyar, Bali', activityName: 'Night Safari Experience', duration: 3, priceRange: { low: 40, medium: 70, high: 130 } },
        ],
        nightlife: [
          { name: 'Uluwatu Temple', lat: -8.8291, lng: 115.0849, address: 'Uluwatu, Bali', activityName: 'Kecak Fire Dance', duration: 2, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Mirror Bali', lat: -8.6656, lng: 115.1356, address: 'Seminyak, Bali', activityName: 'Beach Club Party', duration: 4, priceRange: { low: 20, medium: 50, high: 120 } },
          { name: 'Sky Garden', lat: -8.7186, lng: 115.1706, address: 'Legian, Bali', activityName: 'Rooftop Clubbing', duration: 4, priceRange: { low: 15, medium: 30, high: 70 } },
          { name: 'Omnia Dayclub', lat: -8.8128, lng: 115.0940, address: 'Uluwatu, Bali', activityName: 'Cliff-top Club Night', duration: 4, priceRange: { low: 35, medium: 80, high: 180 } },
          { name: 'Old Man\'s', lat: -8.6656, lng: 115.1356, address: 'Canggu, Bali', activityName: 'Surfer Bar Night', duration: 3, priceRange: { low: 10, medium: 25, high: 60 } },
        ],
      },
      cultural: {
        outdoor: [
          { name: 'Tanah Lot Temple', lat: -8.6212, lng: 115.0868, address: 'Tanah Lot, Tabanan, Bali', activityName: 'Sea Temple Sunset', duration: 3, priceRange: { low: 5, medium: 12, high: 30 } },
          { name: 'Ubud Palace', lat: -8.5076, lng: 115.2620, address: 'Jl. Raya Ubud, Ubud, Bali', activityName: 'Royal Palace Visit', duration: 2, priceRange: { low: 0, medium: 10, high: 25 } },
          { name: 'Tirta Empul', lat: -8.4154, lng: 115.3154, address: 'Tampaksiring, Gianyar, Bali', activityName: 'Holy Spring Purification', duration: 3, priceRange: { low: 5, medium: 15, high: 35 } },
          { name: 'Besakih Temple', lat: -8.3741, lng: 115.4509, address: 'Besakih, Karangasem, Bali', activityName: 'Mother Temple Tour', duration: 4, priceRange: { low: 10, medium: 25, high: 60 } },
          { name: 'Ubud Art Market', lat: -8.5076, lng: 115.2620, address: 'Jl. Raya Ubud, Ubud, Bali', activityName: 'Traditional Crafts Walk', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
        ],
        indoor: [
          { name: 'ARMA Museum', lat: -8.5139, lng: 115.2587, address: 'Jl. Raya Pengosekan, Ubud, Bali', activityName: 'Balinese Art Museum', duration: 3, priceRange: { low: 10, medium: 18, high: 40 } },
          { name: 'Setia Darma House of Masks', lat: -8.5467, lng: 115.2614, address: 'Mas, Ubud, Bali', activityName: 'Mask Culture Tour', duration: 2, priceRange: { low: 5, medium: 12, high: 30 } },
          { name: 'Blanco Renaissance Museum', lat: -8.5024, lng: 115.2677, address: 'Campuhan, Ubud, Bali', activityName: 'Artist Legacy Tour', duration: 2, priceRange: { low: 8, medium: 15, high: 35 } },
          { name: 'Ubud Traditional Dance', lat: -8.5076, lng: 115.2620, address: 'Ubud Palace, Bali', activityName: 'Legong Dance Performance', duration: 2, priceRange: { low: 10, medium: 20, high: 45 } },
          { name: 'Batik Workshop', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Traditional Batik Class', duration: 3, priceRange: { low: 25, medium: 45, high: 90 } },
        ],
        nightlife: [
          { name: 'Ubud Palace', lat: -8.5076, lng: 115.2620, address: 'Ubud Palace, Bali', activityName: 'Kecak Dance Performance', duration: 2, priceRange: { low: 10, medium: 20, high: 45 } },
          { name: 'Pura Luhur Uluwatu', lat: -8.8291, lng: 115.0849, address: 'Uluwatu, Bali', activityName: 'Sunset Fire Dance', duration: 2, priceRange: { low: 15, medium: 25, high: 50 } },
          { name: 'Gamelan Performance', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Traditional Music Night', duration: 2, priceRange: { low: 10, medium: 20, high: 40 } },
          { name: 'Shadow Puppet Show', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Wayang Kulit Show', duration: 2, priceRange: { low: 8, medium: 15, high: 35 } },
          { name: 'Barong Dance', lat: -8.5076, lng: 115.2620, address: 'Batubulan, Bali', activityName: 'Traditional Barong Dance', duration: 2, priceRange: { low: 10, medium: 18, high: 40 } },
        ],
      },
      food: {
        outdoor: [
          { name: 'Ubud Market', lat: -8.5076, lng: 115.2620, address: 'Jl. Raya Ubud, Ubud, Bali', activityName: 'Traditional Market Tour', duration: 3, priceRange: { low: 10, medium: 25, high: 60 } },
          { name: 'Jimbaran Bay', lat: -8.7842, lng: 115.1592, address: 'Jimbaran Beach, Bali', activityName: 'Seafood Beach Dinner', duration: 3, priceRange: { low: 20, medium: 45, high: 100 } },
          { name: 'Babi Guling Street', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Roast Pig Food Trail', duration: 3, priceRange: { low: 10, medium: 20, high: 45 } },
          { name: 'Organic Farm', lat: -8.4312, lng: 115.2793, address: 'Tegallalang, Bali', activityName: 'Farm to Table Experience', duration: 4, priceRange: { low: 35, medium: 65, high: 130 } },
          { name: 'Night Market Gianyar', lat: -8.5416, lng: 115.3247, address: 'Gianyar, Bali', activityName: 'Night Market Food Safari', duration: 3, priceRange: { low: 8, medium: 18, high: 40 } },
        ],
        indoor: [
          { name: 'Casa Luna Cooking School', lat: -8.5076, lng: 115.2620, address: 'Jl. Raya Ubud, Ubud, Bali', activityName: 'Balinese Cooking Class', duration: 4, priceRange: { low: 35, medium: 60, high: 120 } },
          { name: 'Locavore', lat: -8.5076, lng: 115.2620, address: 'Jl. Dewi Sita, Ubud, Bali', activityName: 'Fine Dining Experience', duration: 3, priceRange: { low: 80, medium: 150, high: 280 } },
          { name: 'Arak Tasting', lat: -8.6656, lng: 115.1356, address: 'Canggu, Bali', activityName: 'Local Spirit Tasting', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
          { name: 'Chocolate Factory', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Chocolate Making Class', duration: 2, priceRange: { low: 30, medium: 55, high: 100 } },
          { name: 'Seniman Coffee Studio', lat: -8.5076, lng: 115.2620, address: 'Jl. Sriwedari, Ubud, Bali', activityName: 'Coffee Brewing Workshop', duration: 2, priceRange: { low: 15, medium: 30, high: 60 } },
        ],
        nightlife: [
          { name: 'Mozaic Restaurant', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Fine Dining Tasting Menu', duration: 3, priceRange: { low: 100, medium: 180, high: 320 } },
          { name: 'Merah Putih', lat: -8.6656, lng: 115.1356, address: 'Seminyak, Bali', activityName: 'Modern Indonesian Dinner', duration: 2, priceRange: { low: 40, medium: 70, high: 140 } },
          { name: 'Sardine', lat: -8.6656, lng: 115.1356, address: 'Seminyak, Bali', activityName: 'Rice Paddy Dinner', duration: 2, priceRange: { low: 45, medium: 80, high: 160 } },
          { name: 'Naughty Nuri\'s', lat: -8.5076, lng: 115.2620, address: 'Ubud, Bali', activityName: 'Famous Ribs & Martinis', duration: 2, priceRange: { low: 25, medium: 45, high: 90 } },
          { name: 'Bambu Restaurant', lat: -8.6656, lng: 115.1356, address: 'Seminyak, Bali', activityName: 'Indonesian Feast', duration: 2, priceRange: { low: 30, medium: 55, high: 110 } },
        ],
      },
    },
  },
};

// Default destination template for unknown locations
const DEFAULT_DESTINATION: DestinationData = {
  center: { lat: 40.7128, lng: -74.0060 },
  country: 'Unknown',
  currency: 'USD',
  timezone: 'UTC',
  image: 'default',
  pois: {
    relax: {
      outdoor: [
        { name: 'City Park', lat: 0, lng: 0, address: 'Central Park Area', activityName: 'Park Relaxation', duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
        { name: 'Botanical Garden', lat: 0, lng: 0, address: 'Botanical Gardens', activityName: 'Garden Stroll', duration: 3, priceRange: { low: 10, medium: 20, high: 45 } },
        { name: 'Waterfront', lat: 0, lng: 0, address: 'Waterfront Promenade', activityName: 'Seaside Walk', duration: 2, priceRange: { low: 0, medium: 10, high: 30 } },
      ],
      indoor: [
        { name: 'Wellness Spa', lat: 0, lng: 0, address: 'Downtown Spa', activityName: 'Spa Treatment', duration: 3, priceRange: { low: 50, medium: 100, high: 200 } },
        { name: 'Cozy Café', lat: 0, lng: 0, address: 'Main Street Café', activityName: 'Café Relaxation', duration: 2, priceRange: { low: 10, medium: 25, high: 50 } },
        { name: 'Bookstore', lat: 0, lng: 0, address: 'Independent Bookstore', activityName: 'Book Browsing', duration: 2, priceRange: { low: 0, medium: 20, high: 50 } },
      ],
      nightlife: [
        { name: 'Rooftop Bar', lat: 0, lng: 0, address: 'Downtown Rooftop', activityName: 'Rooftop Drinks', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
        { name: 'Jazz Club', lat: 0, lng: 0, address: 'Music District', activityName: 'Live Jazz', duration: 3, priceRange: { low: 30, medium: 60, high: 120 } },
        { name: 'Wine Bar', lat: 0, lng: 0, address: 'Wine District', activityName: 'Wine Tasting', duration: 2, priceRange: { low: 25, medium: 50, high: 100 } },
      ],
    },
    adventure: {
      outdoor: [
        { name: 'Hiking Trail', lat: 0, lng: 0, address: 'Mountain Trail Head', activityName: 'Mountain Hiking', duration: 5, priceRange: { low: 10, medium: 30, high: 70 } },
        { name: 'River', lat: 0, lng: 0, address: 'River Launch Point', activityName: 'Kayaking Adventure', duration: 4, priceRange: { low: 40, medium: 70, high: 120 } },
        { name: 'Cycling Route', lat: 0, lng: 0, address: 'Bike Rental Station', activityName: 'Cycling Tour', duration: 4, priceRange: { low: 20, medium: 40, high: 80 } },
      ],
      indoor: [
        { name: 'Climbing Gym', lat: 0, lng: 0, address: 'Indoor Climbing Center', activityName: 'Rock Climbing', duration: 3, priceRange: { low: 25, medium: 45, high: 80 } },
        { name: 'Escape Room', lat: 0, lng: 0, address: 'Escape Room Center', activityName: 'Escape Challenge', duration: 2, priceRange: { low: 30, medium: 50, high: 90 } },
        { name: 'VR Arcade', lat: 0, lng: 0, address: 'VR Gaming Center', activityName: 'VR Experience', duration: 2, priceRange: { low: 25, medium: 45, high: 80 } },
      ],
      nightlife: [
        { name: 'Night Club', lat: 0, lng: 0, address: 'Entertainment District', activityName: 'Club Night', duration: 4, priceRange: { low: 20, medium: 50, high: 100 } },
        { name: 'Observation Deck', lat: 0, lng: 0, address: 'Tallest Building', activityName: 'Night Views', duration: 2, priceRange: { low: 25, medium: 40, high: 80 } },
        { name: 'Night Market', lat: 0, lng: 0, address: 'Market District', activityName: 'Night Market Walk', duration: 3, priceRange: { low: 15, medium: 35, high: 70 } },
      ],
    },
    cultural: {
      outdoor: [
        { name: 'Historic District', lat: 0, lng: 0, address: 'Old Town', activityName: 'Historical Walking Tour', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
        { name: 'Heritage Site', lat: 0, lng: 0, address: 'UNESCO Site', activityName: 'Heritage Exploration', duration: 4, priceRange: { low: 15, medium: 30, high: 70 } },
        { name: 'Local Market', lat: 0, lng: 0, address: 'Traditional Market', activityName: 'Market Culture Tour', duration: 3, priceRange: { low: 0, medium: 20, high: 50 } },
      ],
      indoor: [
        { name: 'National Museum', lat: 0, lng: 0, address: 'Museum District', activityName: 'Museum Tour', duration: 4, priceRange: { low: 15, medium: 30, high: 60 } },
        { name: 'Art Gallery', lat: 0, lng: 0, address: 'Gallery Row', activityName: 'Art Exhibition', duration: 3, priceRange: { low: 10, medium: 25, high: 55 } },
        { name: 'Cultural Center', lat: 0, lng: 0, address: 'Cultural Center', activityName: 'Cultural Performance', duration: 3, priceRange: { low: 20, medium: 45, high: 100 } },
      ],
      nightlife: [
        { name: 'Theater', lat: 0, lng: 0, address: 'Theater District', activityName: 'Evening Performance', duration: 3, priceRange: { low: 40, medium: 100, high: 250 } },
        { name: 'Opera House', lat: 0, lng: 0, address: 'Opera District', activityName: 'Opera Night', duration: 3, priceRange: { low: 50, medium: 120, high: 300 } },
        { name: 'Comedy Club', lat: 0, lng: 0, address: 'Entertainment District', activityName: 'Comedy Show', duration: 2, priceRange: { low: 25, medium: 45, high: 90 } },
      ],
    },
    food: {
      outdoor: [
        { name: 'Food Market', lat: 0, lng: 0, address: 'Central Food Market', activityName: 'Market Food Tour', duration: 3, priceRange: { low: 20, medium: 45, high: 90 } },
        { name: 'Street Food Area', lat: 0, lng: 0, address: 'Street Food District', activityName: 'Street Food Safari', duration: 3, priceRange: { low: 15, medium: 35, high: 70 } },
        { name: 'Vineyard', lat: 0, lng: 0, address: 'Wine Region', activityName: 'Vineyard Visit', duration: 5, priceRange: { low: 60, medium: 120, high: 220 } },
      ],
      indoor: [
        { name: 'Cooking School', lat: 0, lng: 0, address: 'Culinary Institute', activityName: 'Cooking Class', duration: 4, priceRange: { low: 60, medium: 120, high: 220 } },
        { name: 'Fine Restaurant', lat: 0, lng: 0, address: 'Fine Dining District', activityName: 'Gourmet Dining', duration: 3, priceRange: { low: 80, medium: 150, high: 300 } },
        { name: 'Wine Bar', lat: 0, lng: 0, address: 'Wine Quarter', activityName: 'Wine Tasting', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
      ],
      nightlife: [
        { name: 'Fine Dining', lat: 0, lng: 0, address: 'Restaurant District', activityName: 'Evening Tasting Menu', duration: 3, priceRange: { low: 100, medium: 180, high: 350 } },
        { name: 'Cocktail Bar', lat: 0, lng: 0, address: 'Bar District', activityName: 'Craft Cocktails', duration: 2, priceRange: { low: 30, medium: 60, high: 120 } },
        { name: 'Late Night Eatery', lat: 0, lng: 0, address: 'Night District', activityName: 'Late Night Bites', duration: 2, priceRange: { low: 20, medium: 40, high: 80 } },
      ],
    },
  },
};

// Find destination data
function getDestinationData(destination: string, customCenter?: { lat: number; lng: number }): DestinationData {
  const destLower = destination.toLowerCase();

  for (const [key, data] of Object.entries(DESTINATIONS)) {
    if (destLower.includes(key)) {
      return data;
    }
  }

  // If custom center provided, generate POIs around it
  if (customCenter && customCenter.lat !== 0 && customCenter.lng !== 0) {
    return generateDestinationWithCoords(customCenter.lat, customCenter.lng, destination);
  }

  return DEFAULT_DESTINATION;
}

// Generate a destination data object with actual coordinates
function generateDestinationWithCoords(lat: number, lng: number, destinationName: string): DestinationData {
  const generatePOIsForCategory = (categoryType: string): { outdoor: POI[]; indoor: POI[]; nightlife: POI[] } => {
    const outdoorBase = [
      { name: `${destinationName} Park`, activityName: `${categoryType === 'relax' ? 'Relaxing' : 'Exploring'} Park Walk`, duration: 3, priceRange: { low: 0, medium: 15, high: 40 } },
      { name: `${destinationName} Gardens`, activityName: 'Garden Visit', duration: 2, priceRange: { low: 5, medium: 20, high: 45 } },
      { name: `Historic ${destinationName}`, activityName: 'Historic District Walk', duration: 3, priceRange: { low: 0, medium: 25, high: 60 } },
      { name: `${destinationName} Waterfront`, activityName: 'Waterfront Stroll', duration: 2, priceRange: { low: 0, medium: 10, high: 30 } },
      { name: `${destinationName} Market`, activityName: 'Local Market Visit', duration: 2, priceRange: { low: 15, medium: 35, high: 70 } },
    ];

    const indoorBase = [
      { name: `${destinationName} Museum`, activityName: 'Museum Tour', duration: 3, priceRange: { low: 12, medium: 25, high: 55 } },
      { name: `Art Gallery`, activityName: 'Art Exhibition Visit', duration: 2, priceRange: { low: 10, medium: 22, high: 50 } },
      { name: `Wellness Center`, activityName: 'Spa & Wellness', duration: 3, priceRange: { low: 45, medium: 90, high: 180 } },
      { name: `Shopping District`, activityName: 'Shopping Experience', duration: 3, priceRange: { low: 0, medium: 50, high: 150 } },
      { name: `Cultural Center`, activityName: 'Cultural Experience', duration: 2, priceRange: { low: 15, medium: 35, high: 75 } },
    ];

    const nightlifeBase = [
      { name: `${destinationName} Rooftop`, activityName: 'Rooftop Evening Drinks', duration: 2, priceRange: { low: 25, medium: 55, high: 110 } },
      { name: `Live Music Venue`, activityName: 'Live Music Night', duration: 3, priceRange: { low: 20, medium: 45, high: 95 } },
      { name: `Fine Dining`, activityName: 'Dinner Experience', duration: 2, priceRange: { low: 40, medium: 80, high: 160 } },
      { name: `Night Market`, activityName: 'Evening Market Exploration', duration: 2, priceRange: { low: 15, medium: 35, high: 75 } },
      { name: `Entertainment Area`, activityName: 'Nightlife Experience', duration: 3, priceRange: { low: 30, medium: 65, high: 140 } },
    ];

    // Generate unique coordinates for each POI
    const generateCoord = (index: number, base: number, spread: number = 0.02): number => {
      const angle = (index / 5) * Math.PI * 2;
      const radius = spread * (0.5 + Math.random() * 0.5);
      return base + Math.cos(angle) * radius;
    };

    return {
      outdoor: outdoorBase.map((poi, i) => ({
        ...poi,
        lat: generateCoord(i, lat, 0.015),
        lng: generateCoord(i + 2, lng, 0.02),
        address: `${poi.name}, ${destinationName}`,
      })),
      indoor: indoorBase.map((poi, i) => ({
        ...poi,
        lat: generateCoord(i + 1, lat, 0.012),
        lng: generateCoord(i + 3, lng, 0.018),
        address: `${poi.name}, ${destinationName}`,
      })),
      nightlife: nightlifeBase.map((poi, i) => ({
        ...poi,
        lat: generateCoord(i + 2, lat, 0.01),
        lng: generateCoord(i + 1, lng, 0.015),
        address: `${poi.name}, ${destinationName}`,
      })),
    };
  };

  return {
    center: { lat, lng },
    country: 'Unknown',
    currency: 'USD',
    timezone: 'UTC',
    image: 'default',
    pois: {
      relax: generatePOIsForCategory('relax'),
      adventure: generatePOIsForCategory('adventure'),
      cultural: generatePOIsForCategory('cultural'),
      food: generatePOIsForCategory('food'),
    },
  };
}

// Generate itinerary for a trip
export function generateItinerary(
  destination: string,
  startDate: Date,
  numberOfDays: number,
  travelStyle: TravelStyle,
  budgetLevel: BudgetLevel,
  tripType: TripType = 'solo',
  destinationCoords?: { lat: number; lng: number }
): DayPlan[] {
  const plans: DayPlan[] = [];
  const destData = getDestinationData(destination, destinationCoords);

  const usedOutdoorPOIs = new Set<number>();
  const usedIndoorPOIs = new Set<number>();
  const usedNightlifePOIs = new Set<number>();

  for (let day = 1; day <= numberOfDays; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day - 1);

    const weather = simulateWeather(date, destination);
    const isRainy = weather === 'rainy' || weather === 'stormy';

    // Get POIs for this travel style
    const outdoorPOIs = destData.pois[travelStyle].outdoor;
    const indoorPOIs = destData.pois[travelStyle].indoor;
    const nightlifePOIs = destData.pois[travelStyle].nightlife;

    // Select daytime activities
    let daytimeMainPOI: POI;
    let daytimeAltPOI: POI;

    if (isRainy) {
      daytimeMainPOI = selectPOI(indoorPOIs, usedIndoorPOIs);
      daytimeAltPOI = selectPOI(outdoorPOIs, usedOutdoorPOIs);
    } else {
      daytimeMainPOI = selectPOI(outdoorPOIs, usedOutdoorPOIs);
      daytimeAltPOI = selectPOI(indoorPOIs, usedIndoorPOIs);
    }

    // Select nighttime activities (prefer indoor for variety)
    const nighttimeMainPOI = selectPOI(nightlifePOIs, usedNightlifePOIs);
    // Alternative nighttime can be from indoor activities
    const nighttimeAltPOI = selectPOI(indoorPOIs, new Set());

    // Helper to build activity with coordinates
    const buildActivity = (poi: POI, type: ActivityType): Activity => {
      const lat = poi.lat || destData.center.lat + (Math.random() - 0.5) * 0.05;
      const lng = poi.lng || destData.center.lng + (Math.random() - 0.5) * 0.05;
      return {
        name: poi.activityName,
        type,
        duration: poi.duration,
        location: {
          lat,
          lng,
          name: poi.name,
          address: poi.address,
        },
        price: getPrice(poi, budgetLevel, tripType),
      };
    };

    const daytimeActivity = buildActivity(daytimeMainPOI, isRainy ? 'indoor' : 'outdoor');
    const daytimeAlternativeActivity = buildActivity(daytimeAltPOI, isRainy ? 'outdoor' : 'indoor');
    const nighttimeActivity = buildActivity(nighttimeMainPOI, 'indoor');
    const nighttimeAlternativeActivity = buildActivity(nighttimeAltPOI, 'indoor');

    plans.push({
      dayNumber: day,
      date,
      weather,
      daytimeActivity,
      daytimeAlternativeActivity,
      nighttimeActivity,
      nighttimeAlternativeActivity,
      selectedDaytimeActivity: 'main',
      selectedNighttimeActivity: 'main',
      // Legacy fields for backward compatibility
      mainActivity: daytimeActivity,
      alternativeActivity: daytimeAlternativeActivity,
    });
  }

  return plans;
}

// Select a POI, trying to avoid repeats
function selectPOI(pois: POI[], usedIndexes: Set<number>): POI {
  const availableIndexes = pois.map((_, i) => i).filter(i => !usedIndexes.has(i));

  if (availableIndexes.length > 0) {
    const selectedIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    usedIndexes.add(selectedIndex);
    return { ...pois[selectedIndex] };
  }

  // If all used, reset and pick random
  usedIndexes.clear();
  const selectedIndex = Math.floor(Math.random() * pois.length);
  usedIndexes.add(selectedIndex);
  return { ...pois[selectedIndex] };
}

// Adjust itinerary based on weather change
export function adjustForWeather(
  currentMainActivity: Activity,
  currentAlternativeActivity: Activity,
  newWeather: WeatherCondition
): { mainActivity: Activity; alternativeActivity: Activity } {
  const isRainy = newWeather === 'rainy' || newWeather === 'stormy';

  // If weather is rainy and main activity is outdoor, swap
  if (isRainy && currentMainActivity.type === 'outdoor') {
    return {
      mainActivity: currentAlternativeActivity,
      alternativeActivity: currentMainActivity,
    };
  }

  // If weather is nice and main activity is indoor (was previously rainy), swap back
  if (!isRainy && currentMainActivity.type === 'indoor' && currentAlternativeActivity.type === 'outdoor') {
    return {
      mainActivity: currentAlternativeActivity,
      alternativeActivity: currentMainActivity,
    };
  }

  return { mainActivity: currentMainActivity, alternativeActivity: currentAlternativeActivity };
}
