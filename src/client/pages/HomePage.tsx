import { Link } from 'react-router-dom';
import { useSession } from 'modelence/client';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Badge } from '@/client/components/ui/Badge';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { Trip, TRAVEL_STYLE_LABELS, BUDGET_LEVEL_LABELS, TravelStyle, BudgetLevel } from '@/client/types/tripwise';

// Gradient backgrounds for different destinations
const destinationGradients: Record<string, string> = {
  'Paris': 'bg-gradient-to-br from-pink-400 to-rose-500',
  'Tokyo': 'bg-gradient-to-br from-red-400 to-orange-500',
  'New York': 'bg-gradient-to-br from-blue-500 to-indigo-600',
  'London': 'bg-gradient-to-br from-gray-500 to-slate-600',
  'Bali': 'bg-gradient-to-br from-emerald-400 to-teal-500',
  'Rome': 'bg-gradient-to-br from-amber-400 to-orange-600',
  'Barcelona': 'bg-gradient-to-br from-purple-400 to-pink-500',
  'Madrid': 'bg-gradient-to-br from-yellow-400 to-orange-500',
  'Istanbul': 'bg-gradient-to-br from-cyan-400 to-blue-500',
  'Mexico City': 'bg-gradient-to-br from-green-400 to-emerald-600',
  'Los Angeles': 'bg-gradient-to-br from-purple-500 to-indigo-600',
  'Miami': 'bg-gradient-to-br from-cyan-400 to-teal-500',
  'Beijing': 'bg-gradient-to-br from-red-500 to-rose-600',
  'Berlin': 'bg-gradient-to-br from-gray-400 to-gray-600',
  'Athens': 'bg-gradient-to-br from-blue-400 to-cyan-500',
};

const defaultGradients = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-green-400 to-emerald-500',
  'bg-gradient-to-br from-pink-400 to-rose-500',
  'bg-gradient-to-br from-indigo-500 to-purple-600',
];

function getGradient(destination: string, index: number): string {
  return destinationGradients[destination] || defaultGradients[index % defaultGradients.length];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntil(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getTripStatus(startDate: string, numberOfDays: number): 'upcoming' | 'ongoing' | 'past' {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + numberOfDays);
  const now = new Date();

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'past';
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const status = getTripStatus(trip.startDate, trip.numberOfDays);
  const daysUntil = getDaysUntil(trip.startDate);
  const gradient = getGradient(trip.destination, index);

  return (
    <Link to={`/trips/${trip._id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Gradient Header */}
        <div className={`${gradient} h-32 relative p-4`}>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {status === 'ongoing' && (
              <span className="px-3 py-1 bg-white/90 text-xs font-semibold rounded-full text-green-700 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Traveling Now
              </span>
            )}
            {status === 'upcoming' && daysUntil <= 7 && daysUntil > 0 && (
              <span className="px-3 py-1 bg-white/90 text-xs font-semibold rounded-full text-amber-700">
                {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
              </span>
            )}
          </div>

          {/* Destination Icon */}
          <div className="absolute bottom-3 left-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {trip.destination}
          </h3>
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(trip.startDate)} · {trip.numberOfDays} day{trip.numberOfDays !== 1 ? 's' : ''}
          </p>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
              {TRAVEL_STYLE_LABELS[trip.travelStyle as TravelStyle]}
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
              {BUDGET_LEVEL_LABELS[trip.budgetLevel as BudgetLevel]}
            </Badge>
          </div>

          {/* Budget & Travelers */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">${trip.budgetAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{trip.numberOfTravelers} traveler{trip.numberOfTravelers !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-28 h-28 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No trips yet</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Start planning your first adventure! Create a personalized itinerary tailored to your travel style and budget.
      </p>
      <Link to="/trips/new">
        <Button size="lg" className="shadow-lg px-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Plan Your First Trip
        </Button>
      </Link>
    </div>
  );
}

function Dashboard() {
  const { data: trips, isLoading, error } = useQuery({
    ...modelenceQuery<Trip[]>('tripwise.getTrips'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl">
        <p className="text-red-600">Error loading trips: {(error as Error).message}</p>
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return <EmptyState />;
  }

  const upcomingTrips = trips?.filter(t => getTripStatus(t.startDate, t.numberOfDays) === 'upcoming') || [];
  const ongoingTrips = trips?.filter(t => getTripStatus(t.startDate, t.numberOfDays) === 'ongoing') || [];
  const pastTrips = trips?.filter(t => getTripStatus(t.startDate, t.numberOfDays) === 'past') || [];

  // Calculate stats
  const totalBudget = trips.reduce((acc, t) => acc + t.budgetAmount, 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✈️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingTrips.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{ongoingTrips.length}</p>
              <p className="text-sm text-gray-500">Traveling</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Budget</p>
            </div>
          </div>
        </div>
      </div>

      {ongoingTrips.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Currently Traveling</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ongoingTrips.map((trip, i) => (
              <TripCard key={trip._id} trip={trip} index={i} />
            ))}
          </div>
        </section>
      )}

      {upcomingTrips.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Upcoming Adventures</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingTrips.map((trip, i) => (
              <TripCard key={trip._id} trip={trip} index={i} />
            ))}
          </div>
        </section>
      )}

      {pastTrips.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Past Memories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pastTrips.map((trip, i) => (
              <TripCard key={trip._id} trip={trip} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LandingPage() {
  const popularDestinations = [
    { name: 'Paris', country: 'France', gradient: 'from-pink-400 to-rose-500' },
    { name: 'Tokyo', country: 'Japan', gradient: 'from-red-400 to-orange-500' },
    { name: 'New York', country: 'USA', gradient: 'from-blue-500 to-indigo-600' },
    { name: 'Bali', country: 'Indonesia', gradient: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI-Powered Travel Planning
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Plan Your Perfect
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Adventure
          </span>
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          TripWise creates personalized day-by-day itineraries based on your travel style,
          budget, and real-time weather conditions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <Button size="lg" className="px-8 shadow-lg hover:shadow-xl transition-shadow">
              Get Started Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover-lift">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Itineraries</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Get personalized day-by-day plans with activities matched to your travel style and preferences.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover-lift">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Weather Adaptive</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Plans automatically adjust to weather with indoor alternatives ready for rainy days.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover-lift">
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Interactive Maps</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Visualize your entire trip on beautiful interactive maps with all your destinations.
          </p>
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular Destinations</h2>
        <p className="text-gray-600">Start planning your next adventure</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {popularDestinations.map((dest) => (
          <div
            key={dest.name}
            className={`bg-gradient-to-br ${dest.gradient} rounded-xl p-6 text-white card-hover-lift cursor-pointer`}
          >
            <div className="text-lg font-bold">{dest.name}</div>
            <div className="text-white/80 text-sm">{dest.country}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useSession();

  return (
    <Page className="bg-gray-50">
      <div className="max-w-6xl mx-auto w-full">
        {user ? (
          <>
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
                <p className="text-gray-600">Plan and manage your travel adventures</p>
              </div>
              <Link to="/trips/new">
                <Button className="shadow-md">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Trip
                </Button>
              </Link>
            </div>
            <Dashboard />
          </>
        ) : (
          <LandingPage />
        )}
      </div>
    </Page>
  );
}
