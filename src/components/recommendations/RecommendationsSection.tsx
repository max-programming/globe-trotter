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
    <section className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Recommended Trips
          </h2>
          <p className="text-muted-foreground mt-1">
            Personalized suggestions just for you
          </p>
        </div>

        {showGenerateButton && (
          <Button
            onClick={handleGenerateRecommendations}
            disabled={generateMutation.isPending}
            variant="outline"
            size="sm"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get New Ideas
              </>
            )}
          </Button>
        )}
      </div>

      {isLoading ? (
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
      ) : displayRecommendations.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate personalized trip recommendations based on your travel
            history
          </p>
          {showGenerateButton && (
            <Button onClick={handleGenerateRecommendations} size="lg">
              <Sparkles className="w-5 h-5" />
              Get My First Recommendations
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecommendations.map(recommendation => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onDismiss={handleDismissRecommendation}
              />
            ))}
          </div>

          {recommendations && recommendations.length > maxItems && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
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
