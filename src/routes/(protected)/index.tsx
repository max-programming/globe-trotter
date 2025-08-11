import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import BannerSlider from "~/components/core/banner-slider";
import Search from "~/components/core/search";
import { Heading } from "~/components/generic/heading";
import SelectDropdown from "~/components/generic/select-dropdown";
import { Button } from "~/components/ui/button";
import { tripStatuses } from "~/lib/db/schema/constants";

const sortOptions = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
];
const filterOptions = tripStatuses.map((status) => ({
  value: status,
  label: status,
}));

export const Route = createFileRoute("/(protected)/")({
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
    <div className="space-y-10">
      <BannerSlider />
      <div className="container px-4 mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Search className="w-full" />
            <div className="flex items-center gap-4">
              <SelectDropdown options={filterOptions} placeholder="filter" />
              <SelectDropdown options={sortOptions} placeholder="sort by" />
            </div>
          </div>
          <Heading>Discover Amazing Destinations</Heading>
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
