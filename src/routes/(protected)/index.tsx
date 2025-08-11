import { createFileRoute, redirect } from "@tanstack/react-router";
import BannerSlider from "~/components/core/banner-slider";
import Search from "~/components/core/search";
import { Heading } from "~/components/generic/heading";
import SelectDropdown from "~/components/generic/select-dropdown";

const filterOptions = [
  { value: "draft", label: "Draft" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions = [
  { value: "all", label: "All" },
  { value: "science", label: "Science" },
  { value: "technology", label: "Technology" },
  { value: "engineering", label: "Engineering" },
  { value: "math", label: "Math" },
];

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
    </div>
  );
}
