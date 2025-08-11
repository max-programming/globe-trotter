import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTripStop, updateTripStop, deleteTripStop } from "~/server-functions/trip";

export function useCreateTripStop() {
  const queryClient = useQueryClient();
  const createTripStopFn = useServerFn(createTripStop);

  return useMutation({
    mutationFn: async (data: Parameters<typeof createTripStopFn>[0]["data"]) => {
      return await createTripStopFn({ data });
    },
    onSuccess: (newStop) => {
      queryClient.invalidateQueries({ 
        queryKey: ["trips", newStop.tripId, "stops"] 
      });
    },
  });
}

export function useUpdateTripStop() {
  const queryClient = useQueryClient();
  const updateTripStopFn = useServerFn(updateTripStop);

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateTripStopFn>[0]["data"]) => {
      return await updateTripStopFn({ data });
    },
    onSuccess: (updatedStop) => {
      queryClient.invalidateQueries({ 
        queryKey: ["trips", updatedStop.tripId, "stops"] 
      });
    },
  });
}

export function useDeleteTripStop() {
  const queryClient = useQueryClient();
  const deleteTripStopFn = useServerFn(deleteTripStop);

  return useMutation({
    mutationFn: async (data: Parameters<typeof deleteTripStopFn>[0]["data"]) => {
      return await deleteTripStopFn({ data });
    },
    onSuccess: (_, variables) => {
      // Invalidate all trip stops queries since we don't have tripId in response
      queryClient.invalidateQueries({ 
        queryKey: ["trips"], 
        predicate: (query) => query.queryKey.includes("stops")
      });
    },
  });
}