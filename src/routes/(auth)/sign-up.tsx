import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "~/components/auth";

export const Route = createFileRoute("/(auth)/sign-up")({
  component: SignUpPage,
  head: () => ({
    meta: [{ title: "Sign up | Globe Trotter" }],
  }),
});

function SignUpPage() {
  return <SignUpForm />;
}
