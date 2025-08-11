import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createPlace,
  updatePlace,
  deletePlace,
  reorderTripPlaces,
} from "~/server-functions/trip";

export function useCreatePlace() {
  const queryClient = useQueryClient();
  const createPlaceFn = useServerFn(createPlace);

  return useMutation({
    mutationFn: async (data: {
      tripItineraryId: number;
      placeId: string; // Google Place ID
      scheduledTime?: string; // HH:MM format
      userNotes?: string;
      visitDuration?: number; // in minutes
    }) => {
      return await createPlaceFn({ data });
    },
    onSuccess: () => {
      // Invalidate trip itinerary queries to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        type: "all",
      });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  const updatePlaceFn = useServerFn(updatePlace);

  return useMutation({
    mutationFn: async (data: {
      tripPlaceId: number; // ID of the tripPlaces record
      scheduledTime?: string;
      userNotes?: string;
      visitDuration?: number;
      isVisited?: boolean;
      userRating?: number; // 1-5 stars
      sortOrder?: number;
    }) => {
      return await updatePlaceFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        type: "all",
      });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  const deletePlaceFn = useServerFn(deletePlace);

  return useMutation({
    mutationFn: async (data: { tripPlaceId: number }) => {
      return await deletePlaceFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        type: "all",
      });
    },
  });
}

export function useReorderTripPlaces() {
  const queryClient = useQueryClient();
  const reorderFn = useServerFn(reorderTripPlaces);

  return useMutation({
    mutationFn: async (data: {
      tripItineraryId: number;
      orders: Array<{ tripPlaceId: number; sortOrder: number }>;
    }) => reorderFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"],
        type: "all",
      });
    },
  });
}
