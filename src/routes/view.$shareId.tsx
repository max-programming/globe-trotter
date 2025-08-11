import { createFileRoute } from "@tanstack/react-router";
import { getTripWithItineraryByShareIdQuery } from "~/lib/queries/trips";
import { SharedTripPage } from "~/components/trips/SharedTripPage";
import { SharedTripSkeleton } from "~/components/trips/SharedTripSkeleton";

export const Route = createFileRoute("/view/$shareId")({
  component: TripViewSharePage,
  pendingComponent: SharedTripSkeleton,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getTripWithItineraryByShareIdQuery(params.shareId)
    );
  },
});

function TripViewSharePage() {
  const { shareId } = Route.useParams();
  return <SharedTripPage shareId={shareId} />;
}
