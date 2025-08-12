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
    <Card className="relative overflow-hidden rounded-xl border ring-1 ring-border/50 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group">
      {/* Background image if available */}
      {recommendation.destinationImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 transition-opacity group-hover:opacity-20"
          style={{
            backgroundImage: `url(${recommendation.destinationImageUrl})`,
          }}
        />
      )}
      {recommendation.destinationImageUrl && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/80" />
      )}

      {/* Dismiss button */}
      {showDismissButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 bg-background/70 hover:bg-background/90 backdrop-blur rounded-full"
          onClick={(e) => {
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
        className="relative z-10 block"
        aria-label={`View details for ${recommendation.name}`}
      >
        <CardHeader className="space-y-2 px-5 pt-5 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="truncate">{recommendation.name}</span>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {recommendation.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {recommendation.tripType && (
              <Badge
                variant="secondary"
                className="capitalize px-2.5 py-1 text-[11px]"
              >
                {recommendation.tripType}
              </Badge>
            )}
            {recommendation.suggestedSeason && (
              <Badge
                variant="outline"
                className="capitalize px-2.5 py-1 text-[11px]"
              >
                {recommendation.suggestedSeason}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {recommendation.suggestedDuration && (
              <div className="flex items-center gap-2 text-foreground/90">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{recommendation.suggestedDuration} days</span>
              </div>
            )}
            {recommendation.suggestedBudget && (
              <div className="flex items-center justify-end gap-2 text-foreground/90">
                <span className="font-semibold">
                  {formatCurrency(recommendation.suggestedBudget, {
                    currency:
                      (auth?.currencySign as string | undefined) ?? "USD",
                  })}
                </span>
              </div>
            )}
          </div>

          {recommendation.activities &&
            recommendation.activities.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Suggested activities
                </h4>
                <div className="space-y-1">
                  {recommendation.activities
                    .slice(0, 3)
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground"
                      >
                        <span className="font-medium text-primary">
                          Day {activity.suggestedDay || 1}:
                        </span>{" "}
                        {activity.name}
                      </div>
                    ))}
                  {recommendation.activities.length > 3 && (
                    <div className="text-sm italic text-muted-foreground">
                      +{recommendation.activities.length - 3} more activities
                    </div>
                  )}
                </div>
              </div>
            )}
        </CardContent>

        <CardFooter className="px-5 py-4 border-t bg-background/40">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-muted-foreground">View details</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
