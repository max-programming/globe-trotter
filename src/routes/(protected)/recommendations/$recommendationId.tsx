import { createFileRoute } from "@tanstack/react-router";
import { RecommendationDetailPage } from "~/components/recommendations/RecommendationDetailPage";
import { getRecommendationQuery } from "~/lib/queries/recommendations";

export const Route = createFileRoute(
  "/(protected)/recommendations/$recommendationId"
)({
  component: RecommendationDetailComponent,
  head: () => ({
    meta: [{ title: "Trip Recommendation | Globe Trotter" }],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      getRecommendationQuery(params.recommendationId)
    );
  },
});

function RecommendationDetailComponent() {
  const { recommendationId } = Route.useParams();

  return <RecommendationDetailPage recommendationId={recommendationId} />;
}
