import { createFileRoute, Link, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Home | Globe Trotter" }],
  }),
  beforeLoad: ({ context }) => {
    if (!context.auth) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

function HomePage() {
  return (
    <div>
      <Link to="/sign-in">Sign in</Link>
      <br />
      <Link to="/sign-up">Sign up</Link>
    </div>
  );
}
