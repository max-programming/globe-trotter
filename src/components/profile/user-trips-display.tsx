import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
  Plane,
  Ellipsis,
  Share2,
  Trash,
  Loader2,
} from "lucide-react";
import { getUserTripsQuery } from "~/lib/queries/trips";
import { Link } from "@tanstack/react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useShareTrip } from "~/lib/mutations/trips/useShareTrip";
import { ShareTripDialog } from "../trips/ShareTripDialog";

export function UserTripsDisplay() {
  const { data: trips } = useSuspenseQuery(getUserTripsQuery);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const shareTrip = useShareTrip();

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
      case "planned":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "active":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "completed":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  const handleShareTrip = async (tripId: string) => {
    try {
      setSelectedTripId(tripId);
      const result = await shareTrip.mutateAsync({ tripId });
      const shareUrl = `${window.location.origin}/view/${result.shareId}`;
      setShareUrl(shareUrl);
      setIsShareDialogOpen(true);
    } catch (error) {
      console.error("Failed to share trip:", error);
    }
  };

  if (!trips || trips.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold">My Trips</h2>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary-500 to-primary-600"
            asChild
          >
            <Link to="/trips/new">
              <Plus className="w-4 h-4" />
              New Trip
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/20">
          <Plane className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No trips yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Start planning your next adventure! Create your first trip to
            explore the world.
          </p>
          <Button asChild>
            <Link to="/trips/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold">My Trips</h2>
          <Badge variant="secondary" className="ml-2">
            {trips.length}
          </Badge>
        </div>
        <Button
          asChild
          size="sm"
          // className="bg-gradient-to-r from-primary-500 to-primary-600"
        >
          <Link to="/trips/new">
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        </Button>
      </div>

      {/* Trips Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <Card
            key={trip.id}
            className=" group shadow-lg border-0 h-full bg-card/95 backdrop-blur-sm hover:shadow-xl transition-ease overflow-hidden flex flex-col py-0 relative"
          >
            {/* Cover Image */}
            {trip.destinationImageUrl && (
              <div className="aspect-video w-full bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-xl overflow-hidden group-hover:scale-105 transition-ease">
                <img
                  src={
                    trip.destinationImageUrl
                      ? trip.destinationImageUrl
                      : `https://api.dicebear.com/9.x/glass/svg?seed=${trip.name}`
                  }
                  alt={trip.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Fixed Dropdown Menu - positioned over the image but outside scaling container */}
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 size-11 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors"
                  >
                    <Ellipsis className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleShareTrip(trip.id)}
                    disabled={shareTrip.isPending && selectedTripId === trip.id}
                  >
                    {shareTrip.isPending && selectedTripId === trip.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    Share Trip
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" asChild>
                    <Link
                      to="/trips/$tripId"
                      params={{ tripId: trip.id }}
                      className="cursor-pointer"
                    >
                      <Trash className="h-4 w-4" />
                      Delete Trip
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-bold line-clamp-2 flex-1">
                  {trip.name}
                </CardTitle>
                <div className="flex items-center space-x-2 ml-2">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(trip.status)}
                  >
                    {trip.status}
                  </Badge>
                </div>
              </div>

              {trip.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {trip.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-3 flex flex-col flex-1 pb-4">
              {/* Dates */}
              {(trip.startDate || trip.endDate) && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(trip.startDate)}
                    {trip.startDate && trip.endDate && " - "}
                    {formatDate(trip.endDate)}
                  </span>
                </div>
              )}

              {/* Budget */}
              {trip.totalBudget && (
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Budget: {formatCurrency(trip.totalBudget)}
                  </span>
                </div>
              )}

              {/* Trip Stops */}
              {trip.tripStopsCount > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {trip.tripStopsCount} stop
                    {trip.tripStopsCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 mt-auto">
                <Button
                  asChild
                  className="w-full cursor-pointer"
                  variant="outline"
                >
                  <Link to={`/trips/$tripId`} params={{ tripId: trip.id }}>
                    View Trip
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      <ShareTripDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
}

export function UserTripsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Trips Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="shadow-lg border-0 bg-card/95 backdrop-blur-sm"
          >
            <div className="aspect-video w-full bg-muted rounded-t-xl">
              <Skeleton className="w-full h-full rounded-t-xl" />
            </div>

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="w-4 h-4" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
