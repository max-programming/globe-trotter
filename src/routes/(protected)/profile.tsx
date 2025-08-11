import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return <div>Hello "/(protected)/profile"!</div>;
}
