import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { signIn } from "~/server-functions/auth";
import { useAuthOptions } from "./use-auth-options";
import type { SignInFormData } from "~/components/auth";
import type { UseFormReturn } from "react-hook-form";

export function useSignIn(form: UseFormReturn<SignInFormData>) {
  const signInFn = useServerFn(signIn);
  const authOptions = useAuthOptions(form);

  return useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await signInFn({ data });
      return response;
    },
    ...authOptions,
  });
}
