import { format } from "date-fns";
import {
  Clock,
  MapPin,
  Calendar,
  Star,
  Eye,
  DollarSign,
  User,
  X,
  Route,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { CommunityTrip } from "./CommunityTripCard";

interface TripTimelineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: CommunityTrip | null;
  onSaveTrip: (tripId: string) => void;
  isSaving?: boolean;
}

export function TripTimelineModal({
  isOpen,
  onOpenChange,
  trip,
  onSaveTrip,
  isSaving = false,
}: TripTimelineModalProps) {
  if (!trip) return null;

  const formatDateRange = () => {
    if (!trip.startDate || !trip.endDate) return "Date not specified";
    return `${format(new Date(trip.startDate), "MMM d")} - ${format(
      new Date(trip.endDate),
      "MMM d, yyyy"
    )}`;
  };

  const getDuration = () => {
    if (!trip.startDate || !trip.endDate) return null;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  };

  const displayImage = trip.coverImageUrl || trip.destinationImageUrl;
  const totalPlaces =
    trip.itinerary?.reduce((acc, day) => acc + day.places.length, 0) || 0;

  const handleViewSharedTrip = () => {
    if (trip.shareToken) {
      window.open(`/view/${trip.shareToken}`, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[60vw] w-full  h-[90vh] p-0 flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold line-clamp-2 pr-4">
                  {trip.name}
                </DialogTitle>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {trip.destinationName && (
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{trip.destinationName}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateRange()}</span>
                  </div>

                  {getDuration() && (
                    <Badge variant="outline" className="text-xs">
                      {getDuration()}
                    </Badge>
                  )}

                  {totalPlaces > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalPlaces} place{totalPlaces !== 1 ? "s" : ""}
                    </Badge>
                  )}

                  {trip.totalBudget && (
                    <div className="flex items-center space-x-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${trip.totalBudget}</span>
                    </div>
                  )}
                </div>

                {/* Creator info */}
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={trip.user.image || ""} />
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                      {trip.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium">{trip.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(trip.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {trip.shareToken && (
                  <Button
                    onClick={handleViewSharedTrip}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Trip
                  </Button>
                )}
                <Button
                  onClick={() => onSaveTrip(trip.id)}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? "Saving..." : "Save Trip"}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full flex flex-col lg:flex-row">
              {/* Trip Image and Description - Sidebar */}
              <div className="lg:w-80 lg:flex-shrink-0 bg-muted/20 border-r">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-4">
                    {/* Trip Image */}
                    {displayImage && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                        <img
                          src={displayImage}
                          alt={trip.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Trip Description */}
                    {trip.description && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">
                          About This Trip
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {trip.description}
                        </p>
                      </div>
                    )}

                    {/* Trip Stats */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Trip Stats</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Duration
                          </span>
                          <span>{getDuration() || "Not specified"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Places</span>
                          <span>{totalPlaces} locations</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Stops</span>
                          <span>{trip.tripStopsCount} city stops</span>
                        </div>
                        {trip.totalBudget && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Budget
                            </span>
                            <span>${trip.totalBudget}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Interactive Timeline - Main Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Timeline Header */}
                <div className="px-6 py-4 border-b bg-background">
                  <div className="flex items-center space-x-2">
                    <Route className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Trip Timeline</h3>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      {trip.itinerary && trip.itinerary.length > 0 ? (
                        <div className="space-y-4">
                          {trip.itinerary.map((day, dayIndex) => (
                            <Card key={day.id} className="overflow-hidden">
                              <CardContent className="p-0">
                                {/* Day Header */}
                                <div className="bg-primary/5 px-4 py-3 border-b">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold flex items-center space-x-2">
                                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                        {dayIndex + 1}
                                      </div>
                                      <span className="text-sm">
                                        Day {dayIndex + 1}
                                      </span>
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {format(
                                        new Date(day.date),
                                        "MMM d, yyyy"
                                      )}
                                    </Badge>
                                  </div>
                                  {day.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {day.notes}
                                    </p>
                                  )}
                                </div>

                                {/* Places for this day */}
                                <div className="p-4">
                                  {day.places && day.places.length > 0 ? (
                                    <div className="space-y-2">
                                      {day.places.map((place, placeIndex) => (
                                        <div
                                          key={place.id}
                                          className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                            {placeIndex + 1}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-sm truncate">
                                              {place.name}
                                            </h5>

                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                              {place.scheduledTime && (
                                                <div className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  <span>
                                                    {place.scheduledTime}
                                                  </span>
                                                </div>
                                              )}

                                              {place.visitDuration && (
                                                <div className="flex items-center gap-1">
                                                  <Eye className="w-3 h-3" />
                                                  <span>
                                                    {place.visitDuration} min
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No places planned for this day
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Route className="w-12 h-12 text-muted-foreground mb-4" />
                          <h4 className="font-semibold mb-2">
                            No Detailed Itinerary
                          </h4>
                          <p className="text-sm text-muted-foreground max-w-md">
                            This trip doesn't have a detailed day-by-day
                            itinerary available. You can save it to your
                            collection to create your own detailed plan!
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
