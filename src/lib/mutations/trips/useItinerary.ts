import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateItineraryNotes } from "~/server-functions/trip";

export function useUpdateItineraryNotes() {
  const queryClient = useQueryClient();
  const updateItineraryNotesFn = useServerFn(updateItineraryNotes);

  return useMutation({
    mutationFn: async (data: {
      itineraryId: number;
      notes?: string;
    }) => {
      return await updateItineraryNotesFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["trips"],
        type: "all" 
      });
    },
  });
}