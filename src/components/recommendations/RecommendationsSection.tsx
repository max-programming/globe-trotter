import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RecommendationCard } from "./RecommendationCard";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Sparkles, RefreshCw, MapPin, Settings } from "lucide-react";
import { getRecommendationsQuery } from "~/lib/queries/recommendations";
import { getCurrentUserQuery } from "~/lib/queries/profile";
import {
  useGenerateRecommendations,
  useDismissRecommendation,
} from "~/lib/mutations/recommendations";

interface RecommendationsSectionProps {
  showGenerateButton?: boolean;
  maxItems?: number;
  className?: string;
}

export function RecommendationsSection({
  showGenerateButton = true,
  maxItems = 6,
  className = "",
}: RecommendationsSectionProps) {
  // Get current user to check if they have country set
  const { data: currentUser } = useSuspenseQuery(getCurrentUserQuery);

  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery(getRecommendationsQuery());
  const [isExpanded, setIsExpanded] = useState(false);

  const generateMutation = useGenerateRecommendations();
  const dismissMutation = useDismissRecommendation();

  const handleGenerateRecommendations = () => {
    generateMutation.mutate();
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    dismissMutation.mutate(recommendationId);
  };

  // Check if user has country set, if not show profile completion message
  if (!currentUser?.countryId) {
    return (
      <section className={className}>
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-border/50">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            To get personalized trip recommendations, please add your country to
            your profile. This helps us suggest destinations that are perfect
            for you!
          </p>
          <Button asChild size="lg">
            <Link to="/settings/profile">
              <Settings className="w-5 h-5" />
              Update Profile
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={className}>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Unable to load recommendations
          </h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your trip recommendations
          </p>
          {showGenerateButton && (
            <Button onClick={handleGenerateRecommendations} variant="outline">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </section>
    );
  }

  const displayRecommendations =
    recommendations?.slice(0, isExpanded ? recommendations.length : maxItems) ||
    [];

  return (
    <section
      className={className}
      aria-busy={isLoading || generateMutation.isPending}
      aria-live="polite"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/50">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Smart suggestions</span>
            {Boolean(recommendations?.length) && (
              <span className="ml-1 inline-flex items-center rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-foreground ring-1 ring-border/70">
                {recommendations?.length} ideas
              </span>
            )}
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Recommended Trips
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fresh destinations tailored to your profile and travel history
          </p>
        </div>

        {showGenerateButton && (
          <Button
            onClick={handleGenerateRecommendations}
            disabled={generateMutation.isPending}
            variant="default"
            size="sm"
            className="shadow-sm hover:shadow transition-shadow"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get New Ideas
              </>
            )}
          </Button>
        )}
      </div>

      {isLoading || generateMutation.isPending ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(maxItems, 6) }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayRecommendations.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 px-6 py-12 text-center">
          <Sparkles className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No recommendations yet</h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Generate personalized trip recommendations based on your travel
            history and preferences.
          </p>
          {showGenerateButton && (
            <Button
              onClick={handleGenerateRecommendations}
              size="lg"
              className="shadow-sm"
            >
              <Sparkles className="h-5 w-5" />
              Get My First Recommendations
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayRecommendations.map((recommendation, idx) => (
              <div
                key={recommendation.id}
                className="group transform transition duration-200 ease-out hover:-translate-y-0.5"
                style={{ transitionDelay: `${Math.min(idx, 6) * 25}ms` }}
              >
                <RecommendationCard
                  recommendation={recommendation}
                  onDismiss={handleDismissRecommendation}
                />
              </div>
            ))}
          </div>

          {recommendations && recommendations.length > maxItems && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-full"
              >
                {isExpanded
                  ? `Show Less`
                  : `Show ${recommendations.length - maxItems} More`}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function RecommendationsSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
