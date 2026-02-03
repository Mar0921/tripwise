import z from 'zod';
import { AuthError } from 'modelence';
import { Module, ObjectId, UserInfo } from 'modelence/server';
import {
  dbTrips,
  dbItineraries,
  dbNotifications,
  TRAVEL_STYLES,
  BUDGET_LEVELS,
  TRIP_TYPES,
  TravelStyle,
  BudgetLevel,
  TripType,
} from './db';
import { generateItinerary } from './itinerary';
import { weatherUpdateCron } from './cron';
import { getDestinationCenter, estimateDirections } from './geocoding';

export default new Module('tripwise', {
  stores: [dbTrips, dbItineraries, dbNotifications],

  queries: {
    // Get all trips for current user
    getTrips: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const trips = await dbTrips.fetch(
        { userId: new ObjectId(user.id) },
        { sort: { startDate: -1 } }
      );

      return trips.map((trip) => ({
        _id: trip._id.toString(),
        destination: trip.destination,
        startDate: trip.startDate,
        numberOfDays: trip.numberOfDays,
        travelStyle: trip.travelStyle,
        budgetLevel: trip.budgetLevel,
        budgetAmount: trip.budgetAmount || 0,
        numberOfTravelers: trip.numberOfTravelers || 1,
        tripType: trip.tripType || 'solo',
        createdAt: trip.createdAt,
      }));
    },

    // Get single trip with itinerary
    getTrip: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const { tripId } = z.object({ tripId: z.string() }).parse(args);
      const trip = await dbTrips.requireOne({ _id: new ObjectId(tripId) });

      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      const itineraries = await dbItineraries.fetch(
        { tripId: new ObjectId(tripId) },
        { sort: { dayNumber: 1 } }
      );

      return {
        _id: trip._id.toString(),
        destination: trip.destination,
        destinationLat: trip.destinationLat || 0,
        destinationLng: trip.destinationLng || 0,
        startDate: trip.startDate,
        numberOfDays: trip.numberOfDays,
        travelStyle: trip.travelStyle,
        budgetLevel: trip.budgetLevel,
        budgetAmount: trip.budgetAmount || 0,
        numberOfTravelers: trip.numberOfTravelers || 1,
        tripType: trip.tripType || 'solo',
        hotelName: trip.hotelName || '',
        hotelLat: trip.hotelLat || 0,
        hotelLng: trip.hotelLng || 0,
        hotelAddress: trip.hotelAddress || '',
        createdAt: trip.createdAt,
        itinerary: itineraries.map((day) => ({
          _id: day._id.toString(),
          dayNumber: day.dayNumber,
          date: day.date,
          weather: day.weather,
          // Daytime activities
          daytimeActivity: day.daytimeActivity || day.mainActivity,
          daytimeActivityType: day.daytimeActivityType || day.mainActivityType,
          daytimeActivityDuration: day.daytimeActivityDuration || day.mainActivityDuration,
          daytimeActivityLocation: day.daytimeActivityLocation || day.mainActivityLocation,
          daytimeActivityPrice: day.daytimeActivityPrice || 0,
          daytimeAlternativeActivity: day.daytimeAlternativeActivity || day.alternativeActivity,
          daytimeAlternativeActivityType: day.daytimeAlternativeActivityType || day.alternativeActivityType,
          daytimeAlternativeActivityDuration: day.daytimeAlternativeActivityDuration || day.alternativeActivityDuration,
          daytimeAlternativeActivityLocation: day.daytimeAlternativeActivityLocation || day.alternativeActivityLocation,
          daytimeAlternativeActivityPrice: day.daytimeAlternativeActivityPrice || 0,
          // Nighttime activities
          nighttimeActivity: day.nighttimeActivity || 'Evening Free Time',
          nighttimeActivityType: day.nighttimeActivityType || 'indoor',
          nighttimeActivityDuration: day.nighttimeActivityDuration || 2,
          nighttimeActivityLocation: day.nighttimeActivityLocation || day.mainActivityLocation,
          nighttimeActivityPrice: day.nighttimeActivityPrice || 0,
          nighttimeAlternativeActivity: day.nighttimeAlternativeActivity || 'Relax at Hotel',
          nighttimeAlternativeActivityType: day.nighttimeAlternativeActivityType || 'indoor',
          nighttimeAlternativeActivityDuration: day.nighttimeAlternativeActivityDuration || 2,
          nighttimeAlternativeActivityLocation: day.nighttimeAlternativeActivityLocation || day.alternativeActivityLocation,
          nighttimeAlternativeActivityPrice: day.nighttimeAlternativeActivityPrice || 0,
          // Selections
          selectedDaytimeActivity: day.selectedDaytimeActivity || 'main',
          selectedNighttimeActivity: day.selectedNighttimeActivity || 'main',
          isWeatherAdjusted: day.isWeatherAdjusted,
          // Legacy fields
          mainActivity: day.mainActivity,
          mainActivityType: day.mainActivityType,
          mainActivityDuration: day.mainActivityDuration,
          mainActivityLocation: day.mainActivityLocation,
          alternativeActivity: day.alternativeActivity,
          alternativeActivityType: day.alternativeActivityType,
          alternativeActivityDuration: day.alternativeActivityDuration,
          alternativeActivityLocation: day.alternativeActivityLocation,
        })),
      };
    },

    // Get notifications for current user
    getNotifications: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const notifications = await dbNotifications.fetch(
        { userId: new ObjectId(user.id) },
        { sort: { createdAt: -1 }, limit: 20 }
      );

      return notifications.map((n) => ({
        _id: n._id.toString(),
        tripId: n.tripId.toString(),
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }));
    },

    // Get unread notification count
    getUnreadNotificationCount: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const count = await dbNotifications.countDocuments({
        userId: new ObjectId(user.id),
        isRead: false,
      });

      return { count };
    },
  },

  mutations: {
    // Create a new trip
    createTrip: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const input = z
        .object({
          destination: z.string().min(1),
          startDate: z.string(),
          numberOfDays: z.number().min(1).max(30),
          travelStyle: z.enum(TRAVEL_STYLES),
          budgetLevel: z.enum(BUDGET_LEVELS),
          budgetAmount: z.number().min(0).default(1000),
          numberOfTravelers: z.number().min(1).max(20).default(1),
          tripType: z.enum(TRIP_TYPES).default('solo'),
          hotelName: z.string().optional(),
          hotelAddress: z.string().optional(),
        })
        .parse(args);

      const startDate = new Date(input.startDate);

      // Get destination coordinates via geocoding
      const destCoords = await getDestinationCenter(input.destination);
      const destinationLat = destCoords?.lat || 0;
      const destinationLng = destCoords?.lng || 0;

      // For now, use destination center as hotel location if not provided
      // User can update hotel location later
      const hotelLat = destinationLat;
      const hotelLng = destinationLng;

      // Create the trip
      const tripResult = await dbTrips.insertOne({
        userId: new ObjectId(user.id),
        destination: input.destination,
        destinationLat,
        destinationLng,
        startDate,
        numberOfDays: input.numberOfDays,
        travelStyle: input.travelStyle,
        budgetLevel: input.budgetLevel,
        budgetAmount: input.budgetAmount,
        numberOfTravelers: input.numberOfTravelers,
        tripType: input.tripType,
        hotelName: input.hotelName || '',
        hotelLat,
        hotelLng,
        hotelAddress: input.hotelAddress || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tripId = tripResult.insertedId;

      // Generate itinerary with destination coordinates
      const itinerary = generateItinerary(
        input.destination,
        startDate,
        input.numberOfDays,
        input.travelStyle as TravelStyle,
        input.budgetLevel as BudgetLevel,
        input.tripType as TripType,
        destCoords ? { lat: destCoords.lat, lng: destCoords.lng } : undefined
      );

      // Save itinerary days
      for (const day of itinerary) {
        await dbItineraries.insertOne({
          tripId,
          dayNumber: day.dayNumber,
          date: day.date,
          weather: day.weather,
          // Daytime activities
          daytimeActivity: day.daytimeActivity.name,
          daytimeActivityType: day.daytimeActivity.type,
          daytimeActivityDuration: day.daytimeActivity.duration,
          daytimeActivityLocation: day.daytimeActivity.location,
          daytimeActivityPrice: day.daytimeActivity.price,
          daytimeAlternativeActivity: day.daytimeAlternativeActivity.name,
          daytimeAlternativeActivityType: day.daytimeAlternativeActivity.type,
          daytimeAlternativeActivityDuration: day.daytimeAlternativeActivity.duration,
          daytimeAlternativeActivityLocation: day.daytimeAlternativeActivity.location,
          daytimeAlternativeActivityPrice: day.daytimeAlternativeActivity.price,
          // Nighttime activities
          nighttimeActivity: day.nighttimeActivity.name,
          nighttimeActivityType: day.nighttimeActivity.type,
          nighttimeActivityDuration: day.nighttimeActivity.duration,
          nighttimeActivityLocation: day.nighttimeActivity.location,
          nighttimeActivityPrice: day.nighttimeActivity.price,
          nighttimeAlternativeActivity: day.nighttimeAlternativeActivity.name,
          nighttimeAlternativeActivityType: day.nighttimeAlternativeActivity.type,
          nighttimeAlternativeActivityDuration: day.nighttimeAlternativeActivity.duration,
          nighttimeAlternativeActivityLocation: day.nighttimeAlternativeActivity.location,
          nighttimeAlternativeActivityPrice: day.nighttimeAlternativeActivity.price,
          // Selections
          selectedDaytimeActivity: 'main',
          selectedNighttimeActivity: 'main',
          // Legacy fields
          mainActivity: day.mainActivity.name,
          mainActivityType: day.mainActivity.type,
          mainActivityDuration: day.mainActivity.duration,
          mainActivityLocation: day.mainActivity.location,
          alternativeActivity: day.alternativeActivity.name,
          alternativeActivityType: day.alternativeActivity.type,
          alternativeActivityDuration: day.alternativeActivity.duration,
          alternativeActivityLocation: day.alternativeActivity.location,
          isWeatherAdjusted: false,
        });
      }

      return { tripId: tripId.toString() };
    },

    // Update a trip
    updateTrip: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const input = z
        .object({
          tripId: z.string(),
          destination: z.string().min(1),
          startDate: z.string(),
          numberOfDays: z.number().min(1).max(30),
          travelStyle: z.enum(TRAVEL_STYLES),
          budgetLevel: z.enum(BUDGET_LEVELS),
          budgetAmount: z.number().min(0).default(1000),
          numberOfTravelers: z.number().min(1).max(20).default(1),
          tripType: z.enum(TRIP_TYPES).default('solo'),
          hotelName: z.string().optional(),
          hotelAddress: z.string().optional(),
        })
        .parse(args);

      const trip = await dbTrips.requireOne({ _id: new ObjectId(input.tripId) });

      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      const startDate = new Date(input.startDate);

      // Get destination coordinates if destination changed
      let destinationLat = trip.destinationLat || 0;
      let destinationLng = trip.destinationLng || 0;
      let destCoords: { lat: number; lng: number } | null = null;

      if (trip.destination !== input.destination) {
        destCoords = await getDestinationCenter(input.destination);
        destinationLat = destCoords?.lat || 0;
        destinationLng = destCoords?.lng || 0;
      } else if (destinationLat !== 0 && destinationLng !== 0) {
        destCoords = { lat: destinationLat, lng: destinationLng };
      }

      // Update hotel location if destination changed and no hotel set
      const hotelLat = trip.hotelLat || destinationLat;
      const hotelLng = trip.hotelLng || destinationLng;

      // Update trip
      await dbTrips.updateOne(
        { _id: new ObjectId(input.tripId) },
        {
          $set: {
            destination: input.destination,
            destinationLat,
            destinationLng,
            startDate,
            numberOfDays: input.numberOfDays,
            travelStyle: input.travelStyle,
            budgetLevel: input.budgetLevel,
            budgetAmount: input.budgetAmount,
            numberOfTravelers: input.numberOfTravelers,
            tripType: input.tripType,
            hotelName: input.hotelName || trip.hotelName || '',
            hotelLat,
            hotelLng,
            hotelAddress: input.hotelAddress || trip.hotelAddress || '',
            updatedAt: new Date(),
          },
        }
      );

      // Delete old itinerary
      await dbItineraries.deleteMany({ tripId: new ObjectId(input.tripId) });

      // Generate new itinerary with coordinates
      const itinerary = generateItinerary(
        input.destination,
        startDate,
        input.numberOfDays,
        input.travelStyle as TravelStyle,
        input.budgetLevel as BudgetLevel,
        input.tripType as TripType,
        destCoords ? { lat: destCoords.lat, lng: destCoords.lng } : undefined
      );

      // Save new itinerary days
      for (const day of itinerary) {
        await dbItineraries.insertOne({
          tripId: new ObjectId(input.tripId),
          dayNumber: day.dayNumber,
          date: day.date,
          weather: day.weather,
          // Daytime activities
          daytimeActivity: day.daytimeActivity.name,
          daytimeActivityType: day.daytimeActivity.type,
          daytimeActivityDuration: day.daytimeActivity.duration,
          daytimeActivityLocation: day.daytimeActivity.location,
          daytimeActivityPrice: day.daytimeActivity.price,
          daytimeAlternativeActivity: day.daytimeAlternativeActivity.name,
          daytimeAlternativeActivityType: day.daytimeAlternativeActivity.type,
          daytimeAlternativeActivityDuration: day.daytimeAlternativeActivity.duration,
          daytimeAlternativeActivityLocation: day.daytimeAlternativeActivity.location,
          daytimeAlternativeActivityPrice: day.daytimeAlternativeActivity.price,
          // Nighttime activities
          nighttimeActivity: day.nighttimeActivity.name,
          nighttimeActivityType: day.nighttimeActivity.type,
          nighttimeActivityDuration: day.nighttimeActivity.duration,
          nighttimeActivityLocation: day.nighttimeActivity.location,
          nighttimeActivityPrice: day.nighttimeActivity.price,
          nighttimeAlternativeActivity: day.nighttimeAlternativeActivity.name,
          nighttimeAlternativeActivityType: day.nighttimeAlternativeActivity.type,
          nighttimeAlternativeActivityDuration: day.nighttimeAlternativeActivity.duration,
          nighttimeAlternativeActivityLocation: day.nighttimeAlternativeActivity.location,
          nighttimeAlternativeActivityPrice: day.nighttimeAlternativeActivity.price,
          // Selections
          selectedDaytimeActivity: 'main',
          selectedNighttimeActivity: 'main',
          // Legacy fields
          mainActivity: day.mainActivity.name,
          mainActivityType: day.mainActivity.type,
          mainActivityDuration: day.mainActivity.duration,
          mainActivityLocation: day.mainActivity.location,
          alternativeActivity: day.alternativeActivity.name,
          alternativeActivityType: day.alternativeActivity.type,
          alternativeActivityDuration: day.alternativeActivity.duration,
          alternativeActivityLocation: day.alternativeActivity.location,
          isWeatherAdjusted: false,
        });
      }

      return { success: true };
    },

    // Select activity (daytime or nighttime)
    selectActivity: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const input = z
        .object({
          itineraryId: z.string(),
          timeOfDay: z.enum(['daytime', 'nighttime']),
          selection: z.enum(['main', 'alternative']),
        })
        .parse(args);

      const itinerary = await dbItineraries.requireOne({ _id: new ObjectId(input.itineraryId) });

      // Verify ownership through trip
      const trip = await dbTrips.requireOne({ _id: itinerary.tripId });
      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      // Update the selection
      const updateField = input.timeOfDay === 'daytime'
        ? 'selectedDaytimeActivity'
        : 'selectedNighttimeActivity';

      await dbItineraries.updateOne(
        { _id: new ObjectId(input.itineraryId) },
        { $set: { [updateField]: input.selection } }
      );

      return { success: true };
    },

    // Delete a trip
    deleteTrip: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const { tripId } = z.object({ tripId: z.string() }).parse(args);
      const trip = await dbTrips.requireOne({ _id: new ObjectId(tripId) });

      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      // Delete itinerary
      await dbItineraries.deleteMany({ tripId: new ObjectId(tripId) });

      // Delete notifications
      await dbNotifications.deleteMany({ tripId: new ObjectId(tripId) });

      // Delete trip
      await dbTrips.deleteOne({ _id: new ObjectId(tripId) });

      return { success: true };
    },

    // Mark notification as read
    markNotificationRead: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const { notificationId } = z.object({ notificationId: z.string() }).parse(args);
      const notification = await dbNotifications.requireOne({ _id: new ObjectId(notificationId) });

      if (notification.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      await dbNotifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { isRead: true } }
      );

      return { success: true };
    },

    // Mark all notifications as read
    markAllNotificationsRead: async (_args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      await dbNotifications.updateMany(
        { userId: new ObjectId(user.id), isRead: false },
        { $set: { isRead: true } }
      );

      return { success: true };
    },

    // Update hotel location
    updateHotelLocation: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const input = z
        .object({
          tripId: z.string(),
          hotelName: z.string(),
          hotelAddress: z.string(),
          hotelLat: z.number(),
          hotelLng: z.number(),
        })
        .parse(args);

      const trip = await dbTrips.requireOne({ _id: new ObjectId(input.tripId) });

      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      await dbTrips.updateOne(
        { _id: new ObjectId(input.tripId) },
        {
          $set: {
            hotelName: input.hotelName,
            hotelAddress: input.hotelAddress,
            hotelLat: input.hotelLat,
            hotelLng: input.hotelLng,
            updatedAt: new Date(),
          },
        }
      );

      return { success: true };
    },

    // Get directions from hotel to activity
    getDirections: async (args: unknown, { user }: { user: UserInfo | null }) => {
      if (!user) {
        throw new AuthError('Not authenticated');
      }

      const input = z
        .object({
          tripId: z.string(),
          destinationLat: z.number(),
          destinationLng: z.number(),
        })
        .parse(args);

      const trip = await dbTrips.requireOne({ _id: new ObjectId(input.tripId) });

      if (trip.userId.toString() !== user.id) {
        throw new AuthError('Not authorized');
      }

      // Use hotel location as origin, or destination center if no hotel
      const originLat = trip.hotelLat || trip.destinationLat || 0;
      const originLng = trip.hotelLng || trip.destinationLng || 0;

      if (originLat === 0 || originLng === 0) {
        return {
          hasDirections: false,
          message: 'Please set your hotel location to get directions',
          directions: null,
        };
      }

      const directions = estimateDirections(
        originLat,
        originLng,
        input.destinationLat,
        input.destinationLng
      );

      return {
        hasDirections: true,
        origin: {
          name: trip.hotelName || 'Your Hotel',
          lat: originLat,
          lng: originLng,
          address: trip.hotelAddress || '',
        },
        directions,
      };
    },
  },

  cronJobs: {
    weatherUpdate: weatherUpdateCron,
  },
});
