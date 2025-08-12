import { useState } from "react";
import { Search, Filter, SortAsc } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CommunityTripCard, CommunityTrip } from "./CommunityTripCard";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";

interface CommunityTripListProps {
  trips: CommunityTrip[];
  isLoading?: boolean;
  error?: Error | null;
  onSaveTrip: (tripId: string) => void;
  onViewTrip: (trip: CommunityTrip) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  isSaving?: boolean;
}

export function CommunityTripList({
  trips,
  isLoading = false,
  error = null,
  onSaveTrip,
  onViewTrip,
  onLoadMore,
  hasNextPage = false,
  isLoadingMore = false,
  isSaving = false,
}: CommunityTripListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Filter trips based on search query
  const filteredTrips = trips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destinationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "name":
        return a.name.localeCompare(b.name);
      case "destination":
        return (a.destinationName || "").localeCompare(b.destinationName || "");
      default:
        return 0;
    }
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load community trips. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trips, destinations, or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="destination">Destination</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          {searchQuery ? (
            <>
              Showing {sortedTrips.length} result
              {sortedTrips.length !== 1 ? "s" : ""} for "{searchQuery}"
            </>
          ) : (
            <>
              Showing {sortedTrips.length} public trip
              {sortedTrips.length !== 1 ? "s" : ""}
            </>
          )}
        </div>
      )}

      {/* Trip Grid */}
      {isLoading ? (
        <CommunityTripListSkeleton />
      ) : sortedTrips.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No trips found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `No trips match "${searchQuery}". Try adjusting your search.`
                : "No public trips are available yet. Be the first to share a trip!"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {sortedTrips.map((trip) => (
              <CommunityTripCard
                key={trip.id}
                trip={trip}
                onSaveTrip={onSaveTrip}
                onViewTrip={onViewTrip}
                isSaving={isSaving}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-8">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                size="lg"
              >
                {isLoadingMore ? "Loading..." : "Load More Trips"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CommunityTripListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Controls skeleton */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Skeleton for full-width cards */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="w-full overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Image skeleton */}
                <Skeleton className="w-full md:w-80 h-48 md:h-auto" />

                {/* Content skeleton */}
                <div className="flex-1 p-6 space-y-4">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>

                  {/* Itinerary skeleton */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Skeleton key={j} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  </div>

                  {/* Actions skeleton */}
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
