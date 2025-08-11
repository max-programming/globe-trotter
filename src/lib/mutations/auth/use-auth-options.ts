import { mutationOptions, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { UseFormReturn } from "react-hook-form";
import type { SignInFormData, SignUpFormData } from "~/components/auth";

// Common mutation options for auth mutations
export function useAuthOptions<T extends SignUpFormData | SignInFormData>(
  form: UseFormReturn<T>
) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return mutationOptions<void, Error, T>({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate({ to: "/" });
    },
    onError: error => {
      if (error instanceof Error) {
        form.setError("root", {
          message: error.message,
        });
      }
    },
  });
}
