import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateTripNotes } from "~/server-functions/trip";

export function useUpdateTripNotes() {
  const queryClient = useQueryClient();
  const updateTripNotesFn = useServerFn(updateTripNotes);

  return useMutation({
    mutationFn: async (data: { tripId: string; notes: string }) => {
      return await updateTripNotesFn({ data });
    },
    onSuccess: (data, variables) => {
      // Invalidate trip queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["trips", "itinerary", variables.tripId],
      });
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        type: "all",
      });
    },
  });
}