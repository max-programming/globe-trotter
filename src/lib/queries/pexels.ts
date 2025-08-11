import { queryOptions } from "@tanstack/react-query";
import {
  searchPexelsImage,
  searchPexelsImages,
} from "~/server-functions/pexels";

export const getPexelsImageQuery = (query: string) =>
  queryOptions({
    queryKey: ["pexels", "search", query] as const,
    queryFn: () => searchPexelsImage({ data: { query } }),
    enabled: !!query,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

export const getPexelsImagesQuery = (query: string, perPage: number) =>
  queryOptions({
    queryKey: ["pexels", "search", query, perPage] as const,
    queryFn: () => searchPexelsImages({ data: { query, perPage } }),
    enabled: !!query,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
