import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { deleteTrip } from "~/server-functions/trip";

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  const deleteTripFn = useServerFn(deleteTrip);

  return useMutation({
    mutationFn: async (data: { tripId: string }) => {
      return await deleteTripFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete trip. Please try again.");
    },
  });
};
