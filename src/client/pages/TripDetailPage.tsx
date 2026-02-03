import { useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@modelence/react-query';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import { Badge } from '@/client/components/ui/Badge';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import TripMap from '@/client/components/TripMap';
import {
  TripWithItinerary,
  DayItinerary,
  TRAVEL_STYLE_LABELS,
  BUDGET_LEVEL_LABELS,
  TRIP_TYPE_LABELS,
  TravelStyle,
  BudgetLevel,
  TripType,
  WeatherCondition,
  DirectionsResponse,
} from '@/client/types/tripwise';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(price: number): string {
  return `$${price}`;
}

// Weather icons with colors
function WeatherIcon({ weather, size = 'md' }: { weather: WeatherCondition; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const icons: Record<WeatherCondition, JSX.Element> = {
    sunny: (
      <svg className={`${sizeClasses[size]} text-amber-500`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
    ),
    cloudy: (
      <svg className={`${sizeClasses[size]} text-gray-500`} fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
      </svg>
    ),
    rainy: (
      <svg className={`${sizeClasses[size]} text-blue-500`} fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
        <circle cx="8" cy="22" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="11" cy="23" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="14" cy="22" r="1" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    stormy: (
      <svg className={`${sizeClasses[size]} text-purple-600`} fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
      </svg>
    ),
  };

  return icons[weather] || icons.sunny;
}

// Get weather background class
function getWeatherBgClass(weather: WeatherCondition): string {
  const classes: Record<WeatherCondition, string> = {
    sunny: 'weather-sunny',
    cloudy: 'weather-cloudy',
    rainy: 'weather-rainy',
    stormy: 'weather-stormy',
  };
  return classes[weather] || 'bg-gray-100';
}

// Directions Modal component
function DirectionsModal({
  isOpen,
  onClose,
  activityName,
  location,
  directions,
  hotelName,
  isLoading,
  onSetHotel,
}: {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  location: { name: string; address: string };
  directions: DirectionsResponse | null;
  hotelName: string;
  isLoading: boolean;
  onSetHotel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">How to Get There</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Destination */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Destination</p>
              <p className="font-semibold text-gray-900">{activityName}</p>
              <p className="text-sm text-gray-600">{location.name}</p>
              <p className="text-xs text-gray-500">{location.address}</p>
            </div>

            {/* Origin (Hotel) */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium mb-1">From</p>
              {hotelName ? (
                <p className="font-semibold text-gray-900">{hotelName}</p>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-2">No hotel location set</p>
                  <Button size="sm" variant="outline" onClick={onSetHotel}>
                    Set Hotel Location
                  </Button>
                </div>
              )}
            </div>

            {/* Directions */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : directions?.hasDirections && directions.directions ? (
              <div className="space-y-3">
                {/* Walking */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Walking</p>
                      <p className="text-xs text-gray-500">{directions.directions.walking.distance} km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{directions.directions.walking.duration} min</p>
                  </div>
                </div>

                {/* Public Transport */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v4m-4-8a4 4 0 014-4h0a4 4 0 014 4v4a4 4 0 01-4 4h0a4 4 0 01-4-4V7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Public Transport</p>
                      <p className="text-xs text-gray-500">{directions.directions.publicTransport.distance} km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{directions.directions.publicTransport.duration} min</p>
                  </div>
                </div>

                {/* Taxi */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M5 11h14M7 15h10M9 19h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Taxi / Uber</p>
                      <p className="text-xs text-gray-500">{directions.directions.taxi.distance} km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{directions.directions.taxi.duration} min</p>
                    <p className="text-xs text-green-600 font-medium">~${directions.directions.taxi.estimatedCost}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>{directions?.message || 'Set your hotel location to see directions'}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Activity card component
function ActivityCard({
  activity,
  activityType,
  duration,
  location,
  price,
  timeOfDay,
  isSelected,
  isAlternative,
  onSelect,
  numberOfTravelers,
  onGetDirections,
}: {
  activity: string;
  activityType: string;
  duration: number;
  location: { lat: number; lng: number; name: string; address: string };
  price: number;
  timeOfDay: 'daytime' | 'nighttime';
  isSelected: boolean;
  isAlternative: boolean;
  onSelect: () => void;
  numberOfTravelers: number;
  onGetDirections: () => void;
}) {
  const totalPrice = price * numberOfTravelers;
  const bgColor = timeOfDay === 'daytime' ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200';
  const selectedBg = timeOfDay === 'daytime' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400' : 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-400';
  const iconBg = timeOfDay === 'daytime' ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected ? selectedBg : isAlternative ? 'bg-gray-50 border-gray-200 opacity-75 hover:opacity-100' : bgColor
      }`}
    >
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
                {timeOfDay === 'daytime' ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {timeOfDay === 'daytime' ? 'Day Activity' : 'Night Activity'}
                {isAlternative && ' (Alternative)'}
              </span>
              {isSelected && (
                <Badge className="bg-green-500 text-white text-xs">Selected</Badge>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{activity}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <span className={`px-2 py-0.5 rounded-full ${activityType === 'outdoor' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {activityType}
              </span>
              <span>{duration}h</span>
            </div>
            <div className="flex items-start gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{location.name}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{formatPrice(price)}</p>
            <p className="text-xs text-gray-500">per person</p>
            {numberOfTravelers > 1 && (
              <p className="text-xs text-gray-400 mt-1">
                {formatPrice(totalPrice)} total
              </p>
            )}
          </div>
        </div>
      </button>
      {/* How to get there button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onGetDirections();
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        How to Get There
      </button>
    </div>
  );
}

// Day card component with activity selection
function DayCard({
  day,
  isSelected,
  onClick,
  onSelectActivity,
  numberOfTravelers,
  onGetDirections,
}: {
  day: DayItinerary;
  isSelected: boolean;
  onClick: () => void;
  onSelectActivity: (itineraryId: string, timeOfDay: 'daytime' | 'nighttime', selection: 'main' | 'alternative') => void;
  numberOfTravelers: number;
  onGetDirections: (activity: string, location: { lat: number; lng: number; name: string; address: string }) => void;
}) {
  // Calculate daily total
  const daytimePrice = day.selectedDaytimeActivity === 'main'
    ? day.daytimeActivityPrice
    : day.daytimeAlternativeActivityPrice;
  const nighttimePrice = day.selectedNighttimeActivity === 'main'
    ? day.nighttimeActivityPrice
    : day.nighttimeAlternativeActivityPrice;
  const dailyTotal = (daytimePrice + nighttimePrice) * numberOfTravelers;

  return (
    <Card
      className={`transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'hover:shadow-md'
      } ${day.isWeatherAdjusted ? 'border-amber-300' : ''}`}
    >
      {/* Day Header with Weather */}
      <div
        className={`${getWeatherBgClass(day.weather as WeatherCondition)} p-4 rounded-t-xl cursor-pointer`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {formatDate(day.date)}
            </p>
            <p className="text-2xl font-bold text-gray-900">Day {day.dayNumber}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{formatPrice(dailyTotal)}</p>
              <p className="text-xs text-gray-500">daily total</p>
            </div>
            <div className="flex flex-col items-center">
              <WeatherIcon weather={day.weather as WeatherCondition} size="lg" />
              <span className="text-xs font-medium text-gray-600 capitalize mt-1">{day.weather}</span>
            </div>
          </div>
        </div>
        {day.isWeatherAdjusted && (
          <Badge variant="warning" className="mt-2">
            Plan adjusted for weather
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Daytime Activities */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
            </svg>
            Daytime
          </h4>
          <ActivityCard
            activity={day.daytimeActivity}
            activityType={day.daytimeActivityType}
            duration={day.daytimeActivityDuration}
            location={day.daytimeActivityLocation}
            price={day.daytimeActivityPrice}
            timeOfDay="daytime"
            isSelected={day.selectedDaytimeActivity === 'main'}
            isAlternative={false}
            onSelect={() => onSelectActivity(day._id, 'daytime', 'main')}
            numberOfTravelers={numberOfTravelers}
            onGetDirections={() => onGetDirections(day.daytimeActivity, day.daytimeActivityLocation)}
          />
          <ActivityCard
            activity={day.daytimeAlternativeActivity}
            activityType={day.daytimeAlternativeActivityType}
            duration={day.daytimeAlternativeActivityDuration}
            location={day.daytimeAlternativeActivityLocation}
            price={day.daytimeAlternativeActivityPrice}
            timeOfDay="daytime"
            isSelected={day.selectedDaytimeActivity === 'alternative'}
            isAlternative={true}
            onSelect={() => onSelectActivity(day._id, 'daytime', 'alternative')}
            numberOfTravelers={numberOfTravelers}
            onGetDirections={() => onGetDirections(day.daytimeAlternativeActivity, day.daytimeAlternativeActivityLocation)}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Nighttime Activities */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
            Nighttime
          </h4>
          <ActivityCard
            activity={day.nighttimeActivity}
            activityType={day.nighttimeActivityType}
            duration={day.nighttimeActivityDuration}
            location={day.nighttimeActivityLocation}
            price={day.nighttimeActivityPrice}
            timeOfDay="nighttime"
            isSelected={day.selectedNighttimeActivity === 'main'}
            isAlternative={false}
            onSelect={() => onSelectActivity(day._id, 'nighttime', 'main')}
            numberOfTravelers={numberOfTravelers}
            onGetDirections={() => onGetDirections(day.nighttimeActivity, day.nighttimeActivityLocation)}
          />
          <ActivityCard
            activity={day.nighttimeAlternativeActivity}
            activityType={day.nighttimeAlternativeActivityType}
            duration={day.nighttimeAlternativeActivityDuration}
            location={day.nighttimeAlternativeActivityLocation}
            price={day.nighttimeAlternativeActivityPrice}
            timeOfDay="nighttime"
            isSelected={day.selectedNighttimeActivity === 'alternative'}
            isAlternative={true}
            onSelect={() => onSelectActivity(day._id, 'nighttime', 'alternative')}
            numberOfTravelers={numberOfTravelers}
            onGetDirections={() => onGetDirections(day.nighttimeAlternativeActivity, day.nighttimeAlternativeActivityLocation)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Trip hero section
function TripHero({ trip }: { trip: TripWithItinerary }) {
  const endDate = new Date(trip.startDate);
  endDate.setDate(endDate.getDate() + trip.numberOfDays - 1);

  // Weather summary
  const weatherSummary = trip.itinerary.reduce((acc, day) => {
    const weather = day.weather as WeatherCondition;
    acc[weather] = (acc[weather] || 0) + 1;
    return acc;
  }, {} as Record<WeatherCondition, number>);

  // Calculate total trip cost
  const totalCost = trip.itinerary.reduce((acc, day) => {
    const daytimePrice = day.selectedDaytimeActivity === 'main'
      ? day.daytimeActivityPrice
      : day.daytimeAlternativeActivityPrice;
    const nighttimePrice = day.selectedNighttimeActivity === 'main'
      ? day.nighttimeActivityPrice
      : day.nighttimeAlternativeActivityPrice;
    return acc + daytimePrice + nighttimePrice;
  }, 0) * trip.numberOfTravelers;

  // Destination image placeholder
  const getDestinationGradient = (destination: string): string => {
    const dest = destination.toLowerCase();
    if (dest.includes('paris') || dest.includes('france')) return 'bg-travel-gradient';
    if (dest.includes('tokyo') || dest.includes('japan')) return 'bg-sunset-gradient';
    if (dest.includes('bali') || dest.includes('beach')) return 'bg-ocean-gradient';
    if (dest.includes('london') || dest.includes('uk')) return 'bg-gray-700';
    return 'bg-nature-gradient';
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden ${getDestinationGradient(trip.destination)} text-white`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Destination Info */}
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">
              {formatDate(trip.startDate)} - {formatDate(endDate.toISOString())}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{trip.destination}</h1>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{trip.numberOfDays} days</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">{trip.numberOfTravelers} {trip.numberOfTravelers === 1 ? 'traveler' : 'travelers'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-medium">{TRIP_TYPE_LABELS[trip.tripType as TripType]}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm font-medium">{TRAVEL_STYLE_LABELS[trip.travelStyle as TravelStyle]}</span>
              </div>
            </div>
          </div>

          {/* Budget & Weather */}
          <div className="flex flex-col gap-3">
            {/* Budget Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Budget</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">${trip.budgetAmount}</span>
                <span className="text-sm text-white/70">{BUDGET_LEVEL_LABELS[trip.budgetLevel as BudgetLevel]}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-white/70">Estimated activities cost</p>
                <p className="text-lg font-semibold">${totalCost}</p>
              </div>
            </div>

            {/* Weather Forecast */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-2">Weather Forecast</p>
              <div className="flex gap-3">
                {Object.entries(weatherSummary).map(([weather, count]) => (
                  <div key={weather} className="flex items-center gap-1.5">
                    <WeatherIcon weather={weather as WeatherCondition} size="sm" />
                    <span className="text-sm font-medium">{count}d</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{
    name: string;
    location: { lat: number; lng: number; name: string; address: string };
  } | null>(null);
  const [directionsData, setDirectionsData] = useState<DirectionsResponse | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  const { data: trip, isLoading, error } = useQuery({
    ...modelenceQuery<TripWithItinerary>('tripwise.getTrip', { tripId }),
    enabled: !!tripId,
  });

  const { mutate: deleteTrip, isPending: isDeleting } = useMutation({
    ...modelenceMutation('tripwise.deleteTrip'),
    onSuccess: () => {
      toast.success('Trip deleted successfully');
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrips') });
      navigate('/');
    },
    onError: (error) => {
      toast.error(`Failed to delete trip: ${(error as Error).message}`);
    },
  });

  const { mutate: selectActivity } = useMutation({
    ...modelenceMutation('tripwise.selectActivity'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrip', { tripId }) });
    },
    onError: (error) => {
      toast.error(`Failed to update selection: ${(error as Error).message}`);
    },
  });

  const { mutate: getDirections } = useMutation({
    ...modelenceMutation<DirectionsResponse>('tripwise.getDirections'),
    onSuccess: (data) => {
      setDirectionsData(data);
      setIsLoadingDirections(false);
    },
    onError: (error) => {
      toast.error(`Failed to get directions: ${(error as Error).message}`);
      setIsLoadingDirections(false);
    },
  });

  const { mutate: updateHotelLocation, isPending: isUpdatingHotel } = useMutation({
    ...modelenceMutation('tripwise.updateHotelLocation'),
    onSuccess: () => {
      toast.success('Hotel location updated');
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrip', { tripId }) });
      setShowHotelModal(false);
      // Re-fetch directions if we have a selected activity
      if (selectedActivity && tripId) {
        setIsLoadingDirections(true);
        getDirections({
          tripId,
          destinationLat: selectedActivity.location.lat,
          destinationLng: selectedActivity.location.lng,
        });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update hotel: ${(error as Error).message}`);
    },
  });

  const handleDelete = useCallback(() => {
    if (tripId) {
      deleteTrip({ tripId });
    }
  }, [tripId, deleteTrip]);

  const handleDaySelect = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);

  const handleSelectActivity = useCallback((itineraryId: string, timeOfDay: 'daytime' | 'nighttime', selection: 'main' | 'alternative') => {
    selectActivity({ itineraryId, timeOfDay, selection });
  }, [selectActivity]);

  const handleGetDirections = useCallback((activityName: string, location: { lat: number; lng: number; name: string; address: string }) => {
    setSelectedActivity({ name: activityName, location });
    setShowDirections(true);
    setIsLoadingDirections(true);
    setDirectionsData(null);

    if (tripId) {
      getDirections({
        tripId,
        destinationLat: location.lat,
        destinationLng: location.lng,
      });
    }
  }, [tripId, getDirections]);

  const handleSetHotel = useCallback(() => {
    setShowHotelModal(true);
  }, []);

  const handleSaveHotel = useCallback(() => {
    if (!tripId || !trip) return;

    // Use destination center as default coordinates
    updateHotelLocation({
      tripId,
      hotelName: hotelName || 'My Hotel',
      hotelAddress: hotelAddress || trip.destination,
      hotelLat: trip.destinationLat || 0,
      hotelLng: trip.destinationLng || 0,
    });
  }, [tripId, trip, hotelName, hotelAddress, updateHotelLocation]);

  if (isLoading) {
    return (
      <Page className="bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (error || !trip) {
    return (
      <Page className="bg-gray-50">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip not found</h2>
          <p className="text-gray-600 mb-4">
            {error ? (error as Error).message : 'This trip does not exist or you do not have access to it.'}
          </p>
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        {/* Back Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center gap-1 group">
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex gap-2">
            <Link to={`/trips/${tripId}/edit`}>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Trip
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">Delete Trip</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete your trip to {trip.destination}? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Trip'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trip Hero */}
        <div className="mb-8">
          <TripHero trip={trip} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <TripMap
              itinerary={trip.itinerary}
              destination={trip.destination}
              selectedDay={selectedDay}
              onDaySelect={handleDaySelect}
              hotelLocation={trip.hotelLat && trip.hotelLng ? {
                name: trip.hotelName,
                lat: trip.hotelLat,
                lng: trip.hotelLng,
                address: trip.hotelAddress,
              } : null}
            />
          </div>

          {/* Day Navigation */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Day-by-Day Itinerary
              </h2>

              {/* Day Pills */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {trip.itinerary.map((day) => (
                  <button
                    key={day._id}
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDay === day.dayNumber
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Day {day.dayNumber}</span>
                      <WeatherIcon weather={day.weather as WeatherCondition} size="sm" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Day Card */}
              <div className="max-h-[70vh] overflow-y-auto">
                {trip.itinerary.find(d => d.dayNumber === selectedDay) && (
                  <DayCard
                    day={trip.itinerary.find(d => d.dayNumber === selectedDay)!}
                    isSelected={true}
                    onClick={() => {}}
                    onSelectActivity={handleSelectActivity}
                    numberOfTravelers={trip.numberOfTravelers}
                    onGetDirections={handleGetDirections}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Directions Modal */}
        {selectedActivity && (
          <DirectionsModal
            isOpen={showDirections}
            onClose={() => {
              setShowDirections(false);
              setSelectedActivity(null);
            }}
            activityName={selectedActivity.name}
            location={selectedActivity.location}
            directions={directionsData}
            hotelName={trip.hotelName}
            isLoading={isLoadingDirections}
            onSetHotel={handleSetHotel}
          />
        )}

        {/* Hotel Location Modal */}
        {showHotelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Set Hotel Location</h3>
                  <button
                    onClick={() => setShowHotelModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      placeholder="e.g., Hilton Downtown"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Address
                    </label>
                    <input
                      type="text"
                      value={hotelAddress}
                      onChange={(e) => setHotelAddress(e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Note: For now, the hotel location will use the destination center coordinates.
                    Directions are estimated based on distance.
                  </p>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowHotelModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveHotel}
                    disabled={isUpdatingHotel}
                    className="flex-1"
                  >
                    {isUpdatingHotel ? 'Saving...' : 'Save Hotel'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}
