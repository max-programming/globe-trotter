import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { duplicateTrip } from "~/server-functions/community";

export function useDuplicateTrip() {
  const duplicateTripFn = useServerFn<typeof duplicateTrip>(duplicateTrip);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: { tripId: string; newTripName?: string }) => {
      return duplicateTripFn({ data });
    },
    onSuccess: (result) => {
      // Invalidate user trips to show the new trip
      queryClient.invalidateQueries({ queryKey: ["trips", "user"] });

      // Show success toast
      toast.success(result.message || "Trip saved successfully!", {
        action: {
          label: "View Trip",
          onClick: () => navigate({ to: `/trips/${result.tripId}` }),
        },
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast.error(error.message || "Failed to save trip. Please try again.");
    },
  });
}
