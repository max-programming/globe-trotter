import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  StickyNote,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { getTripWithItineraryByShareIdQuery } from "~/lib/queries/trips";
import { Heading } from "../generic/heading";
import { TripMap } from "../maps/TripMap";

interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface SharedTripPageProps {
  shareId: string;
}

export function SharedTripPage({ shareId }: SharedTripPageProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedPlace, setSelectedPlace] =
    useState<GooglePlaceSuggestion | null>(null);

  const { data, error } = useSuspenseQuery(
    getTripWithItineraryByShareIdQuery(shareId)
  );

  const toggleDayExpansion = (dayId: number) => {
    setExpandedDays((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayId)) {
        newExpanded.delete(dayId);
      } else {
        newExpanded.add(dayId);
      }
      return newExpanded;
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load shared trip. This link may be invalid or no longer
            active.
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
            Shared trip not found or no longer available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { trip, itinerary, shareInfo } = data;
  const totalPlaces = itinerary.reduce(
    (sum: number, day: any) => sum + (day.places?.length || 0),
    0
  );

  return (
    <div className="min-h-screen ">
      <div className="px-10 ms:pl-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Side - Trip Itinerary */}
          <div className="md:col-span-7 flex flex-col space-y-4 pt-6">
            {/* Trip Header */}
            <div className="relative ">
              {/* Cover Image Background */}
              <div className="relative h-64 bg-transparent">
                {trip.destinationImageUrl && (
                  <div className="rounded-xl ">
                    <img
                      src={trip.destinationImageUrl}
                      alt={trip.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl "
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl " />
                  </div>
                )}

                {/* Content Overlay */}
                <div className="relative z-20 h-full flex flex-col justify-end rounded-xl">
                  {/* Trip Title and Location */}
                  <div className="space-y-2 bg-white max-w-2/4 w-full py-6 px-8 rounded-lg shadow-lg absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-30">
                    <Heading className="text-2xl font-bold text-gray-800">
                      {trip.name}
                    </Heading>
                    {trip.destinationName && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {trip.destinationName}
                        </span>
                      </div>
                    )}
                    {trip.startDate && trip.endDate && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {format(new Date(trip.startDate), "MMM d")} -{" "}
                          {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 z-20">
                    {shareInfo && (
                      <div className="bg-white/20 border-white/30 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Eye className="w-4 h-4" />
                          <span>{shareInfo.viewCount} views</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Notes Section */}
              {trip.notes && (
                <div className="p-4 bg-background/95 pt-20 mt-8">
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center space-x-2">
                      <StickyNote className="w-4 h-4" />
                      <span>Trip Notes</span>
                    </h3>
                    <div className="min-h-8">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        ➤ {trip.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Itinerary - Accordion Style */}
            <div className="space-y-3 mt-20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Daily Itinerary</h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedDays(new Set(itinerary.map((d: any) => d.id)))
                    }
                    aria-label="Expand all days"
                  >
                    Expand all
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedDays(new Set())}
                    aria-label="Collapse all days"
                  >
                    Collapse all
                  </Button>
                </div>
              </div>

              {itinerary.length === 0 ? (
                <Card className="bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No itinerary available
                    </h3>
                    <p className="text-muted-foreground">
                      This trip doesn't have a detailed daily itinerary yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                itinerary.map((day, index) => {
                  const isExpanded = expandedDays.has(day.id);

                  return (
                    <Card
                      key={day.id}
                      className="bg-card/95 backdrop-blur-sm hover:bg-muted/50 transition-colors p-3"
                    >
                      <CardContent className="p-0">
                        {/* Accordion Header */}
                        <button
                          className="w-full p-4 flex items-center justify-between"
                          onClick={() => toggleDayExpansion(day.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`day-content-${day.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">
                                {format(new Date(day.date), "EEEE, MMMM d")}
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
                          <div
                            id={`day-content-${day.id}`}
                            className="border-t bg-background/50"
                          >
                            <div className="p-4 space-y-4">
                              {/* Day Notes */}
                              {day.notes && (
                                <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
                                  <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">
                                    {day.notes}
                                  </p>
                                </div>
                              )}

                              {/* Places for this day */}
                              {day.places && day.places.length > 0 ? (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">
                                    Planned Places
                                  </h4>
                                  {day.places.map((place, placeIndex) => (
                                    <button
                                      key={place.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedPlace({
                                          place_id: place.placeId,
                                          main_text: place.place?.name || "",
                                          description:
                                            place.place?.formattedAddress || "",
                                          secondary_text: "",
                                          types: [],
                                        })
                                      }
                                      className="w-full text-left p-3 rounded-lg border bg-background flex items-center gap-3 hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                                      aria-label={`View ${place.place?.name || ""}`}
                                    >
                                      <div className="flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-700 rounded-full font-medium text-xs">
                                        {placeIndex + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-medium text-sm">
                                            {place.place?.name ||
                                              "Unknown Place"}
                                          </h5>
                                          {place.scheduledTime && (
                                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                              <Clock className="w-3 h-3" />
                                              <span>{place.scheduledTime}</span>
                                            </div>
                                          )}
                                        </div>
                                        {place.place?.formattedAddress && (
                                          <p className="text-xs text-muted-foreground">
                                            {place.place?.formattedAddress}
                                          </p>
                                        )}

                                        {place.userNotes && (
                                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {place.userNotes}
                                          </p>
                                        )}
                                      </div>
                                      {place.userRating && (
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          <span className="text-xs">
                                            {place.userRating}
                                          </span>
                                        </div>
                                      )}
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                                  <p className="text-sm">
                                    No places planned for this day
                                  </p>
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
          <div className="md:col-span-5 bg-card/95 backdrop-blur-sm rounded-lg border overflow-hidden xl:sticky xl:top-6  h-96 mb-10 md:h-[calc(100vh-5rem)] self-start">
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
              <div className="flex-1 min-h-0">
                <TripMap
                  selectedPlace={selectedPlace}
                  itineraryPlaces={itinerary.flatMap((day) => day.places || [])}
                  center={
                    trip.place
                      ? {
                          lat: trip.place.latitude || 0,
                          lng: trip.place.longitude || 0,
                        }
                      : undefined
                  }
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
