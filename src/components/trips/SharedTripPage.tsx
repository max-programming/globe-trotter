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
import { cn } from "~/lib/utils";

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

  function PlaceCard({
    place,
    index,
    onClick,
  }: {
    place: any;
    index: number;
    onClick: () => void;
  }) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const thumbnailUrl: string | undefined =
      place.place?.photoReference && apiKey
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=160&photo_reference=${encodeURIComponent(
            place.place.photoReference
          )}&key=${apiKey}`
        : place.place?.destinationImageUrl || undefined;

    const description: string | undefined =
      place.place?.secondaryText ||
      place.place?.formattedAddress ||
      place.userNotes ||
      (Array.isArray(place.place?.placeTypes)
        ? place.place.placeTypes.slice(0, 3).join(", ")
        : undefined);

    return (
      <div
        className="group w-full p-3 rounded-lg border bg-background flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors relative cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white rounded-full font-medium text-[11px] flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <button
            type="button"
            className="block text-left"
            aria-label={`View ${place.place?.name || place.name || ""}`}
          >
            <h5 className="font-medium text-sm cursor-pointer">
              {place.place?.name || "Unknown Place"}
            </h5>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 cursor-pointer">
                {description}
              </p>
            )}
          </button>
        </div>
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={place.place?.name || place.name || "Place"}
            className="w-36 h-20 rounded-md object-cover flex-shrink-0"
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="px-10 ms:pl-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Side - Trip Itinerary */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Trip Header */}
            <div className="relative overflow-hidden mt-6">
              {/* Cover Image Background */}
              <div className="relative h-64 bg-transparent">
                {trip.destinationImageUrl && (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={trip.destinationImageUrl}
                      alt={trip.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl overflow-hidden"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl overflow-hidden" />
                  </div>
                )}

                {/* Content Overlay */}
                <div className="z-10 h-full flex flex-col justify-end rounded-xl overflow-hidden">
                  {/* Trip Title and Location */}
                  <div className="space-y-2 bg-white max-w-2/4 w-full py-4 p-10 rounded-lg shadow-lg absolute left-1/2 -translate-x-1/2 -bottom-1/2 -translate-y-1/2 ">
                    <Heading className="text-2xl font-bold text-white drop-shadow-lg">
                      {trip.name}
                    </Heading>
                    {trip.destinationName && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium drop-shadow">
                          {trip.destinationName}
                        </span>
                      </div>
                    )}
                    {trip.startDate && trip.endDate && (
                      <div className="flex items-center space-x-2 ">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm drop-shadow">
                          {format(new Date(trip.startDate), "MMM d")} -{" "}
                          {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 ">
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
              <div className="p-4 bg-background/95 pt-16">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center space-x-2">
                      <StickyNote className="w-4 h-4" />
                      <span>Trip Notes</span>
                    </h3>
                  </div>

                  <div className="min-h-8">
                    {trip.notes ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        ➤ {trip.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">
                        No notes added yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Itinerary - Accordion Style */}
            <div className="space-y-3 mb-20">
              <div className="flex items-center justify-between">
                <Heading>Daily Itinerary</Heading>
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
                      className={cn(
                        "bg-card/95 p-6 backdrop-blur-sm hover:bg-muted/50 transition-colors cursor-pointer relative"
                      )}
                    >
                      <CardContent className="p-0">
                        {/* Accordion Header */}
                        <button
                          className="w-full flex items-center justify-between cursor-pointer"
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
                                    <PlaceCard
                                      key={place.id}
                                      place={place}
                                      index={placeIndex}
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
                                    />
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
                  center={{
                    lat: trip.place?.latitude || 0,
                    lng: trip.place?.longitude || 0,
                  }}
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
