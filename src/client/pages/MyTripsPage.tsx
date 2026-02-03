import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@modelence/react-query';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Badge } from '@/client/components/ui/Badge';
import { Input } from '@/client/components/ui/Input';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { Trip, TRAVEL_STYLE_LABELS, BUDGET_LEVEL_LABELS, TRIP_TYPE_LABELS, TravelStyle, BudgetLevel, TripType } from '@/client/types/tripwise';

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

// Status badge component
function StatusBadge({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip.startDate, trip.numberOfDays);
  const daysUntil = getDaysUntil(trip.startDate);

  if (status === 'ongoing') {
    return (
      <span className="px-3 py-1 bg-green-100 text-xs font-semibold rounded-full text-green-700 flex items-center gap-1">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Traveling Now
      </span>
    );
  }
  
  if (status === 'upcoming' && daysUntil <= 7) {
    return (
      <span className="px-3 py-1 bg-amber-100 text-xs font-semibold rounded-full text-amber-700">
        {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
      </span>
    );
  }

  if (status === 'past') {
    return (
      <span className="px-3 py-1 bg-gray-100 text-xs font-semibold rounded-full text-gray-600">
        Completed
      </span>
    );
  }

  return null;
}

// Enhanced Trip Card
function TripCard({ trip, index, onDelete }: { trip: Trip; index: number; onDelete: (id: string) => void }) {
  const status = getTripStatus(trip.startDate, trip.numberOfDays);
  const gradient = getGradient(trip.destination, index);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="group relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gradient Header */}
      <Link to={`/trips/${trip._id}`}>
        <div className={`${gradient} h-36 relative p-4`}>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <StatusBadge trip={trip} />
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
      </Link>

      {/* Menu Button */}
      <div className="absolute top-3 left-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute left-0 top-10 bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[140px] z-10">
            <Link
              to={`/trips/${trip._id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowMenu(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </Link>
            <Link
              to={`/trips/${trip._id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowMenu(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Trip
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(false);
                onDelete(trip._id);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/trips/${trip._id}`} className="block group">
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
        </Link>
      </div>
    </div>
  );
}

// Stats Card
function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Filter pills
function FilterPills({ currentFilter, onFilterChange }: { currentFilter: string; onFilterChange: (filter: string) => void }) {
  const filters = [
    { id: 'all', label: 'All Trips' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Traveling' },
    { id: 'past', label: 'Past' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            currentFilter === filter.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// Empty State
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

export default function MyTripsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'budget'>('date');
  const queryClient = useQueryClient();

  // Fetch trips
  const { data: trips, isLoading, error } = useQuery({
    ...modelenceQuery<Trip[]>('tripwise.getTrips'),
  });

  // Delete mutation
  const { mutate: deleteTrip, isPending: isDeleting } = useMutation({
    ...modelenceMutation('tripwise.deleteTrip'),
    onSuccess: () => {
      toast.success('Trip deleted successfully');
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrips') });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete trip: ${error.message}`);
    },
  });

  const handleDelete = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      deleteTrip({ tripId });
    }
  };

  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    if (!trips) return [];

    let filtered = trips;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter((trip) => {
        const status = getTripStatus(trip.startDate, trip.numberOfDays);
        if (filter === 'ongoing') return status === 'ongoing';
        if (filter === 'upcoming') return status === 'upcoming';
        if (filter === 'past') return status === 'past';
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.destination.toLowerCase().includes(query) ||
          TRAVEL_STYLE_LABELS[trip.travelStyle as TravelStyle].toLowerCase().includes(query) ||
          BUDGET_LEVEL_LABELS[trip.budgetLevel as BudgetLevel].toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      if (sortBy === 'name') {
        return a.destination.localeCompare(b.destination);
      }
      if (sortBy === 'budget') {
        return b.budgetAmount - a.budgetAmount;
      }
      return 0;
    });

    return filtered;
  }, [trips, filter, searchQuery, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!trips) return { total: 0, upcoming: 0, totalBudget: 0, ongoing: 0 };

    const now = new Date();
    const upcoming = trips.filter((t) => {
      const start = new Date(t.startDate);
      return start > now;
    }).length;

    const ongoing = trips.filter((t) => {
      const start = new Date(t.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + t.numberOfDays);
      return now >= start && now <= end;
    }).length;

    const totalBudget = trips.reduce((acc, t) => acc + t.budgetAmount, 0);

    return {
      total: trips.length,
      upcoming,
      ongoing,
      totalBudget,
    };
  }, [trips]);

  if (isLoading) {
    return (
      <Page className="bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page className="bg-gray-50">
        <div className="text-center py-12 bg-red-50 rounded-xl">
          <p className="text-red-600">Error loading trips: {(error as Error).message}</p>
        </div>
      </Page>
    );
  }

  return (
    <Page className="bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">Plan and manage your travel adventures</p>
            </div>
            <Link to="/trips/new">
              <Button className="shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Trip
              </Button>
            </Link>
          </div>

          {/* Stats */}
          {trips && trips.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatsCard
                icon="✈️"
                label="Total Trips"
                value={stats.total}
                color="bg-blue-100"
              />
              <StatsCard
                icon="📅"
                label="Upcoming"
                value={stats.upcoming}
                color="bg-amber-100"
              />
              <StatsCard
                icon="🌍"
                label="Traveling Now"
                value={stats.ongoing}
                color="bg-green-100"
              />
              <StatsCard
                icon="💰"
                label="Total Budget"
                value={`$${stats.totalBudget.toLocaleString()}`}
                color="bg-purple-100"
              />
            </div>
          )}

          {/* Search and Filters */}
          {trips && trips.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    type="text"
                    placeholder="Search trips by destination, style..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'budget')}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="name">Destination (A-Z)</option>
                    <option value="budget">Budget (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <FilterPills currentFilter={filter} onFilterChange={setFilter} />
              </div>
            </div>
          )}
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          trips && trips.length > 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <TripCard key={trip._id} trip={trip} index={index} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
