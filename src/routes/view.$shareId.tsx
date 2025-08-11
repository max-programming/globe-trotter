import { createFileRoute } from "@tanstack/react-router";
import { getTripWithItineraryByShareIdQuery } from "~/lib/queries/trips";

export const Route = createFileRoute("/view/$shareId")({
  component: TripViewSharePage,
  pendingComponent: () => <div>Loading...</div>,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getTripWithItineraryByShareIdQuery(params.shareId)
    );
  },
});

function TripViewSharePage() {
  return <div>Hello "/view/$shareId"!</div>;
}
