import { queryOptions, useInfiniteQuery } from "@tanstack/react-query";
import {
  getPublicTrips,
  PublicTripsParams,
} from "~/server-functions/community";

export function getPublicTripsQuery(params: PublicTripsParams = {}) {
  return queryOptions({
    queryKey: ["community", "trips", params] as const,
    queryFn: () => getPublicTrips({ data: params as any }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useInfinitePublicTrips(
  params: Omit<PublicTripsParams, "page"> = {}
) {
  return useInfiniteQuery({
    queryKey: ["community", "trips", "infinite", params] as const,
    queryFn: ({ pageParam = 1 }) =>
      getPublicTrips({ data: { ...params, page: pageParam as number } as any }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
