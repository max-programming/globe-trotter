/// <reference types="vite/client" />
import { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "~/components/ui/sonner";
import { getSessionQuery } from "~/lib/queries/get-session-query";
import appCss from "~/styles/app.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(getSessionQuery);
    return { auth: session };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Globe Trotter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <div>
          {/* Background decorative elements */}
          {/* <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
          {/* <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
          <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" /> */}
          {/* <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" /> */}
          {children}
        </div>
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
