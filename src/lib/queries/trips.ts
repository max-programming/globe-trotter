import { queryOptions } from "@tanstack/react-query";
import { getTripWithStops } from "~/server-functions/trip";

export function getTripWithStopsQuery(tripId: string) {
  return queryOptions({
    queryKey: ["trips", tripId, "stops"] as const,
    queryFn: () => getTripWithStops({ data: { tripId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}