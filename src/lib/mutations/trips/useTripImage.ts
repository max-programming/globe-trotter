import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateTripImage } from "~/server-functions/trip";

export function useUpdateTripImage() {
  const queryClient = useQueryClient();
  const updateTripImageFn = useServerFn(updateTripImage);

  return useMutation({
    mutationFn: async (data: { tripId: string; imageUrl: string }) => {
      return await updateTripImageFn({ data });
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
