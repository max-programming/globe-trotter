import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type DateRange } from "react-day-picker";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "~/components/ui/calendar";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Globe,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { formatCurrency } from "~/lib/utils/currency";
import { useRouteContext } from "@tanstack/react-router";

import { getRecommendationQuery } from "~/lib/queries/recommendations";
import {
  useMarkRecommendationViewed,
  useConvertRecommendationToTrip,
} from "~/lib/mutations/recommendations";

interface RecommendationDetailPageProps {
  recommendationId: string;
}

const createTripSchema = z
  .object({
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
    visibility: z.enum(["private", "public"]),
  })
  .refine(
    data => {
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before start date" }
  );

type CreateTripFormData = z.infer<typeof createTripSchema>;

export function RecommendationDetailPage({
  recommendationId,
}: RecommendationDetailPageProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    new Set([1, 2, 3])
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  const { auth } = useRouteContext({
    from: "/(protected)/recommendations/$recommendationId",
  });

  const { data: recommendation } = useSuspenseQuery(
    getRecommendationQuery(recommendationId)
  );
  const markViewedMutation = useMarkRecommendationViewed();
  const convertMutation = useConvertRecommendationToTrip({
    onSuccess: () => {
      // Dialog will close when navigation happens
      setShowCreateDialog(false);
    },
    onError: () => {
      // Keep dialog open on error so user can retry
    },
  });

  const form = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(
        Date.now() +
          (recommendation.suggestedDuration || 7) * 24 * 60 * 60 * 1000
      ),
      visibility: "private",
    },
  });

  // Mark as viewed when component mounts
  useState(() => {
    if (!recommendation.viewedAt) {
      markViewedMutation.mutate(recommendationId);
    }
  });

  const toggleDayExpansion = (day: number) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(day)) {
        newExpanded.delete(day);
      } else {
        newExpanded.add(day);
      }
      return newExpanded;
    });
  };

  // Group activities by day
  const activitiesByDay = recommendation.activities.reduce(
    (acc: any, activity) => {
      const day = activity.suggestedDay || 1;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(activity);
      return acc;
    },
    {}
  );

  const totalDays = Math.max(
    ...Object.keys(activitiesByDay).map(Number),
    recommendation.suggestedDuration || 1
  );
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const handleCreateTrip = (data: CreateTripFormData) => {
    convertMutation.mutate({
      recommendationId,
      startDate: data.startDate,
      endDate: data.endDate,
      visibility: data.visibility,
    });
    // Don't close dialog here - let the mutation handle success/error states
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      form.setValue("startDate", range.from);
      form.setValue("endDate", range.to);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <Card className="overflow-hidden">
            {recommendation.destinationImageUrl && (
              <div
                className="h-48 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${recommendation.destinationImageUrl})`,
                }}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-4 left-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      {recommendation.destinationName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    {recommendation.name}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {recommendation.description}
                  </CardDescription>
                </div>
                <div className="ml-6 flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {recommendation.tripType}
                  </Badge>
                  {recommendation.suggestedSeason && (
                    <Badge variant="outline" className="capitalize">
                      {recommendation.suggestedSeason}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
                {recommendation.suggestedDuration && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {recommendation.suggestedDuration} days
                    </span>
                  </div>
                )}
                {recommendation.suggestedBudget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ~
                      {formatCurrency(recommendation.suggestedBudget, {
                        currency: auth?.currencySign || "USD",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {recommendation.activities.length} activities
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Daily Itinerary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Suggested Itinerary</h2>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create This Trip
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Your Trip</DialogTitle>
                    <DialogDescription>
                      Choose your travel dates and privacy settings to create
                      this trip.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleCreateTrip)}
                      className="space-y-6"
                    >
                      {/* Date Selection */}
                      <div className="space-y-3">
                        <Label>Travel Dates</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from && dateRange?.to
                                ? `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`
                                : "Select travel dates"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={handleDateRangeSelect}
                              numberOfMonths={2}
                              disabled={date => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Visibility */}
                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Visibility</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="private">
                                  <div className="flex items-center">
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Private
                                  </div>
                                </SelectItem>
                                <SelectItem value="public">
                                  <div className="flex items-center">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Public
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={
                            convertMutation.isPending ||
                            !dateRange?.from ||
                            !dateRange?.to
                          }
                        >
                          {convertMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Create Trip
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {days.map(day => {
              const dayActivities = activitiesByDay[day] || [];
              const isExpanded = expandedDays.has(day);
              const totalCost = dayActivities.reduce(
                (sum: number, activity: any) =>
                  sum + (activity.estimatedCost || 0),
                0
              );
              const totalDuration = dayActivities.reduce(
                (sum: number, activity: any) =>
                  sum + (activity.estimatedDuration || 0),
                0
              );

              return (
                <Card key={day} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <button
                      onClick={() => toggleDayExpansion(day)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                          {day}
                        </div>
                        <div>
                          <h3 className="font-semibold">Day {day}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dayActivities.length} activities
                            {totalDuration > 0 &&
                              ` • ${Math.round(totalDuration / 60)}h`}
                            {totalCost > 0 &&
                              ` • ${formatCurrency(totalCost, {
                                currency: auth?.currencySign || "USD",
                              })}`}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      {dayActivities.length === 0 ? (
                        <p className="text-muted-foreground italic text-center py-4">
                          No activities planned for this day
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {dayActivities.map((activity: any, index: number) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg"
                            >
                              <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-1">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">
                                  {activity.name}
                                </h4>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {activity.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {activity.category && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {activity.category}
                                    </Badge>
                                  )}
                                  {activity.estimatedDuration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {Math.round(
                                        activity.estimatedDuration / 60
                                      )}
                                      h
                                    </div>
                                  )}
                                  {activity.estimatedCost && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {formatCurrency(activity.estimatedCost, {
                                        currency: auth?.currencySign || "USD",
                                      })}
                                    </div>
                                  )}
                                  {activity.placeName && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {activity.placeName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Error Display */}
          {convertMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {convertMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
