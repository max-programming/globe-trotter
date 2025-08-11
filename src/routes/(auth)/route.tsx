import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthLayout } from "~/components/auth";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: ({ context }) => {
    if (!!context.auth) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});
