import { useState } from "react";
import { Users, Globe, TrendingUp } from "lucide-react";
import { Heading } from "~/components/generic/heading";
import { CommunityTripList } from "./CommunityTripList";
import { DuplicateTripDialog } from "./DuplicateTripDialog";
import { TripTimelineModal } from "./TripTimelineModal";
import { CommunityTrip } from "./CommunityTripCard";
import { useInfinitePublicTrips } from "~/lib/queries/community";
import { useDuplicateTrip } from "~/lib/mutations/trips/useDuplicateTrip";

export function CommunityPage() {
  const [selectedTrip, setSelectedTrip] = useState<CommunityTrip | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [viewTripDialogOpen, setViewTripDialogOpen] = useState(false);

  // Fetch public trips with infinite loading
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePublicTrips();

  // Duplicate trip mutation
  const { mutate: duplicateTrip, isPending: isDuplicating } =
    useDuplicateTrip();

  // Flatten and normalize trips from all pages to match CommunityTrip
  const allTrips: CommunityTrip[] = (
    data?.pages.flatMap((page) => page.trips) || []
  ).map((t) => ({
    ...t,
    shareToken: (t as any).shareToken ?? null,
    createdAt: new Date(t.createdAt as any),
    startDate: t.startDate ? new Date(t.startDate as any) : null,
    endDate: t.endDate ? new Date(t.endDate as any) : null,
    user: {
      ...t.user,
      image: t.user.image ?? null,
    },
    place: t.place
      ? {
          latitude: t.place.latitude ?? null,
          longitude: t.place.longitude ?? null,
        }
      : null,
    itinerary: t.itinerary
      ? t.itinerary.map((d) => ({
          ...d,
          date: new Date(d.date as any),
        }))
      : undefined,
  }));

  const handleSaveTrip = (tripId: string) => {
    const trip = allTrips.find((t) => t.id === tripId);
    if (trip) {
      setSelectedTrip(trip);
      setDuplicateDialogOpen(true);
    }
  };

  const handleViewTrip = (trip: CommunityTrip) => {
    setSelectedTrip(trip);
    setViewTripDialogOpen(true);
  };

  const handleConfirmDuplicate = (tripId: string, newTripName: string) => {
    duplicateTrip(
      { tripId, newTripName },
      {
        onSuccess: () => {
          setDuplicateDialogOpen(false);
          setSelectedTrip(null);
        },
      }
    );
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-6 mb-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Heading className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Community Trips
            </Heading>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing travel experiences shared by fellow travelers.
              Get inspired and save trips to your collection.
            </p>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && data && (
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>{allTrips.length} public trips</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Updated daily</span>
            </div>
          </div>
        )}
      </div>

      {/* Trip List */}
      <CommunityTripList
        trips={allTrips}
        isLoading={isLoading}
        error={error}
        onSaveTrip={handleSaveTrip}
        onViewTrip={handleViewTrip}
        onLoadMore={handleLoadMore}
        hasNextPage={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        isSaving={isDuplicating}
      />

      {/* Duplicate Trip Dialog */}
      <DuplicateTripDialog
        isOpen={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        trip={selectedTrip}
        onConfirm={handleConfirmDuplicate}
        isPending={isDuplicating}
      />

      {/* Trip Timeline Modal */}
      <TripTimelineModal
        isOpen={viewTripDialogOpen}
        onOpenChange={setViewTripDialogOpen}
        trip={selectedTrip}
        onSaveTrip={handleSaveTrip}
        isSaving={isDuplicating}
      />
    </div>
  );
}
