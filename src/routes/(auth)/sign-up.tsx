import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "~/components/auth";

export const Route = createFileRoute("/(auth)/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return <SignUpForm />;
}
