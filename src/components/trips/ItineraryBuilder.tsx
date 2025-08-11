import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Calendar, MapPin, DollarSign } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { getTripWithStopsQuery } from "~/lib/queries/trips";
import { TripStopCard } from "./TripStopCard";
import { StopCreator } from "./StopCreator";
import { Heading } from "../generic/heading";
import { useUserCurrency } from "~/lib/hooks/use-user-currency";

interface ItineraryBuilderProps {
  tripId: string;
}

export function ItineraryBuilder({ tripId }: ItineraryBuilderProps) {
  const [showStopCreator, setShowStopCreator] = useState(false);
  const { formatAmount } = useUserCurrency();

  const { data, isLoading, error } = useQuery(getTripWithStopsQuery(tripId));

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

  const { trip, stops } = data;

  const totalBudget = stops.reduce((sum, stop) => sum + (stop.budget || 0), 0);
  const totalActivities = stops.reduce(
    (sum, stop) => sum + (stop.activities?.length || 0),
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
                <MapPin className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Stops</p>
                  <p className="text-xs text-muted-foreground">
                    {stops.length}{" "}
                    {stops.length === 1 ? "destination" : "destinations"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Activities</p>
                  <p className="text-xs text-muted-foreground">
                    {totalActivities} planned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(totalBudget)} allocated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Trip Itinerary</h2>
        <Button
          onClick={() => setShowStopCreator(true)}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stop
        </Button>
      </div>

      {/* Trip Stops */}
      <div className="space-y-6">
        {stops.length === 0 ? (
          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No stops added yet</h3>
                  <p className="text-muted-foreground">
                    Start building your itinerary by adding your first
                    destination.
                  </p>
                </div>
                <Button
                  onClick={() => setShowStopCreator(true)}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          stops.map((stop, index) => (
            <TripStopCard
              key={stop.id}
              stop={stop}
              stopNumber={index + 1}
              tripId={tripId}
            />
          ))
        )}
      </div>

      {/* Stop Creator Modal */}
      {showStopCreator && (
        <StopCreator
          tripId={tripId}
          isOpen={showStopCreator}
          onClose={() => setShowStopCreator(false)}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
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
