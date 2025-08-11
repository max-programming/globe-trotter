import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getTripWithStopsQuery } from "~/lib/queries/trips";
import { getCountriesQuery } from "~/lib/queries/countries-and-cities";
import { ItineraryBuilder } from "~/components/trips/ItineraryBuilder";

const tripIdSchema = z.object({
  tripId: z.string(),
});

export const Route = createFileRoute("/(protected)/trips/activities/$tripId")({
  head: () => ({ meta: [{ title: "Build Itinerary | Globe Trotter" }] }),
  params: {
    parse: (params) => tripIdSchema.parse(params),
    stringify: (params) => params,
  },
  loader: ({ context, params }) => {
    // Preload trip data and countries for stop creation
    context.queryClient.ensureQueryData(getTripWithStopsQuery(params.tripId));
    context.queryClient.ensureQueryData(getCountriesQuery);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { tripId } = Route.useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      <div className="relative min-h-screen px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <ItineraryBuilder tripId={tripId} />
        </div>
      </div>
    </div>
  );
}