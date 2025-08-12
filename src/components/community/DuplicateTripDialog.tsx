import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CommunityTrip } from "./CommunityTripCard";

interface DuplicateTripDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trip: CommunityTrip | null;
  onConfirm: (tripId: string, newTripName: string) => void;
  isPending?: boolean;
}

export function DuplicateTripDialog({
  isOpen,
  onOpenChange,
  trip,
  onConfirm,
  isPending = false,
}: DuplicateTripDialogProps) {
  const [tripName, setTripName] = useState("");

  // Reset trip name when dialog opens/closes or trip changes
  const handleOpenChange = (open: boolean) => {
    if (open && trip) {
      setTripName(`Copy of ${trip.name}`);
    } else {
      setTripName("");
    }
    onOpenChange(open);
  };

  const handleConfirm = () => {
    if (!trip || !tripName.trim()) return;
    onConfirm(trip.id, tripName.trim());
  };

  const isValid = tripName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="w-5 h-5" />
            <span>Save Trip to Your Collection</span>
          </DialogTitle>
          <DialogDescription>
            Save "{trip?.name}" to your personal trips. You can customize the name below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trip-name">Trip Name</Label>
            <Input
              id="trip-name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Enter trip name..."
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Trip Preview Info */}
          {trip && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Original Trip Details:</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Creator:</strong> {trip.user.name}</p>
                {trip.destinationName && (
                  <p><strong>Destination:</strong> {trip.destinationName}</p>
                )}
                {trip.tripStopsCount > 0 && (
                  <p><strong>Stops:</strong> {trip.tripStopsCount} location{trip.tripStopsCount !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>This will create a copy of the trip's itinerary in your personal collection. The original trip creator will not be notified.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Trip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}