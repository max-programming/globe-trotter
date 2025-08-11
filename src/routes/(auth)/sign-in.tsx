import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "~/components/auth";

export const Route = createFileRoute("/(auth)/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return <SignInForm />;
}
