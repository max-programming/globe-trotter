import { queryOptions } from "@tanstack/react-query";
import {
  getTripWithItinerary,
  getTripWithItineraryByShareId,
} from "~/server-functions/trip";

export function getTripWithItineraryQuery(tripId: string) {
  return queryOptions({
    queryKey: ["trips", tripId, "itinerary"] as const,
    queryFn: () => getTripWithItinerary({ data: { tripId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function getTripWithItineraryByShareIdQuery(shareId: string) {
  return queryOptions({
    queryKey: ["trips", "share", shareId, "itinerary"] as const,
    queryFn: () => getTripWithItineraryByShareId({ data: { shareId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Keep the old query for backward compatibility during transition
export function getTripWithStopsQuery(tripId: string) {
  return queryOptions({
    queryKey: ["trips", tripId, "stops"] as const,
    queryFn: () => getTripWithItinerary({ data: { tripId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
import { getUserTripsFn } from "~/server-functions/trips";

export const getUserTripsQuery = queryOptions({
  queryKey: ["trips", "user"],
  queryFn: getUserTripsFn,
});
