import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateProfile } from "~/server-functions/profile";
import type { ProfileUpdateFormData } from "~/components/settings/profile-schemas";
import type { UseFormReturn } from "react-hook-form";
import { getCurrentUserQuery } from "~/lib/queries/profile";

export function useUpdateProfile(form: UseFormReturn<ProfileUpdateFormData>) {
  const updateProfileFn = useServerFn(updateProfile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateFormData) => {
      const response = await updateProfileFn({ data });
      return response;
    },
    onSuccess: () => {
      // Invalidate user queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: getCurrentUserQuery.queryKey });

      // Clear form errors
      form.clearErrors();
    },
    onError: (error: any) => {
      // Handle server errors
      if (error?.message) {
        form.setError("root", {
          type: "manual",
          message: error.message,
        });
      } else {
        form.setError("root", {
          type: "manual",
          message: "Failed to update profile. Please try again.",
        });
      }
    },
  });
}
