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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full">
        <Suspense fallback={<ProfileFormSkeleton />}>
          <ProfileForm />
        </Suspense>
      </div>
    </div>
  );
}
