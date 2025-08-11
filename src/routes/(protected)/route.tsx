import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Header } from "~/components/generic/header";

export const Route = createFileRoute("/(protected)")({
  beforeLoad: ({ context }) => {
    if (!context.auth) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
