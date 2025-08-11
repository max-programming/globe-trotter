import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import {
  ProfileForm,
  ProfileFormSkeleton,
} from "~/components/settings/profile-form";
import { getCurrentUserQuery } from "~/lib/queries/profile";

export const Route = createFileRoute("/(protected)/settings/profile")({
  component: SettingsProfilePage,
  head: () => ({
    meta: [{ title: "Profile Settings | Globe Trotter" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(getCurrentUserQuery);
  },
});

function SettingsProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full">
          <Suspense fallback={<ProfileFormSkeleton />}>
            <ProfileForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
