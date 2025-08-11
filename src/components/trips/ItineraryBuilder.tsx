import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Calendar, MapPin, StickyNote } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { getTripWithItineraryQuery } from "~/lib/queries/trips";
import { format } from "date-fns";
import { Heading } from "../generic/heading";
import { PlaceManager } from "./PlaceManager";

interface ItineraryBuilderProps {
  tripId: string;
}

export function ItineraryBuilder({ tripId }: ItineraryBuilderProps) {
  const [showPlaceManager, setShowPlaceManager] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);

  const { data, isLoading, error } = useQuery(getTripWithItineraryQuery(tripId));

  if (isLoading) {
    return <ItineraryBuilderSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          Failed to load trip details. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          Trip not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  const { trip, itinerary } = data;

  const totalPlaces = itinerary.reduce(
    (sum, day) => sum + (day.places?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Trip Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Heading>{trip.name}</Heading>
            {trip.description && (
              <p className="text-muted-foreground">{trip.description}</p>
            )}
          </div>
          {trip.coverImageUrl && (
            <img
              src={trip.coverImageUrl}
              alt={trip.name}
              className="w-24 h-24 rounded-lg object-cover shadow-lg"
            />
          )}
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.startDate && trip.endDate
                      ? `${Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Days</p>
                  <p className="text-xs text-muted-foreground">
                    {itinerary.length} planned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Places</p>
                  <p className="text-xs text-muted-foreground">
                    {totalPlaces} added
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <StickyNote className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-xs text-muted-foreground">
                    {itinerary.filter(day => day.notes).length} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Itinerary */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Daily Itinerary</h2>
        
        {itinerary.length === 0 ? (
          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No itinerary generated</h3>
                  <p className="text-muted-foreground">
                    Your trip needs start and end dates to generate a daily itinerary.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          itinerary.map((day, index) => (
            <Card key={day.id} className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {format(new Date(day.date), 'EEEE, MMMM d')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {day.places?.length || 0} places planned
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItinerary(day);
                        setShowPlaceManager(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Place
                    </Button>
                  </div>

                  {/* Day Notes */}
                  {day.notes && (
                    <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
                      <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{day.notes}</p>
                    </div>
                  )}

                  {/* Places for this day */}
                  {day.places && day.places.length > 0 ? (
                    <div className="space-y-3">
                      {day.places.map((place: any, placeIndex: number) => (
                        <div
                          key={place.id}
                          className="p-4 rounded-lg border bg-background hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full font-medium text-xs">
                                {placeIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{place.name}</h4>
                                  <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                                    {place.type}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  {place.time && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{place.time}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {place.description && (
                                  <p className="text-sm text-muted-foreground mt-2">{place.description}</p>
                                )}
                                
                                {place.notes && (
                                  <p className="text-xs text-muted-foreground mt-2">{place.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No places planned for this day</p>
                      <p className="text-xs">Click "Add Place" to start planning</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Place Manager Modal */}
      {showPlaceManager && selectedItinerary && (
        <PlaceManager
          tripItineraryId={selectedItinerary.id}
          isOpen={showPlaceManager}
          onClose={() => {
            setShowPlaceManager(false);
            setSelectedItinerary(null);
          }}
          existingPlaces={selectedItinerary.places || []}
          dayDate={selectedItinerary.date}
        />
      )}
    </div>
  );
}

function ItineraryBuilderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="w-24 h-24 rounded-lg" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="shadow-lg border-0 bg-card/95 backdrop-blur-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Bar Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Content Skeleton */}
      <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-12">
          <div className="space-y-4 text-center">
            <Skeleton className="w-12 h-12 rounded mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-10 w-36 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
