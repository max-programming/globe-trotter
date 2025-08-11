import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { signUp } from "~/server-functions/auth";
import type { SignUpFormData } from "~/components/auth";
import type { UseFormReturn } from "react-hook-form";
import { useAuthOptions } from "./use-auth-options";

export function useSignUp(form: UseFormReturn<SignUpFormData>) {
  const signUpFn = useServerFn(signUp);
  const authOptions = useAuthOptions(form);

  return useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const response = await signUpFn({ data });
      return response;
    },
    ...authOptions,
  });
}
