export const TRAVEL_STYLES = ['relax', 'adventure', 'cultural', 'food'] as const;
export type TravelStyle = typeof TRAVEL_STYLES[number];

export const BUDGET_LEVELS = ['low', 'medium', 'high'] as const;
export type BudgetLevel = typeof BUDGET_LEVELS[number];

export const TRIP_TYPES = ['solo', 'couple', 'family', 'friends'] as const;
export type TripType = typeof TRIP_TYPES[number];

export const ACTIVITY_TYPES = ['indoor', 'outdoor'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const WEATHER_CONDITIONS = ['sunny', 'cloudy', 'rainy', 'stormy'] as const;
export type WeatherCondition = typeof WEATHER_CONDITIONS[number];

export interface Location {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export interface Activity {
  name: string;
  type: ActivityType;
  duration: number;
  location: Location;
  price: number; // Price per person in dollars
}

export interface DayItinerary {
  _id: string;
  dayNumber: number;
  date: string;
  weather: WeatherCondition;
  // Daytime activities
  daytimeActivity: string;
  daytimeActivityType: ActivityType;
  daytimeActivityDuration: number;
  daytimeActivityLocation: Location;
  daytimeActivityPrice: number;
  daytimeAlternativeActivity: string;
  daytimeAlternativeActivityType: ActivityType;
  daytimeAlternativeActivityDuration: number;
  daytimeAlternativeActivityLocation: Location;
  daytimeAlternativeActivityPrice: number;
  // Nighttime activities
  nighttimeActivity: string;
  nighttimeActivityType: ActivityType;
  nighttimeActivityDuration: number;
  nighttimeActivityLocation: Location;
  nighttimeActivityPrice: number;
  nighttimeAlternativeActivity: string;
  nighttimeAlternativeActivityType: ActivityType;
  nighttimeAlternativeActivityDuration: number;
  nighttimeAlternativeActivityLocation: Location;
  nighttimeAlternativeActivityPrice: number;
  // User selections
  selectedDaytimeActivity: 'main' | 'alternative';
  selectedNighttimeActivity: 'main' | 'alternative';
  isWeatherAdjusted: boolean;
  // Legacy fields for backward compatibility
  mainActivity: string;
  mainActivityType: ActivityType;
  mainActivityDuration: number;
  mainActivityLocation: Location;
  alternativeActivity: string;
  alternativeActivityType: ActivityType;
  alternativeActivityDuration: number;
  alternativeActivityLocation: Location;
}

export interface Trip {
  _id: string;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  startDate: string;
  numberOfDays: number;
  travelStyle: TravelStyle;
  budgetLevel: BudgetLevel;
  budgetAmount: number; // Budget in dollars
  numberOfTravelers: number;
  tripType: TripType;
  // Hotel location for directions
  hotelName: string;
  hotelLat: number;
  hotelLng: number;
  hotelAddress: string;
  createdAt: string;
}

export interface DirectionsInfo {
  walking: { duration: number; distance: number };
  publicTransport: { duration: number; distance: number };
  taxi: { duration: number; distance: number; estimatedCost: number };
}

export interface DirectionsResponse {
  hasDirections: boolean;
  message?: string;
  origin?: {
    name: string;
    lat: number;
    lng: number;
    address: string;
  };
  directions?: DirectionsInfo;
}

export interface TripWithItinerary extends Trip {
  itinerary: DayItinerary[];
}

export interface Notification {
  _id: string;
  tripId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  relax: 'Relaxation',
  adventure: 'Adventure',
  cultural: 'Cultural',
  food: 'Food & Culinary',
};

export const BUDGET_LEVEL_LABELS: Record<BudgetLevel, string> = {
  low: 'Budget-friendly',
  medium: 'Moderate',
  high: 'Luxury',
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  solo: 'Solo Trip',
  couple: 'Couple',
  family: 'Family',
  friends: 'Friends',
};

export const WEATHER_ICONS: Record<WeatherCondition, string> = {
  sunny: 'sun',
  cloudy: 'cloud',
  rainy: 'cloud-rain',
  stormy: 'cloud-lightning',
};
