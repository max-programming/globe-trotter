import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createPlace, updatePlace, deletePlace } from "~/server-functions/trip";

export function useCreatePlace() {
  const queryClient = useQueryClient();
  const createPlaceFn = useServerFn(createPlace);

  return useMutation({
    mutationFn: async (data: {
      tripItineraryId: number;
      name: string;
      type: string;
      description?: string;
      time?: string;
      notes?: string;
    }) => {
      return await createPlaceFn({ data });
    },
    onSuccess: () => {
      // Invalidate trip itinerary queries to refetch the updated data
      queryClient.invalidateQueries({ 
        queryKey: ["trips"],
        type: "all" 
      });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  const updatePlaceFn = useServerFn(updatePlace);

  return useMutation({
    mutationFn: async (data: {
      placeId: number;
      name?: string;
      type?: string;
      description?: string;
      time?: string;
      notes?: string;
    }) => {
      return await updatePlaceFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["trips"],
        type: "all" 
      });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  const deletePlaceFn = useServerFn(deletePlace);

  return useMutation({
    mutationFn: async (data: { placeId: number }) => {
      return await deletePlaceFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["trips"],
        type: "all" 
      });
    },
  });
}