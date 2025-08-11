import { useState } from "react";
import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  StickyNote,
  Clock,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ActivityManager } from "./ActivityManager";
import { useDeleteTripStop } from "~/lib/mutations/trips/useTripStops";
import { useUserCurrency } from "~/lib/hooks/use-user-currency";

interface TripStopCardProps {
  stop: any; // TODO: Add proper type from schema
  stopNumber: number;
  tripId: string;
}

const activityIcons = {
  sightseeing: MapPin,
  food: "🍽️",
  entertainment: "🎭",
  adventure: "⛰️", 
  culture: "🏛️",
  shopping: "🛍️",
  relaxation: "🧘",
  transportation: "🚗",
  accommodation: "🏨",
  other: Circle,
};

const activityColors = {
  sightseeing: "bg-blue-100 text-blue-800 border-blue-200",
  food: "bg-orange-100 text-orange-800 border-orange-200",
  entertainment: "bg-purple-100 text-purple-800 border-purple-200",
  adventure: "bg-green-100 text-green-800 border-green-200",
  culture: "bg-amber-100 text-amber-800 border-amber-200", 
  shopping: "bg-pink-100 text-pink-800 border-pink-200",
  relaxation: "bg-teal-100 text-teal-800 border-teal-200",
  transportation: "bg-gray-100 text-gray-800 border-gray-200",
  accommodation: "bg-indigo-100 text-indigo-800 border-indigo-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};

export function TripStopCard({ stop, stopNumber, tripId }: TripStopCardProps) {
  const [showActivityManager, setShowActivityManager] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { formatAmount } = useUserCurrency();
  
  const deleteTripStopMutation = useDeleteTripStop();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this stop? All activities will also be deleted.")) {
      await deleteTripStopMutation.mutateAsync({ stopId: stop.id });
    }
  };

  const totalActivitiesCost = stop.activities?.reduce((sum: number, activity: any) => 
    sum + (activity.actualCost || 0), 0) || 0;

  const completedActivities = stop.activities?.filter((activity: any) => activity.isCompleted) || [];

  return (
    <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm">
              {stopNumber}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">
                {stop.city?.name || "Unknown City"}, {stop.country?.name || "Unknown Country"}
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {stop.arrivalDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(stop.arrivalDate), "MMM d")}
                      {stop.departureDate && stop.departureDate !== stop.arrivalDate 
                        ? ` - ${format(new Date(stop.departureDate), "MMM d")}`
                        : ""
                      }
                    </span>
                  </div>
                )}
                {stop.budget && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatAmount(stop.budget)} budget</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <CardAction>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleteTripStopMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Stop Notes */}
          {stop.notes && (
            <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
              <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{stop.notes}</p>
            </div>
          )}

          {/* Activities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold">Activities</h4>
                <Badge variant="secondary">
                  {completedActivities.length}/{stop.activities?.length || 0} completed
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowActivityManager(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </div>

            {stop.activities && stop.activities.length > 0 ? (
              <div className="space-y-3">
                {stop.activities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      activity.isCompleted 
                        ? "bg-green-50/50 border-green-200" 
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {activity.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className={`font-medium ${
                              activity.isCompleted ? "line-through text-muted-foreground" : ""
                            }`}>
                              {activity.activityName}
                            </h5>
                            <Badge 
                              variant="outline"
                              className={activityColors[activity.activityCategory as keyof typeof activityColors]}
                            >
                              {activity.activityCategory}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {activity.scheduledDate && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(activity.scheduledDate), "MMM d, h:mm a")}</span>
                              </div>
                            )}
                            {activity.actualCost && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{formatAmount(activity.actualCost)}</span>
                              </div>
                            )}
                          </div>
                          
                          {activity.notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No activities planned yet</p>
                <p className="text-xs">Add activities to build your itinerary</p>
              </div>
            )}
          </div>

          {/* Budget Summary */}
          {(stop.budget || totalActivitiesCost > 0) && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Budget Summary</span>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">
                      {formatAmount(totalActivitiesCost)} spent
                    </span>
                    {stop.budget && (
                      <span className="text-muted-foreground">
                        of {formatAmount(stop.budget)}
                      </span>
                    )}
                  </div>
                  {stop.budget && (
                    <div className={`text-xs ${
                      totalActivitiesCost > stop.budget 
                        ? "text-destructive" 
                        : "text-green-600"
                    }`}>
                      {totalActivitiesCost > stop.budget 
                        ? `${formatAmount(totalActivitiesCost - stop.budget)} over budget`
                        : `${formatAmount(stop.budget - totalActivitiesCost)} remaining`
                      }
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Activity Manager Modal */}
      {showActivityManager && (
        <ActivityManager
          tripStopId={stop.id}
          isOpen={showActivityManager}
          onClose={() => setShowActivityManager(false)}
          existingActivities={stop.activities || []}
          stopArrivalDate={stop.arrivalDate}
          stopDepartureDate={stop.departureDate}
        />
      )}
    </Card>
  );
}