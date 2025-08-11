import { queryOptions } from "@tanstack/react-query";
import { searchPexelsImages } from "~/server-functions/pexels";

export const getPexelsImageQuery = (query: string) =>
  queryOptions({
    queryKey: ["pexels", "search", query] as const,
    queryFn: () => searchPexelsImages({ data: { query } }),
    enabled: !!query,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
