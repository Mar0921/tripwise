import { time } from 'modelence';
import { ObjectId } from 'modelence/server';
import { dbTrips, dbItineraries, dbNotifications, WeatherCondition } from './db';
import { hasWeatherChanged, getNewWeather } from './weather';
import { adjustForWeather } from './itinerary';

// Daily cron job to check upcoming trips and update weather
export const weatherUpdateCron = {
  description: 'Check upcoming trips and update itineraries based on weather changes',
  interval: time.days(1),
  handler: async () => {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find trips starting within the next week
      const upcomingTrips = await dbTrips.fetch({
        startDate: { $gte: now, $lte: nextWeek },
      });

      for (const trip of upcomingTrips) {
        try {
          // Get itineraries for this trip
          const itineraries = await dbItineraries.fetch({ tripId: trip._id });

          for (const itinerary of itineraries) {
            try {
              // Check if weather has changed
              if (hasWeatherChanged(itinerary.weather as WeatherCondition)) {
                const newWeather = getNewWeather(
                  itinerary.weather as WeatherCondition,
                  itinerary.date,
                  trip.destination
                );

                // Adjust activities based on new weather
                const currentMain = {
                  name: itinerary.mainActivity,
                  type: itinerary.mainActivityType as 'indoor' | 'outdoor',
                  duration: itinerary.mainActivityDuration,
                  location: itinerary.mainActivityLocation as { lat: number; lng: number; name: string; address: string },
                  price: itinerary.daytimeActivityPrice || 0,
                };

                const currentAlt = {
                  name: itinerary.alternativeActivity,
                  type: itinerary.alternativeActivityType as 'indoor' | 'outdoor',
                  duration: itinerary.alternativeActivityDuration,
                  location: itinerary.alternativeActivityLocation as { lat: number; lng: number; name: string; address: string },
                  price: itinerary.daytimeAlternativeActivityPrice || 0,
                };

                const adjusted = adjustForWeather(currentMain, currentAlt, newWeather);

                // Update itinerary
                await dbItineraries.updateOne(
                  { _id: itinerary._id },
                  {
                    $set: {
                      weather: newWeather,
                      mainActivity: adjusted.mainActivity.name,
                      mainActivityType: adjusted.mainActivity.type,
                      mainActivityDuration: adjusted.mainActivity.duration,
                      mainActivityLocation: adjusted.mainActivity.location,
                      alternativeActivity: adjusted.alternativeActivity.name,
                      alternativeActivityType: adjusted.alternativeActivity.type,
                      alternativeActivityDuration: adjusted.alternativeActivity.duration,
                      alternativeActivityLocation: adjusted.alternativeActivity.location,
                      isWeatherAdjusted: true,
                    },
                  }
                );

                // Create notification
                await dbNotifications.insertOne({
                  userId: trip.userId,
                  tripId: trip._id as ObjectId,
                  message: `Weather update for your ${trip.destination} trip on Day ${itinerary.dayNumber}: Changed from ${itinerary.weather} to ${newWeather}. Activities have been adjusted.`,
                  isRead: false,
                  createdAt: new Date(),
                });
              }
            } catch (innerError) {
              console.error(`Error processing itinerary ${itinerary._id}:`, innerError);
            }
          }
        } catch (tripError) {
          console.error(`Error processing trip ${trip._id}:`, tripError);
        }
      }

      console.log(`Weather update cron completed. Checked ${upcomingTrips.length} upcoming trips.`);
    } catch (error) {
      console.error('Weather update cron failed:', error);
    }
  },
};
