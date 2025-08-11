import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  generateRecommendations,
  markRecommendationAsViewed,
  dismissRecommendation,
  convertRecommendationToTrip,
} from "~/server-functions/recommendations";
import { useNavigate } from "@tanstack/react-router";

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generateRecommendations);

  return useMutation({
    mutationFn: () => generateFn({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: error => {
      console.error("Failed to generate recommendations:", error);
    },
  });
}

export function useMarkRecommendationViewed() {
  const queryClient = useQueryClient();
  const markViewedFn = useServerFn(markRecommendationAsViewed);

  return useMutation({
    mutationFn: (recommendationId: string) =>
      markViewedFn({ data: { recommendationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: error => {
      console.error("Failed to mark recommendation as viewed:", error);
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  const dismissFn = useServerFn(dismissRecommendation);

  return useMutation({
    mutationFn: (recommendationId: string) =>
      dismissFn({ data: { recommendationId } }),
    onMutate: async recommendationId => {
      // Optimistically remove from UI
      await queryClient.cancelQueries({ queryKey: ["recommendations"] });
      const previousRecs = queryClient.getQueryData(["recommendations"]);

      queryClient.setQueryData(
        ["recommendations"],
        (old: any) =>
          old?.filter((rec: any) => rec.id !== recommendationId) || []
      );

      return { previousRecs };
    },
    onError: (_error, _variables, context) => {
      console.error("Failed to dismiss recommendation:", _error);
      // Revert optimistic update
      if (context?.previousRecs) {
        queryClient.setQueryData(["recommendations"], context.previousRecs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useConvertRecommendationToTrip() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const convertFn = useServerFn(convertRecommendationToTrip);

  return useMutation({
    mutationFn: (data: {
      recommendationId: string;
      startDate: Date;
      endDate: Date;
      visibility: "private" | "public";
    }) => convertFn({ data }),
    onSuccess: trip => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      navigate({ to: `/trips/${trip.id}` });
    },
    onError: error => {
      console.error("Failed to convert recommendation to trip:", error);
    },
  });
}
