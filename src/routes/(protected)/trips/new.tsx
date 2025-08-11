import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/DatePicker";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Calendar, Globe2, MapPin, ArrowRight } from "lucide-react";
import { Heading } from "~/components/generic/heading";

// Schema for the new simplified trip creation form
const newTripSchema = z
  .object({
    destination: z.string().min(1, "Please select a destination"),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
  })
  .refine(
    data => {
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before start date" }
  );

type NewTripFormData = z.infer<typeof newTripSchema>;

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
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debouncing refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<NewTripFormData>({
    resolver: zodResolver(newTripSchema),
    defaultValues: {
      destination: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

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
    setShowSuggestions(false);
  };

  // Hide suggestions when clicking outside
  const handleInputBlur = () => {
    // Delay hiding to allow click events on suggestions to fire
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Simulate Unsplash API call
  const fetchDestinationImage = async (destination: string) => {
    setIsLoadingImage(true);
    try {
      // Mock Unsplash API response
      const mockImageUrl = `https://images.unsplash.com/photo-1560472355-a9a8a45e9e5b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&search=${encodeURIComponent(destination)}`;

      console.log(`🖼️  Fetched image for "${destination}":`, mockImageUrl);

      // In real implementation, you'd make actual API call:
      // const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=1`, {
      //   headers: {
      //     'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      //   }
      // });
      // const data = await response.json();
      // const imageUrl = data.results[0]?.urls?.regular;

      return mockImageUrl;
    } catch (error) {
      console.error("Failed to fetch destination image:", error);
      return null;
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handleSubmit = async (data: NewTripFormData) => {
    console.log("🚀 Creating trip:", data);

    if (selectedPlace) {
      console.log("📍 Selected place:", selectedPlace);
      await fetchDestinationImage(selectedPlace.main_text);
    }

    // Here you would normally save the trip to database
    // For now, just show success
    alert(`Trip to ${data.destination} created successfully!`);
  };

  const handleStartDateChange = (date?: Date) => {
    if (date) {
      form.setValue("startDate", date);

      // Adjust end date if it's before start date
      const currentEndDate = form.getValues("endDate");
      if (currentEndDate < date) {
        form.setValue("endDate", date);
      }
    }
  };

  const handleEndDateChange = (date?: Date) => {
    if (date) {
      const startDate = form.getValues("startDate");

      // Don't allow end date before start date
      if (date >= startDate) {
        form.setValue("endDate", date);
      }
    }
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
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    When are you traveling?
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={handleStartDateChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">End Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={handleEndDateChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={!selectedPlace || isLoadingImage}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoadingImage ? (
                    "Loading image..."
                  ) : (
                    <>
                      Continue
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
