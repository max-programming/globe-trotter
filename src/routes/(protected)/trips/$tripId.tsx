import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getTripWithItineraryQuery } from "~/lib/queries/trips";
import { TripPlannerPage } from "~/components/trips/TripPlannerPage";

const tripIdSchema = z.object({
  tripId: z.string(),
});

export const Route = createFileRoute("/(protected)/trips/$tripId")({
  head: () => ({ meta: [{ title: "Trip Planner | Globe Trotter" }] }),
  params: {
    parse: (params) => tripIdSchema.parse(params),
    stringify: (params) => params,
  },
  loader: ({ context, params }) => {
    // Preload trip itinerary data
    context.queryClient.ensureQueryData(getTripWithItineraryQuery(params.tripId));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tripId } = Route.useParams();

  return <TripPlannerPage tripId={tripId} />;
}