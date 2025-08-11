import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { MapPin, Calendar, X, Sparkles, ArrowRight } from "lucide-react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { formatCurrency } from "~/lib/utils/currency";

interface RecommendationActivity {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  suggestedDay: number | null;
  estimatedDuration: number | null;
  estimatedCost: number | null;
  placeName: string | null;
  sortOrder: number | null;
}

interface RecommendationCardProps {
  recommendation: {
    id: string;
    name: string;
    description: string;
    destinationName: string;
    suggestedDuration: number | null;
    suggestedBudget: number | null;
    suggestedSeason: string | null;
    tripType: string | null;
    destinationImageUrl: string | null;
    activities: RecommendationActivity[];
  };
  onDismiss: (id: string) => void;
  showDismissButton?: boolean;
}

export function RecommendationCard({
  recommendation,
  onDismiss,
  showDismissButton = true,
}: RecommendationCardProps) {
  const { auth } = useRouteContext({
    from: "/(protected)/",
  });

  return (
    <Card className="hover:shadow-lg transition-all duration-200 relative group overflow-hidden">
      {/* Background image if available */}
      {recommendation.destinationImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity"
          style={{
            backgroundImage: `url(${recommendation.destinationImageUrl})`,
          }}
        />
      )}

      {/* Dismiss button */}
      {showDismissButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => {
            e.stopPropagation();
            onDismiss(recommendation.id);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <Link
        to="/recommendations/$recommendationId"
        params={{ recommendationId: recommendation.id }}
        className="block relative z-10"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {recommendation.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {recommendation.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {recommendation.tripType && (
              <Badge variant="secondary" className="capitalize">
                {recommendation.tripType}
              </Badge>
            )}
            {recommendation.suggestedSeason && (
              <Badge variant="outline" className="capitalize">
                {recommendation.suggestedSeason}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {recommendation.suggestedDuration && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{recommendation.suggestedDuration} days</span>
              </div>
            )}
            {recommendation.suggestedBudget && (
              <div className="flex items-center gap-2">
                {/* <DollarSign className="w-4 h-4 text-muted-foreground" /> */}
                <span>
                  {formatCurrency(recommendation.suggestedBudget, {
                    currency: auth.currencySign || "USD",
                  })}
                </span>
              </div>
            )}
          </div>

          {recommendation.activities &&
            recommendation.activities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Suggested Activities:
                </h4>
                <div className="space-y-1">
                  {recommendation.activities
                    .slice(0, 3)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground"
                      >
                        <span className="text-primary font-medium">
                          Day {activity.suggestedDay || 1}:
                        </span>{" "}
                        {activity.name}
                      </div>
                    ))}
                  {recommendation.activities.length > 3 && (
                    <div className="text-sm text-muted-foreground italic">
                      +{recommendation.activities.length - 3} more activities
                    </div>
                  )}
                </div>
              </div>
            )}
        </CardContent>

        <CardFooter>
          <div className="w-full flex items-center justify-between">
            <span className="text-sm text-muted-foreground">View details</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
