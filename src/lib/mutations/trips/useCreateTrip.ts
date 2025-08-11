import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createTrip } from "~/server-functions/trip";
import { type CreateTripFormData } from "~/components/trips/trip-schema";
import { type UseFormReturn } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

export function useCreateTrip(form: UseFormReturn<CreateTripFormData>) {
  const queryClient = useQueryClient();
  const createTripFn = useServerFn(createTrip);

  return useMutation({
    mutationFn: async (data: CreateTripFormData) => {
      return await createTripFn({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      form.reset();
    },
    onError: (error: Error) => {
      form.setError("root", {
        type: "manual",
        message: error?.message || "Failed to create trip. Please try again.",
      });
    },
  });
}
