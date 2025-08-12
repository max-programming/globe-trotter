import { format, isValid } from "date-fns";
import {
  Calendar,
  MapPin,
  User,
  Heart,
  BookmarkPlus,
  Eye,
  Star,
  Clock,
  Route,
  DollarSign,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export interface CommunityTrip {
  id: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  coverImageUrl: string | null;
  destinationName: string | null;
  destinationImageUrl: string | null;
  totalBudget: number | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  tripStopsCount: number;
  place: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  itinerary?: {
    id: number;
    date: string | Date;
    notes: string | null;
    places: {
      id: number;
      name: string;
      scheduledTime: string | null;
      visitDuration: number | null;
      sortOrder?: number;
    }[];
  }[];
}

interface CommunityTripCardProps {
  trip: CommunityTrip;
  onSaveTrip: (tripId: string) => void;
  onViewTrip: (trip: CommunityTrip) => void;
  isSaving?: boolean;
}

export function CommunityTripCard({
  trip,
  onSaveTrip,
  onViewTrip,
  isSaving = false,
}: CommunityTripCardProps) {
  const formatDateRange = () => {
    if (!trip.startDate || !trip.endDate) return null;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (!isValid(start) || !isValid(end)) return null;

    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const getDuration = () => {
    if (!trip.startDate || !trip.endDate) return null;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (!isValid(start) || !isValid(end)) return null;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  };

  const displayImage = trip.coverImageUrl || trip.destinationImageUrl;
  const firstDayPlaces = trip.itinerary?.[0]?.places?.slice(0, 3) || [];
  const totalPlaces =
    trip.itinerary?.reduce((acc, day) => acc + day.places.length, 0) || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden w-full">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Trip Image */}
          <div className="relative w-full md:w-80 h-48 md:h-auto bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0">
            {displayImage ? (
              <img
                src={displayImage}
                alt={trip.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-12 h-12 text-primary-400" />
              </div>
            )}

            {/* Trip Stats Overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {getDuration() && (
                <Badge
                  variant="secondary"
                  className="bg-primary/50 border-primary text-xs"
                >
                  {getDuration()}
                </Badge>
              )}
            </div>
          </div>

          {/* Trip Content */}
          <div className="flex-1 p-6 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors">
                    {trip.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {trip.destinationName && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destinationName}</span>
                      </div>
                    )}

                    {formatDateRange() && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateRange()}</span>
                      </div>
                    )}

                    {trip.totalBudget && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>${trip.totalBudget}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Description */}
                {trip.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.description}
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={trip.user.image || ""} />
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {trip.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {trip.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(trip.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Itinerary Preview */}
            {firstDayPlaces.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      Itinerary Highlights
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {totalPlaces} place{totalPlaces !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {firstDayPlaces.map((place, index) => (
                      <div
                        key={place.id}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30 text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{place.name}</p>
                          {place.scheduledTime && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {place.scheduledTime}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {totalPlaces > 3 && (
                      <div className="flex items-center justify-center p-2 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                        +{totalPlaces - 3} more places
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTrip(trip)}
                className="flex-1 mr-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Timeline
              </Button>

              <Button
                size="sm"
                onClick={() => onSaveTrip(trip.id)}
                disabled={isSaving}
                className="px-4"
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Save Trip
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
