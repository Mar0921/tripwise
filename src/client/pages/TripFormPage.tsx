import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@modelence/react-query';
import toast from 'react-hot-toast';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { Label } from '@/client/components/ui/Label';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import TripMap from '@/client/components/TripMap';
import {
  TripWithItinerary,
  TRAVEL_STYLES,
  BUDGET_LEVELS,
  TRIP_TYPES,
  TRAVEL_STYLE_LABELS,
  BUDGET_LEVEL_LABELS,
  TRIP_TYPE_LABELS,
  TravelStyle,
  BudgetLevel,
  TripType,
  DayItinerary,
} from '@/client/types/tripwise';

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

const travelStyleDescriptions: Record<TravelStyle, { icon: string; description: string }> = {
  relax: { icon: '🏖️', description: 'Beaches, spas, and peaceful getaways' },
  adventure: { icon: '🏔️', description: 'Hiking, extreme sports, and outdoor activities' },
  cultural: { icon: '🏛️', description: 'Museums, historical sites, and local traditions' },
  food: { icon: '🍜', description: 'Culinary tours, cooking classes, and local cuisine' },
};

const budgetDescriptions: Record<BudgetLevel, { icon: string; description: string }> = {
  low: { icon: '💰', description: 'Great experiences on a budget' },
  medium: { icon: '💰💰', description: 'Balanced comfort and value' },
  high: { icon: '💰💰💰', description: 'Premium luxury experiences' },
};

const tripTypeDescriptions: Record<TripType, { icon: string; description: string }> = {
  solo: { icon: '🧳', description: 'Traveling alone' },
  couple: { icon: '💑', description: 'Romantic getaway' },
  family: { icon: '👨‍👩‍👧‍👦', description: 'With kids' },
  friends: { icon: '👯', description: 'Group adventure' },
};

const supportedDestinations = [
  'Paris',
  'Tokyo',
  'New York',
  'London',
  'Bali',
  'Rome',
  'Barcelona',
  'Madrid',
  'Istanbul',
  'Mexico City',
  'Los Angeles',
  'Miami',
  'Beijing',
  'Berlin',
  'Athens',
];

export default function TripFormPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!tripId;

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(5);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('cultural');
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('medium');
  const [budgetAmount, setBudgetAmount] = useState(1000);
  const [numberOfTravelers, setNumberOfTravelers] = useState(1);
  const [tripType, setTripType] = useState<TripType>('solo');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewItinerary, setPreviewItinerary] = useState<DayItinerary[]>([]);

  // Fetch existing trip data if editing
  const { data: existingTrip, isLoading: isLoadingTrip } = useQuery({
    ...modelenceQuery<TripWithItinerary>('tripwise.getTrip', { tripId }),
    enabled: isEditing,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingTrip) {
      setDestination(existingTrip.destination);
      setStartDate(formatDateForInput(existingTrip.startDate));
      setNumberOfDays(existingTrip.numberOfDays);
      setTravelStyle(existingTrip.travelStyle as TravelStyle);
      setBudgetLevel(existingTrip.budgetLevel as BudgetLevel);
      setBudgetAmount(existingTrip.budgetAmount || 1000);
      setNumberOfTravelers(existingTrip.numberOfTravelers || 1);
      setTripType((existingTrip.tripType as TripType) || 'solo');
      setHotelName(existingTrip.hotelName || '');
      setHotelAddress(existingTrip.hotelAddress || '');
    }
  }, [existingTrip]);

  // Auto-adjust number of travelers based on trip type
  useEffect(() => {
    if (tripType === 'solo') {
      setNumberOfTravelers(1);
    } else if (tripType === 'couple') {
      setNumberOfTravelers(2);
    } else if (tripType === 'family' && numberOfTravelers < 3) {
      setNumberOfTravelers(3);
    } else if (tripType === 'friends' && numberOfTravelers < 2) {
      setNumberOfTravelers(2);
    }
  }, [tripType, numberOfTravelers]);

  // Create mutation
  const { mutate: createTrip, isPending: isCreating } = useMutation({
    ...modelenceMutation<{ tripId: string }>('tripwise.createTrip'),
    onSuccess: (data) => {
      toast.success('Trip created successfully!');
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrips') });
      navigate(`/trips/${data.tripId}`);
    },
    onError: (error) => {
      toast.error(`Failed to create trip: ${(error as Error).message}`);
    },
  });

  // Update mutation
  const { mutate: updateTrip, isPending: isUpdating } = useMutation({
    ...modelenceMutation('tripwise.updateTrip'),
    onSuccess: () => {
      toast.success('Trip updated successfully!');
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrips') });
      queryClient.invalidateQueries({ queryKey: createQueryKey('tripwise.getTrip', { tripId }) });
      navigate(`/trips/${tripId}`);
    },
    onError: (error) => {
      toast.error(`Failed to update trip: ${(error as Error).message}`);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!destination.trim()) {
        toast.error('Please enter a destination');
        return;
      }

      if (!startDate) {
        toast.error('Please select a start date');
        return;
      }

      if (numberOfDays < 1 || numberOfDays > 30) {
        toast.error('Number of days must be between 1 and 30');
        return;
      }

      if (budgetAmount < 0) {
        toast.error('Budget must be a positive number');
        return;
      }

      const tripData = {
        destination: destination.trim(),
        startDate,
        numberOfDays,
        travelStyle,
        budgetLevel,
        budgetAmount,
        numberOfTravelers,
        tripType,
        hotelName: hotelName || undefined,
        hotelAddress: hotelAddress || undefined,
      };

      if (isEditing) {
        updateTrip({ tripId, ...tripData });
      } else {
        createTrip(tripData);
      }
    },
    [destination, startDate, numberOfDays, travelStyle, budgetLevel, budgetAmount, numberOfTravelers, tripType, hotelName, hotelAddress, isEditing, tripId, createTrip, updateTrip]
  );

  const isPending = isCreating || isUpdating;

  if (isEditing && isLoadingTrip) {
    return (
      <Page className="bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  // Get tomorrow's date as minimum start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate estimated daily budget per person
  const dailyBudgetPerPerson = numberOfDays > 0 && numberOfTravelers > 0
    ? Math.round(budgetAmount / numberOfDays / numberOfTravelers)
    : 0;

  return (
    <Page className="bg-gray-50">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <Link to={isEditing ? `/trips/${tripId}` : '/'} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isEditing ? 'Back to Trip' : 'Back to Dashboard'}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isEditing ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Trip' : 'Plan a New Trip'}
              </h1>
              <p className="text-gray-600">
                {isEditing
                  ? 'Update your trip details. A new itinerary will be generated.'
                  : 'Tell us about your dream trip'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="destination" className="text-base font-semibold text-gray-900">
                    Where do you want to go?
                  </Label>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Enter your destination city
                  </p>
                  <Input
                    id="destination"
                    type="text"
                    placeholder="e.g., Paris, Tokyo, New York..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={isPending}
                    className="text-lg"
                    required
                  />
                </div>

                {/* Quick destination pills */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Popular destinations:</p>
                  <div className="flex flex-wrap gap-2">
                    {supportedDestinations.map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setDestination(dest)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          destination === dest
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isPending}
                      >
                        {dest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Type Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold text-gray-900">Who's traveling?</Label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                We'll customize activities based on your group
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRIP_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripType(type)}
                    disabled={isPending}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      tripType === type
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{tripTypeDescriptions[type].icon}</div>
                    <div className="font-semibold text-gray-900 text-sm">{TRIP_TYPE_LABELS[type]}</div>
                  </button>
                ))}
              </div>

              {/* Number of travelers */}
              <div className="mt-4">
                <Label htmlFor="numberOfTravelers" className="text-sm text-gray-600">Number of Travelers</Label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setNumberOfTravelers(Math.max(1, numberOfTravelers - 1))}
                    disabled={isPending || numberOfTravelers <= 1 || tripType === 'solo'}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  >
                    -
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">{numberOfTravelers}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumberOfTravelers(Math.min(20, numberOfTravelers + 1))}
                    disabled={isPending || numberOfTravelers >= 20 || tripType === 'solo'}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Duration Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold text-gray-900">When and how long?</Label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Choose your travel dates
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm text-gray-600">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={minDate}
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfDays" className="text-sm text-gray-600">Duration (days)</Label>
                  <Input
                    id="numberOfDays"
                    type="number"
                    min={1}
                    max={30}
                    value={numberOfDays}
                    onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 1)}
                    disabled={isPending}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold text-gray-900">What's your budget?</Label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Total budget for all travelers
              </p>

              {/* Budget Amount Input */}
              <div className="mb-6">
                <Label htmlFor="budgetAmount" className="text-sm text-gray-600">Total Budget (USD)</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <Input
                    id="budgetAmount"
                    type="number"
                    min={0}
                    step={100}
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                    className="pl-8 text-lg font-semibold"
                  />
                </div>
                {dailyBudgetPerPerson > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ~${dailyBudgetPerPerson}/day per person
                  </p>
                )}
              </div>

              {/* Budget Level */}
              <div>
                <Label className="text-sm text-gray-600 mb-3 block">Experience Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {BUDGET_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setBudgetLevel(level)}
                      disabled={isPending}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        budgetLevel === level
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{budgetDescriptions[level].icon}</div>
                      <div className="font-semibold text-gray-900 text-sm">{BUDGET_LEVEL_LABELS[level]}</div>
                      <div className="text-xs text-gray-500 mt-1">{budgetDescriptions[level].description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Style Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold text-gray-900">What's your travel style?</Label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                We'll tailor activities to match your preferences
              </p>

              <div className="grid grid-cols-2 gap-3">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setTravelStyle(style)}
                    disabled={isPending}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      travelStyle === style
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{travelStyleDescriptions[style].icon}</div>
                    <div className="font-semibold text-gray-900">{TRAVEL_STYLE_LABELS[style]}</div>
                    <div className="text-xs text-gray-500 mt-1">{travelStyleDescriptions[style].description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hotel Card */}
          <Card className="shadow-sm border-gray-200">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold text-gray-900">Where are you staying?</Label>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Add your hotel to see directions from your hotel to activities
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hotelName" className="text-sm text-gray-600">Hotel Name (optional)</Label>
                  <Input
                    id="hotelName"
                    type="text"
                    placeholder="e.g., Grand Hotel Paris"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hotelAddress" className="text-sm text-gray-600">Hotel Address (optional)</Label>
                  <Input
                    id="hotelAddress"
                    type="text"
                    placeholder="e.g., 123 Champs-Élysées, Paris"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Link to={isEditing ? `/trips/${tripId}` : '/'}>
              <Button type="button" variant="outline" disabled={isPending} size="lg">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isPending} size="lg" className="shadow-lg">
              {isPending ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">{isEditing ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  {isEditing ? 'Update Trip' : 'Create Trip'}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info Card */}
        <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-2">What happens next?</p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 mt-0.5">1</span>
                    We generate a day-by-day itinerary with daytime and nighttime activities
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 mt-0.5">2</span>
                    Each activity shows estimated prices based on your budget level
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0 mt-0.5">3</span>
                    Choose between main and alternative activities on the map
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
