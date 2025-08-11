import { queryOptions } from "@tanstack/react-query";
import {
  getRecommendations,
  getRecommendation,
} from "~/server-functions/recommendations";

export const getRecommendationsQuery = () =>
  queryOptions({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests twice
  });

export const getRecommendationQuery = (recommendationId: string) =>
  queryOptions({
    queryKey: ["recommendations", recommendationId],
    queryFn: () => getRecommendation({ data: { recommendationId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests twice
  });
