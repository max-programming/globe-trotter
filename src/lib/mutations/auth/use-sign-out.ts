import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "~/server-functions/auth";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function useSignOut() {
  const signOutFn = useServerFn(signOut);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await signOutFn();
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await navigate({ to: "/sign-in" });
      router.invalidate();
    },
  });
}
