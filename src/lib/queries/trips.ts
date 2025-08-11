import { queryOptions } from "@tanstack/react-query";
import { getUserTripsFn } from "~/server-functions/trips";

export const getUserTripsQuery = queryOptions({
  queryKey: ["trips", "user"],
  queryFn: getUserTripsFn,
});
