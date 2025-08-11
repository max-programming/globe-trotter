import { queryOptions } from "@tanstack/react-query";
import { getTripWithItinerary } from "~/server-functions/trip";

export function getTripWithItineraryQuery(tripId: string) {
  return queryOptions({
    queryKey: ["trips", tripId, "itinerary"] as const,
    queryFn: () => getTripWithItinerary({ data: { tripId } }),
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