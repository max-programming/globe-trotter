import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  StickyNote, 
  Search,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { getTripWithItineraryQuery } from "~/lib/queries/trips";
import { useCreatePlace } from "~/lib/mutations/trips/usePlaces";
import { upsertPlace } from "~/server-functions/trip";
import { Heading } from "../generic/heading";
import { TripMap } from "../maps/TripMap";
import { useUpdateTripNotes } from "~/lib/mutations/trips/useTripNotes";

interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface TripPlannerPageProps {
  tripId: string;
}

export function TripPlannerPage({ tripId }: TripPlannerPageProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [daySearchQueries, setDaySearchQueries] = useState<Record<number, string>>({});
  const [dayPlaceSuggestions, setDayPlaceSuggestions] = useState<Record<number, GooglePlaceSuggestion[]>>({});
  const [dayShowSuggestions, setDayShowSuggestions] = useState<Record<number, boolean>>({});
  const [dayIsSearching, setDayIsSearching] = useState<Record<number, boolean>>({});
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceSuggestion | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [tripNotes, setTripNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Refs for debouncing per day
  const searchTimeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});

  const { data, isLoading, error } = useQuery(getTripWithItineraryQuery(tripId));
  const createPlaceMutation = useCreatePlace();
  const upsertPlaceFn = useServerFn(upsertPlace);
  const updateTripNotesMutation = useUpdateTripNotes();

  // Debounced place search function for specific day
  const searchPlacesForDay = useCallback(async (dayId: number, query: string) => {
    if (!query || query.length < 2) {
      setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
      setDayIsSearching(prev => ({ ...prev, [dayId]: false }));
      return;
    }

    setDayIsSearching(prev => ({ ...prev, [dayId]: true }));

    try {
      const searchParams = new URLSearchParams({
        input: query,
        types: "establishment", // Focus on businesses and places
        language: "en",
      });

      const response = await fetch(`/api/places/autocomplete?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: data.suggestions }));
      } else {
        console.error("Places API error:", data.error);
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
      }
    } catch (error) {
      console.error("Failed to fetch place suggestions:", error);
      setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
    } finally {
      setDayIsSearching(prev => ({ ...prev, [dayId]: false }));
    }
  }, []);

  // Debounced search for specific day
  const debouncedSearchForDay = useCallback(
    (dayId: number, query: string) => {
      if (searchTimeoutRefs.current[dayId]) {
        clearTimeout(searchTimeoutRefs.current[dayId]);
      }

      searchTimeoutRefs.current[dayId] = setTimeout(() => {
        searchPlacesForDay(dayId, query);
      }, 300);
    },
    [searchPlacesForDay]
  );

  // Initialize trip notes when data loads
  useEffect(() => {
    if (data?.trip?.notes) {
      setTripNotes(data.trip.notes);
    }
  }, [data?.trip?.notes]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(searchTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleDaySearchChange = (dayId: number, value: string) => {
    setDaySearchQueries(prev => ({ ...prev, [dayId]: value }));
    debouncedSearchForDay(dayId, value);
    setDayShowSuggestions(prev => ({ ...prev, [dayId]: true }));

    if (!value) {
      setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
    }
  };

  const handlePlaceSelectForDay = (dayId: number, place: GooglePlaceSuggestion) => {
    setSelectedPlace(place);
    setDayShowSuggestions(prev => ({ ...prev, [dayId]: false }));
  };

  const handleAddPlaceToDay = async (day: any, place: GooglePlaceSuggestion) => {
    if (isAddingPlace) return;
    
    setIsAddingPlace(true);
    try {
      // First, upsert the place to ensure it exists in our database
      await upsertPlaceFn({
        data: {
          place_id: place.place_id,
          name: place.main_text,
          formatted_address: place.description,
          main_text: place.main_text,
          secondary_text: place.secondary_text,
          types: place.types,
        }
      });

      // Then add it to the user's itinerary for this day
      await createPlaceMutation.mutateAsync({
        tripItineraryId: day.id,
        placeId: place.place_id,
        userNotes: `Added from search: ${place.description}`,
      });

      // Clear the search for this day after successful addition
      setDaySearchQueries(prev => ({ ...prev, [day.id]: "" }));
      setDayPlaceSuggestions(prev => ({ ...prev, [day.id]: [] }));
      setSelectedPlace(null);
      
    } catch (error) {
      console.error("Failed to add place:", error);
    } finally {
      setIsAddingPlace(false);
    }
  };

  const toggleDayExpansion = (dayId: number) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayId)) {
        newExpanded.delete(dayId);
        // Clear search state when collapsing
        setDaySearchQueries(prev => ({ ...prev, [dayId]: "" }));
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
        setDayShowSuggestions(prev => ({ ...prev, [dayId]: false }));
      } else {
        newExpanded.add(dayId);
      }
      return newExpanded;
    });
  };

  const handleSaveTripNotes = async () => {
    try {
      await updateTripNotesMutation.mutateAsync({
        tripId,
        notes: tripNotes,
      });
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Failed to save trip notes:", error);
    }
  };

  const handleCancelEditNotes = () => {
    setTripNotes(data?.trip?.notes || "");
    setIsEditingNotes(false);
  };

  if (isLoading) {
    return <TripPlannerSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load trip details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Trip not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { trip, itinerary } = data;
  const totalPlaces = itinerary.reduce((sum: number, day: any) => sum + (day.places?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-6rem)]">
          
          {/* Left Side - Trip Itinerary */}
          <div className="xl:col-span-3 flex flex-col space-y-4 overflow-hidden">
            
            {/* Trip Header */}
            <div className="relative overflow-hidden rounded-xl">
              {/* Cover Image Background */}
              <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700">
                {trip.destinationImageUrl && (
                  <>
                    <img
                      src={trip.destinationImageUrl}
                      alt={trip.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                )}
                
                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="p-6 space-y-3">
                    {/* Trip Title and Location */}
                    <div className="space-y-2">
                      <Heading className="text-2xl font-bold text-white drop-shadow-lg">
                        {trip.name}
                      </Heading>
                      {trip.destinationName && (
                        <div className="flex items-center space-x-2 text-white/90">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium drop-shadow">{trip.destinationName}</span>
                        </div>
                      )}
                      {trip.startDate && trip.endDate && (
                        <div className="flex items-center space-x-2 text-white/90">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm drop-shadow">
                            {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Description */}
              {trip.description && (
                <div className="p-4 bg-background/95 border-b">
                  <p className="text-sm text-muted-foreground">{trip.description}</p>
                </div>
              )}

              {/* Trip Notes Section */}
              <div className="p-4 bg-background/95">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center space-x-2">
                      <StickyNote className="w-4 h-4" />
                      <span>Trip Notes</span>
                    </h3>
                    {!isEditingNotes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingNotes(true)}
                        className="text-xs"
                      >
                        {tripNotes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tripNotes}
                        onChange={(e) => setTripNotes(e.target.value)}
                        placeholder="Add your personal notes about this trip..."
                        className="min-h-20 text-sm"
                        rows={3}
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditNotes}
                          disabled={updateTripNotesMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTripNotes}
                          disabled={updateTripNotesMutation.isPending}
                        >
                          {updateTripNotesMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Notes"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-8">
                      {tripNotes ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tripNotes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic">No notes added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Daily Itinerary - Accordion Style */}
            <div className="flex-1 overflow-y-auto space-y-3">
              <h2 className="text-xl font-semibold">Daily Itinerary</h2>
              
              {itinerary.length === 0 ? (
                <Card className="bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No itinerary generated</h3>
                    <p className="text-muted-foreground">
                      Your trip needs start and end dates to generate a daily itinerary.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                itinerary.map((day: any, index: number) => {
                  const isExpanded = expandedDays.has(day.id);
                  const daySearchQuery = daySearchQueries[day.id] || "";
                  const dayPlaces = dayPlaceSuggestions[day.id] || [];
                  const isSearching = dayIsSearching[day.id] || false;
                  const showSuggestions = dayShowSuggestions[day.id] || false;

                  return (
                    <Card key={day.id} className="bg-card/95 backdrop-blur-sm">
                      <CardContent className="p-0">
                        {/* Accordion Header */}
                        <button
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          onClick={() => toggleDayExpansion(day.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">
                                {format(new Date(day.date), 'EEEE, MMMM d')}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {day.places?.length || 0} places planned
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {day.places?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {day.places.length}
                              </Badge>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="border-t bg-background/50">
                            <div className="p-4 space-y-4">
                              
                              {/* Day Notes */}
                              {day.notes && (
                                <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
                                  <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">{day.notes}</p>
                                </div>
                              )}

                              {/* Add Place Search */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm flex items-center space-x-2">
                                  <Plus className="w-4 h-4" />
                                  <span>Add a place to this day</span>
                                </h4>
                                
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                  <Input
                                    type="text"
                                    placeholder="Search for restaurants, attractions, etc..."
                                    className="pl-10"
                                    value={daySearchQuery}
                                    onChange={(e) => handleDaySearchChange(day.id, e.target.value)}
                                    onFocus={() => setDayShowSuggestions(prev => ({ ...prev, [day.id]: true }))}
                                    onBlur={() => {
                                      setTimeout(() => setDayShowSuggestions(prev => ({ ...prev, [day.id]: false })), 150);
                                    }}
                                  />
                                  
                                  {/* Search Results Dropdown */}
                                  {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {isSearching ? (
                                        <div className="px-4 py-3 text-center text-muted-foreground flex items-center justify-center space-x-2">
                                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                          <span>Searching...</span>
                                        </div>
                                      ) : dayPlaces.length > 0 ? (
                                        dayPlaces.map(place => (
                                          <button
                                            key={place.place_id}
                                            type="button"
                                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                                            onClick={() => {
                                              handlePlaceSelectForDay(day.id, place);
                                              handleAddPlaceToDay(day, place);
                                            }}
                                          >
                                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{place.main_text}</div>
                                              <div className="text-xs text-muted-foreground">{place.secondary_text}</div>
                                            </div>
                                            <Plus className="w-4 h-4 text-primary" />
                                          </button>
                                        ))
                                      ) : daySearchQuery.length >= 2 ? (
                                        <div className="px-4 py-3 text-center text-muted-foreground">
                                          No places found
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Places for this day */}
                              {day.places && day.places.length > 0 ? (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Planned Places</h4>
                                  {day.places.map((place: any, placeIndex: number) => (
                                    <div
                                      key={place.id}
                                      className="p-3 rounded-lg border bg-background flex items-center space-x-3"
                                    >
                                      <div className="flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-700 rounded-full font-medium text-xs">
                                        {placeIndex + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                          <h5 className="font-medium text-sm">
                                            {place.placeDetails?.name || place.name || "Unknown Place"}
                                          </h5>
                                          {place.scheduledTime && (
                                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                              <Clock className="w-3 h-3" />
                                              <span>{place.scheduledTime}</span>
                                            </div>
                                          )}
                                        </div>
                                        {place.placeDetails?.formattedAddress && (
                                          <p className="text-xs text-muted-foreground">
                                            {place.placeDetails.formattedAddress}
                                          </p>
                                        )}
                                      </div>
                                      {place.userRating && (
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-xs">{place.userRating}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-sm">No places planned for this day</p>
                                  <p className="text-xs">Use the search above to add places</p>
                                </div>
                              )}
                              
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side - Google Maps */}
          <div className="xl:col-span-2 bg-card/95 backdrop-blur-sm rounded-lg border overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Map View</span>
                </h3>
                {selectedPlace && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing: {selectedPlace.main_text}
                  </p>
                )}
              </div>
              
              {/* Google Maps Container */}
              <div className="flex-1">
                <TripMap
                  selectedPlace={selectedPlace}
                  itineraryPlaces={itinerary.flatMap((day: any) => day.places || [])}
                  onPlaceSelect={(place) => {
                    // Handle place selection from map if needed
                    console.log("Place selected from map:", place);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripPlannerSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem)]">
          
          {/* Left Side Skeleton */}
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="w-20 h-20 rounded-lg" />
              </div>
              
              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card/95 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <Skeleton className="w-5 h-5 mx-auto mb-2" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Search Skeleton */}
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Days Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Side Skeleton */}
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-[calc(100vh-12rem)] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}