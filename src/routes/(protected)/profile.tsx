import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import {
  UserProfileDisplay,
  UserProfileSkeleton,
} from "~/components/profile/user-profile-display";
import { getCurrentUserQuery } from "~/lib/queries/profile";

export const Route = createFileRoute("/(protected)/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile | Globe Trotter" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(getCurrentUserQuery);
  },
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      {/* Content */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="w-full">
          <Suspense fallback={<UserProfileSkeleton />}>
            <UserProfileDisplay />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
