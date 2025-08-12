import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import BannerSlider from "~/components/core/banner-slider";
import { Heading } from "~/components/generic/heading";
import {
  RecommendationsSection,
  RecommendationsSectionSkeleton,
} from "~/components/recommendations/RecommendationsSection";
import { getRecommendationsQuery } from "~/lib/queries/recommendations";
import { getCurrentUserQuery } from "~/lib/queries/profile";
import { getUserTripsQuery } from "~/lib/queries/trips";
import { Button } from "~/components/ui/button";
import { Suspense, useState } from "react";
import {
  FilterableUserTripsDisplay,
  FilterableUserTripsSkeleton,
} from "~/components/trips/FilterableUserTripsDisplay";

export const Route = createFileRoute("/(protected)/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Home | Globe Trotter" }],
  }),
  loader: ({ context }) => {
    // Prefetch user, trips, and recommendations data
    context.queryClient.prefetchQuery(getCurrentUserQuery);
    context.queryClient.prefetchQuery(getUserTripsQuery);
    context.queryClient.prefetchQuery(getRecommendationsQuery());
  },
  beforeLoad: ({ context }) => {
    if (!context.auth) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  return (
    <div className="space-y-10">
      <BannerSlider />
      <div className="container px-4 mx-auto">
        <div className="space-y-10">
          {/* User Trips Section */}
          <div className="space-y-6">
            <Suspense fallback={<FilterableUserTripsSkeleton />}>
              <FilterableUserTripsDisplay
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                sortBy={sortBy}
                onSearchChange={setSearchQuery}
                onFilterChange={setFilterStatus}
                onSortChange={setSortBy}
                showControls={true}
              />
            </Suspense>
          </div>

          {/* Recommendations Section */}
          <div className="space-y-6">
            <Heading>Discover Amazing Destinations</Heading>
            <div className="mb-5">
              <Suspense fallback={<RecommendationsSectionSkeleton />}>
                <RecommendationsSection maxItems={3} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Create New Trip Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          asChild
          variant="default"
          size="lg"
          className="shadow-lg px-8 py-3"
        >
          <Link to="/trips/new">
            <Plus className="w-4 h-4" /> Plan a Trip
          </Link>
        </Button>
      </div>
    </div>
  );
}
