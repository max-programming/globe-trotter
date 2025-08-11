import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { type DateRange } from "react-day-picker";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
  Calendar as CalendarIcon,
  Globe2,
  MapPin,
  ArrowRight,
  ChevronDownIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Heading } from "~/components/generic/heading";
import { getPexelsImageQuery } from "~/lib/queries/pexels";
import { useCreateTrip } from "~/lib/mutations/trips/useCreateTrip";
import {
  createTripSchema,
  type CreateTripFormData,
} from "~/components/trips/trip-schema";

export const Route = createFileRoute("/(protected)/trips/new")({
  head: () => ({ meta: [{ title: "Create Trip | Globe Trotter" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <NewTripForm />
      </div>
    </div>
  );
}

interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

const NewTripForm = () => {
  const [placeSuggestions, setPlaceSuggestions] = useState<
    GooglePlaceSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] =
    useState<GooglePlaceSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageQuery, setImageQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  // Use React Query for Pexels image search
  const { data: imageResult, isLoading: isLoadingImage } = useQuery(
    getPexelsImageQuery(imageQuery)
  );

  // Debouncing refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      destination: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      visibility: "private" as const,
      place: {
        place_id: "",
        description: "",
        main_text: "",
        secondary_text: "",
        types: [],
      },
      imageUrl: undefined,
    },
  });

  // Create trip mutation
  const createTripMutation = useCreateTrip(form);

  // Call Google Places Autocomplete API via our server route with debouncing
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPlaceSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const searchParams = new URLSearchParams({
        input: query,
        types: "(cities)", // Focus on cities and places
        language: "en",
      });

      const response = await fetch(`/api/places/autocomplete?${searchParams}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setPlaceSuggestions(data.suggestions);
      } else {
        console.error("Places API error:", data.error);
        setPlaceSuggestions([]);
      }
    } catch (error) {
      console.error("Failed to fetch place suggestions:", error);
      setPlaceSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(query);
      }, 300); // 300ms delay
    },
    [searchPlaces]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleDestinationChange = (value: string) => {
    form.setValue("destination", value);
    debouncedSearch(value);
    setShowSuggestions(true);

    if (!value) {
      setSelectedPlace(null);
      setPlaceSuggestions([]);
    }
  };

  const handlePlaceSelect = (place: GooglePlaceSuggestion) => {
    setSelectedPlace(place);
    form.setValue("destination", place.description);
    form.setValue("place", {
      place_id: place.place_id,
      description: place.description,
      main_text: place.main_text,
      secondary_text: place.secondary_text,
      types: place.types,
    });
    setShowSuggestions(false);

    // Fetch image for the selected place
    fetchDestinationImage(place.main_text);
  };

  // Hide suggestions when clicking outside
  const handleInputBlur = () => {
    // Delay hiding to allow click events on suggestions to fire
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Trigger image search for destination
  const fetchDestinationImage = (destination: string) => {
    setImageQuery(destination);
  };

  // Sync dateRange with form values
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      form.setValue("startDate", dateRange.from);
      form.setValue("endDate", dateRange.to);
    }
  }, [dateRange, form]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleSubmit = (data: CreateTripFormData) => {
    console.log("🚀 Creating trip:", data);

    // Add the Pexels image URL if available
    const tripData: CreateTripFormData = {
      ...data,
      imageUrl: imageResult?.success ? imageResult.imageUrl : undefined,
    };

    console.log("📍 Trip data with image:", tripData);

    // Create the trip using the mutation
    createTripMutation.mutate(tripData);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
          <Globe2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <Heading>Where do you want to go?</Heading>
          <p className="text-muted-foreground text-lg mt-2">
            Start planning your next adventure
          </p>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* Destination Search */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Choose your destination
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Search for a city or country..."
                            className="h-14 pl-12 pr-4 text-lg transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={field.value}
                            onChange={e =>
                              handleDestinationChange(e.target.value)
                            }
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={handleInputBlur}
                            autoComplete="off"
                          />
                        </div>
                      </FormControl>

                      {/* Place Suggestions Dropdown */}
                      {showSuggestions && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {isSearching ? (
                            <div className="px-4 py-3 text-center text-muted-foreground flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span>Searching...</span>
                            </div>
                          ) : placeSuggestions.length > 0 ? (
                            placeSuggestions.map(place => (
                              <button
                                key={place.place_id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                                onClick={() => handlePlaceSelect(place)}
                              >
                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <div className="font-medium">
                                    {place.main_text}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {place.secondary_text}
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-muted-foreground">
                              No places found
                            </div>
                          )}
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Range */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    When are you traveling?
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="dates" className="text-base font-medium">
                    Select your travel dates
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="dates"
                        className="h-14 justify-between font-normal text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-lg">
                            {dateRange?.from && dateRange?.to
                              ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                              : "Select travel dates"}
                          </span>
                        </div>
                        <ChevronDownIcon className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        captionLayout="dropdown"
                        numberOfMonths={2}
                        disabled={date => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Trip visibility
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Who can see this trip?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-14 text-lg">
                            <div className="flex items-center space-x-3">
                              <SelectValue placeholder="Select visibility" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">
                            <div className="flex items-center space-x-2">
                              <EyeOff className="w-4 h-4" />
                              <span>Private</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="public">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4" />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Error Display */}
              {createTripMutation.error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm font-medium">
                    {createTripMutation.error.message}
                  </p>
                </div>
              )}

              {/* Continue Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={
                    !selectedPlace ||
                    !dateRange?.from ||
                    !dateRange?.to ||
                    createTripMutation.isPending
                  }
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {createTripMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating trip...</span>
                    </div>
                  ) : (
                    <>
                      Create Trip
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
