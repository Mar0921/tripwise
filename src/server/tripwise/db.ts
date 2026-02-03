import { Store, schema } from 'modelence/server';

// Travel styles
export const TRAVEL_STYLES = ['relax', 'adventure', 'cultural', 'food'] as const;
export type TravelStyle = typeof TRAVEL_STYLES[number];

// Budget levels
export const BUDGET_LEVELS = ['low', 'medium', 'high'] as const;
export type BudgetLevel = typeof BUDGET_LEVELS[number];

// Trip types
export const TRIP_TYPES = ['solo', 'couple', 'family', 'friends'] as const;
export type TripType = typeof TRIP_TYPES[number];

// Activity types
export const ACTIVITY_TYPES = ['indoor', 'outdoor'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

// Time of day
export const TIME_OF_DAY = ['daytime', 'nighttime'] as const;
export type TimeOfDay = typeof TIME_OF_DAY[number];

// Weather conditions
export const WEATHER_CONDITIONS = ['sunny', 'cloudy', 'rainy', 'stormy'] as const;
export type WeatherCondition = typeof WEATHER_CONDITIONS[number];

// Trips store
export const dbTrips = new Store('trips', {
  schema: {
    userId: schema.userId(),
    destination: schema.string(),
    destinationLat: schema.number(), // Destination center latitude
    destinationLng: schema.number(), // Destination center longitude
    startDate: schema.date(),
    numberOfDays: schema.number(),
    travelStyle: schema.string(),
    budgetLevel: schema.string(),
    budgetAmount: schema.number(), // Budget in dollars
    numberOfTravelers: schema.number(),
    tripType: schema.string(), // solo, couple, family, friends
    // Hotel location for directions
    hotelName: schema.string(),
    hotelLat: schema.number(),
    hotelLng: schema.number(),
    hotelAddress: schema.string(),
    createdAt: schema.date(),
    updatedAt: schema.date(),
  },
  indexes: [
    { key: { userId: 1 } },
    { key: { startDate: 1 } },
  ]
});

// Location schema for activity locations
const locationSchema = {
  lat: schema.number(),
  lng: schema.number(),
  name: schema.string(),
  address: schema.string(),
};

// Day itinerary store - now with day/night activities and pricing
export const dbItineraries = new Store('itineraries', {
  schema: {
    tripId: schema.objectId(),
    dayNumber: schema.number(),
    date: schema.date(),
    weather: schema.string(),
    // Daytime main activity
    daytimeActivity: schema.string(),
    daytimeActivityType: schema.string(),
    daytimeActivityDuration: schema.number(),
    daytimeActivityLocation: schema.object(locationSchema),
    daytimeActivityPrice: schema.number(), // Price per person in dollars
    // Daytime alternative activity
    daytimeAlternativeActivity: schema.string(),
    daytimeAlternativeActivityType: schema.string(),
    daytimeAlternativeActivityDuration: schema.number(),
    daytimeAlternativeActivityLocation: schema.object(locationSchema),
    daytimeAlternativeActivityPrice: schema.number(),
    // Nighttime main activity
    nighttimeActivity: schema.string(),
    nighttimeActivityType: schema.string(),
    nighttimeActivityDuration: schema.number(),
    nighttimeActivityLocation: schema.object(locationSchema),
    nighttimeActivityPrice: schema.number(),
    // Nighttime alternative activity
    nighttimeAlternativeActivity: schema.string(),
    nighttimeAlternativeActivityType: schema.string(),
    nighttimeAlternativeActivityDuration: schema.number(),
    nighttimeAlternativeActivityLocation: schema.object(locationSchema),
    nighttimeAlternativeActivityPrice: schema.number(),
    // User selections
    selectedDaytimeActivity: schema.string(), // 'main' or 'alternative'
    selectedNighttimeActivity: schema.string(), // 'main' or 'alternative'
    isWeatherAdjusted: schema.boolean(),
    // Legacy fields for backward compatibility
    mainActivity: schema.string(),
    mainActivityType: schema.string(),
    mainActivityDuration: schema.number(),
    mainActivityLocation: schema.object(locationSchema),
    alternativeActivity: schema.string(),
    alternativeActivityType: schema.string(),
    alternativeActivityDuration: schema.number(),
    alternativeActivityLocation: schema.object(locationSchema),
  },
  indexes: [
    { key: { tripId: 1, dayNumber: 1 } },
  ]
});

// Notifications store
export const dbNotifications = new Store('notifications', {
  schema: {
    userId: schema.userId(),
    tripId: schema.objectId(),
    message: schema.string(),
    isRead: schema.boolean(),
    createdAt: schema.date(),
  },
  indexes: [
    { key: { userId: 1, createdAt: -1 } },
    { key: { tripId: 1 } },
  ]
});
