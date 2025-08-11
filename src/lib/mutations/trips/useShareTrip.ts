import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTripShare } from "~/server-functions/trip";

export function useShareTrip() {
  const createTripShareFn = useServerFn(createTripShare);

  return useMutation({
    mutationFn: async (data: { tripId: string }) => {
      return await createTripShareFn({ data });
    },
  });
}
