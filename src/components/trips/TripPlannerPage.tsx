import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Plus,
  Calendar,
  MapPin,
  StickyNote,
  Search,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  Pencil,
  ArrowBigRight,
  GripVertical,
  Share,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { DialogTrigger } from "~/components/ui/dialog";
import { getTripWithItineraryQuery } from "~/lib/queries/trips";
import {
  useCreatePlace,
  useUpdatePlace,
  useReorderTripPlaces,
  useDeletePlace,
} from "~/lib/mutations/trips/usePlaces";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { upsertPlace } from "~/server-functions/trip";
import { Heading } from "../generic/heading";
import { TripMap } from "../maps/TripMap";
import { useUpdateTripNotes } from "~/lib/mutations/trips/useTripNotes";
import { toast } from "sonner";
import { useShareTrip } from "~/lib/mutations/trips/useShareTrip";
import { ShareTripDialog } from "./ShareTripDialog";

interface GooglePlaceSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface TripPlannerPageProps {
  tripId: string;
}

export function TripPlannerPage({ tripId }: TripPlannerPageProps) {
  const queryClient = useQueryClient();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [daySearchQueries, setDaySearchQueries] = useState<
    Record<number, string>
  >({});
  const [dayPlaceSuggestions, setDayPlaceSuggestions] = useState<
    Record<number, GooglePlaceSuggestion[]>
  >({});
  const [dayShowSuggestions, setDayShowSuggestions] = useState<
    Record<number, boolean>
  >({});
  const [dayIsSearching, setDayIsSearching] = useState<Record<number, boolean>>(
    {}
  );
  const [selectedPlace, setSelectedPlace] =
    useState<GooglePlaceSuggestion | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [tripNotes, setTripNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Refs for debouncing per day
  const searchTimeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});
  const daySearchInputRefs = useRef<Record<number, HTMLInputElement | null>>(
    {}
  );
  const dayCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data, error } = useSuspenseQuery(getTripWithItineraryQuery(tripId));
  const createPlaceMutation = useCreatePlace();
  const updatePlaceMutation = useUpdatePlace();
  const reorderPlacesMutation = useReorderTripPlaces();
  const deletePlaceMutation = useDeletePlace();
  const upsertPlaceFn = useServerFn(upsertPlace);
  const updateTripNotesMutation = useUpdateTripNotes();
  const shareTrip = useShareTrip();
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = async (day: any, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = day.places.findIndex((p: any) => p.id === active.id);
    const newIndex = day.places.findIndex((p: any) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute new order
    const reordered = arrayMove(day.places, oldIndex, newIndex);

    // Optimistic UI update in cache (unit-100 ordering)
    queryClient.setQueryData(["trips", tripId, "itinerary"], (prev: any) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.itinerary = prev.itinerary.map((d: any) =>
        d.id === day.id
          ? {
              ...d,
              places: reordered.map((p: any, idx: number) => ({
                ...p,
                sortOrder: (idx + 1) * 100,
              })),
            }
          : d
      );
      return next;
    });

    // Persist using a single bulk reorder API call
    try {
      await reorderPlacesMutation.mutateAsync({
        tripItineraryId: day.id,
        orders: reordered.map((p: any, idx: number) => ({
          tripPlaceId: p.id,
          sortOrder: (idx + 1) * 100,
        })),
      });
    } catch (e) {
      console.error("Failed to update order", e);
    }
  };

  const handleDeletePlace = async (tripPlaceId: number) => {
    try {
      await deletePlaceMutation.mutateAsync({ tripPlaceId });
      // Optionally update cache immediately for snappier UX
      queryClient.setQueryData(["trips", tripId, "itinerary"], (prev: any) => {
        if (!prev) return prev;
        const next = { ...prev };
        next.itinerary = prev.itinerary.map((d: any) => ({
          ...d,
          places: (d.places || []).filter((p: any) => p.id !== tripPlaceId),
        }));
        return next;
      });
    } catch (e) {
      console.error("Failed to delete place", e);
    }
  };

  function SortablePlaceCard({
    place,
    index,
    onClick,
  }: {
    place: any;
    index: number;
    onClick: () => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: place.id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.85 : 1,
      cursor: "grab",
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const thumbnailUrl: string | undefined =
      place.place?.photoReference && apiKey
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=160&photo_reference=${encodeURIComponent(
            place.place.photoReference
          )}&key=${apiKey}`
        : place.place?.destinationImageUrl || undefined;

    const description: string | undefined =
      place.place?.secondaryText ||
      place.place?.formattedAddress ||
      place.userNotes ||
      (Array.isArray(place.place?.placeTypes)
        ? place.place.placeTypes.slice(0, 3).join(", ")
        : undefined);

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="group w-full p-3 rounded-lg border bg-background flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors relative">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
          <div className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white rounded-full font-medium text-[11px] flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={onClick}
              className="block text-left"
              aria-label={`View ${place.place?.name || place.name}`}
            >
              <h5 className="font-medium text-sm">
                {place.place?.name || "Unknown Place"}
              </h5>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </button>
          </div>

          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={place.place?.name || place.name || "Place"}
              className="w-36 h-20 rounded-md object-cover flex-shrink-0"
            />
          )}
          <button
            type="button"
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 border rounded-full p-1 text-muted-foreground hover:text-destructive"
            aria-label="Remove place"
            onClick={e => {
              e.stopPropagation();
              handleDeletePlace(place.id);
            }}
            title="Remove"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Debounced place search function for specific day
  const searchPlacesForDay = useCallback(
    async (dayId: number, query: string) => {
      if (!query || query.length < 2) {
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
        setDayIsSearching(prev => ({ ...prev, [dayId]: false }));
        return;
      }

      setDayIsSearching(prev => ({ ...prev, [dayId]: true }));

      try {
        const searchParams = new URLSearchParams({
          input: query,
          types: "establishment", // Focus on businesses and places
          language: "en",
        });

        const response = await fetch(
          `/api/places/autocomplete?${searchParams}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          setDayPlaceSuggestions(prev => ({
            ...prev,
            [dayId]: data.suggestions,
          }));
        } else {
          console.error("Places API error:", data.error);
          setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
        }
      } catch (error) {
        console.error("Failed to fetch place suggestions:", error);
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
      } finally {
        setDayIsSearching(prev => ({ ...prev, [dayId]: false }));
      }
    },
    []
  );

  // Debounced search for specific day
  const debouncedSearchForDay = useCallback(
    (dayId: number, query: string) => {
      if (searchTimeoutRefs.current[dayId]) {
        clearTimeout(searchTimeoutRefs.current[dayId]);
      }

      searchTimeoutRefs.current[dayId] = setTimeout(() => {
        searchPlacesForDay(dayId, query);
      }, 300);
    },
    [searchPlacesForDay]
  );

  // Initialize trip notes when data loads
  useEffect(() => {
    if (data?.trip?.notes) {
      setTripNotes(data.trip.notes);
    }
  }, [data?.trip?.notes]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(searchTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleDaySearchChange = (dayId: number, value: string) => {
    setDaySearchQueries(prev => ({ ...prev, [dayId]: value }));
    debouncedSearchForDay(dayId, value);
    setDayShowSuggestions(prev => ({ ...prev, [dayId]: true }));

    if (!value) {
      setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
    }
  };

  const handlePlaceSelectForDay = (
    dayId: number,
    place: GooglePlaceSuggestion
  ) => {
    setSelectedPlace(place);
    setDayShowSuggestions(prev => ({ ...prev, [dayId]: false }));
  };

  const handleAddPlaceToDay = async (
    day: any,
    place: GooglePlaceSuggestion
  ) => {
    if (isAddingPlace) return;

    setIsAddingPlace(true);
    try {
      // Atomic upsert+add in a single call
      await createPlaceMutation.mutateAsync({
        tripItineraryId: day.id,
        placeId: place.place_id,
        placeName: place.main_text,
        formattedAddress: place.description,
        mainText: place.main_text,
        secondaryText: place.secondary_text,
        placeTypes: place.types,
        userNotes: `Added from search: ${place.description}`,
      });

      // Clear the search for this day after successful addition
      setDaySearchQueries(prev => ({ ...prev, [day.id]: "" }));
      setDayPlaceSuggestions(prev => ({ ...prev, [day.id]: [] }));
      setSelectedPlace(null);
    } catch (error) {
      console.error("Failed to add place:", error);
    } finally {
      setIsAddingPlace(false);
    }
  };

  const toggleDayExpansion = (dayId: number) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayId)) {
        newExpanded.delete(dayId);
        // Clear search state when collapsing
        setDaySearchQueries(prev => ({ ...prev, [dayId]: "" }));
        setDayPlaceSuggestions(prev => ({ ...prev, [dayId]: [] }));
        setDayShowSuggestions(prev => ({ ...prev, [dayId]: false }));
      } else {
        newExpanded.add(dayId);
      }
      return newExpanded;
    });
  };

  const handleSaveTripNotes = async () => {
    try {
      await updateTripNotesMutation.mutateAsync({
        tripId,
        notes: tripNotes,
      });
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Failed to save trip notes:", error);
    }
  };

  const handleCancelEditNotes = () => {
    setTripNotes(data?.trip?.notes || "");
    setIsEditingNotes(false);
  };

  const handleShareTrip = async () => {
    try {
      const result = await shareTrip.mutateAsync({ tripId });
      const shareUrl = `${window.location.origin}/view/${result.shareId}`;
      setShareUrl(shareUrl);
      setIsShareDialogOpen(true);
    } catch (error) {
      console.error("Failed to share trip:", error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load trip details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Trip not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { trip, itinerary } = data;
  const totalPlaces = itinerary.reduce(
    (sum: number, day: any) => sum + (day.places?.length || 0),
    0
  );

  return (
    <div className="min-h-screen ">
      <div className="px-10 ms:pl-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Side - Trip Itinerary */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Trip Header */}
            <div className="relative overflow-hidden">
              {/* Cover Image Background */}
              <div className="relative h-64 bg-transparent">
                {trip.destinationImageUrl && (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={trip.destinationImageUrl}
                      alt={trip.name}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl overflow-hidden"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl overflow-hidden" />
                  </div>
                )}

                {/* Content Overlay */}
                <div className="z-10 h-full flex flex-col justify-end rounded-xl overflow-hidden">
                  {/* <div className="p-6 space-y-3"> */}
                  {/* Trip Title and Location */}
                  <div className="space-y-2 bg-white max-w-2/4 w-full py-4 p-10 rounded-lg shadow-lg absolute left-1/2 -translate-x-1/2 -bottom-1/2 -translate-y-1/2 ">
                    <Heading className="text-2xl font-bold text-white drop-shadow-lg">
                      {trip.name}
                    </Heading>
                    {trip.destinationName && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium drop-shadow">
                          {trip.destinationName}
                        </span>
                      </div>
                    )}
                    {trip.startDate && trip.endDate && (
                      <div className="flex items-center space-x-2 ">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm drop-shadow">
                          {format(new Date(trip.startDate), "MMM d")} -{" "}
                          {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* </div> */}
                  <div className="absolute top-2 right-2 ">
                    <Button
                      onClick={handleShareTrip}
                      disabled={shareTrip.isPending}
                      variant="outline"
                      size="sm"
                    >
                      {shareTrip.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Share className="w-4 h-4" />
                      )}
                      Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Trip Notes Section */}
              <div className="p-4 bg-background/95 pt-16">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center space-x-2">
                      <StickyNote className="w-4 h-4" />
                      <span>Trip Notes</span>
                    </h3>
                    {!isEditingNotes && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingNotes(true)}
                        className="text-xs"
                      >
                        {tripNotes ? (
                          <>
                            <Pencil className="w-3 h-3" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add Notes
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tripNotes}
                        onChange={e => setTripNotes(e.target.value)}
                        placeholder="Add your personal notes about this trip..."
                        className="min-h-20 text-sm"
                        rows={3}
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditNotes}
                          disabled={updateTripNotesMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTripNotes}
                          disabled={updateTripNotesMutation.isPending}
                        >
                          {updateTripNotesMutation.isPending ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Notes"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-8">
                      {tripNotes ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          ➤ {tripNotes}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic">
                          No notes added yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Itinerary - Accordion Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Daily Itinerary</h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedDays(new Set(itinerary.map((d: any) => d.id)))
                    }
                    aria-label="Expand all days"
                  >
                    Expand all
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedDays(new Set())}
                    aria-label="Collapse all days"
                  >
                    Collapse all
                  </Button>
                </div>
              </div>

              {itinerary.length === 0 ? (
                <Card className="bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No itinerary generated
                    </h3>
                    <p className="text-muted-foreground">
                      Your trip needs start and end dates to generate a daily
                      itinerary.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                itinerary.map((day, index) => {
                  const isExpanded = expandedDays.has(day.id);
                  const daySearchQuery = daySearchQueries[day.id] || "";
                  const dayPlaces = dayPlaceSuggestions[day.id] || [];
                  const isSearching = dayIsSearching[day.id] || false;
                  const showSuggestions = dayShowSuggestions[day.id] || false;

                  return (
                    <div
                      ref={el => {
                        dayCardRefs.current[day.id] = el;
                      }}
                    >
                      <Card className="bg-card/95 backdrop-blur-sm">
                        <CardContent className="p-0">
                          {/* Accordion Header */}
                          <button
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                            onClick={() => toggleDayExpansion(day.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`day-content-${day.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold">
                                  {format(new Date(day.date), "EEEE, MMMM d")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {day.places?.length || 0} places planned
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {day.places?.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {day.places.length}
                                </Badge>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div
                              id={`day-content-${day.id}`}
                              className="border-t bg-background/50"
                            >
                              <div className="p-4 space-y-4">
                                {/* Day Notes */}
                                {day.notes && (
                                  <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
                                    <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                      {day.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Places section comes first; add-place input moved below */}

                                {/* Places for this day */}
                                {day.places && day.places.length > 0 ? (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">
                                      Planned Places
                                    </h4>
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={e => handleDragEnd(day, e)}
                                    >
                                      <SortableContext
                                        items={day.places.map((p: any) => p.id)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        {day.places.map(
                                          (place: any, placeIndex: number) => (
                                            <SortablePlaceCard
                                              key={place.id}
                                              place={place}
                                              index={placeIndex}
                                              onClick={() =>
                                                setSelectedPlace({
                                                  place_id: place.placeId,
                                                  main_text:
                                                    place.place?.name ||
                                                    place.name ||
                                                    "",
                                                  description:
                                                    place.place
                                                      ?.formattedAddress || "",
                                                  secondary_text: "",
                                                  types: [],
                                                })
                                              }
                                            />
                                          )
                                        )}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <MapPin className="w-6 h-6 mx-auto mb-2" />
                                    <p className="text-sm">
                                      No places planned for this day
                                    </p>
                                    <p className="text-xs">
                                      Use the field below to add places
                                    </p>
                                    <div className="mt-3">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                          setExpandedDays(prev =>
                                            new Set(prev).add(day.id)
                                          );
                                          daySearchInputRefs.current[
                                            day.id
                                          ]?.focus();
                                        }}
                                        aria-label="Add a place to this day"
                                      >
                                        <Plus className="w-4 h-4 mr-1" /> Add a
                                        place
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Minimal Add Place input below planned places */}
                                <div className="pt-2">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                      type="text"
                                      placeholder="Add place"
                                      className="pl-9"
                                      value={daySearchQuery}
                                      onChange={e =>
                                        handleDaySearchChange(
                                          day.id,
                                          e.target.value
                                        )
                                      }
                                      onFocus={() =>
                                        setDayShowSuggestions(prev => ({
                                          ...prev,
                                          [day.id]: true,
                                        }))
                                      }
                                      onBlur={() => {
                                        setTimeout(
                                          () =>
                                            setDayShowSuggestions(prev => ({
                                              ...prev,
                                              [day.id]: false,
                                            })),
                                          150
                                        );
                                      }}
                                      aria-label={`Add place for ${format(new Date(day.date), "EEEE, MMMM d")}`}
                                      ref={el => {
                                        daySearchInputRefs.current[day.id] = el;
                                      }}
                                    />
                                    {daySearchQuery && (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => {
                                          setDaySearchQueries(prev => ({
                                            ...prev,
                                            [day.id]: "",
                                          }));
                                          setDayPlaceSuggestions(prev => ({
                                            ...prev,
                                            [day.id]: [],
                                          }));
                                        }}
                                        aria-label="Clear search"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && (
                                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {isSearching ? (
                                          <div className="px-4 py-3 text-center text-muted-foreground flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span>Searching...</span>
                                          </div>
                                        ) : dayPlaces.length > 0 ? (
                                          dayPlaces.map(place => (
                                            <button
                                              key={place.place_id}
                                              type="button"
                                              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                                              onClick={() => {
                                                handlePlaceSelectForDay(
                                                  day.id,
                                                  place
                                                );
                                                handleAddPlaceToDay(day, place);
                                              }}
                                            >
                                              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                              <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                  {place.main_text}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                  {place.secondary_text}
                                                </div>
                                              </div>
                                              <Plus className="w-4 h-4 text-primary" />
                                            </button>
                                          ))
                                        ) : daySearchQuery.length >= 2 ? (
                                          <div className="px-4 py-3 text-center text-muted-foreground">
                                            No places found
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side - Google Maps */}
          <div className="md:col-span-5 bg-card/95 backdrop-blur-sm rounded-lg border overflow-hidden xl:sticky xl:top-6  h-96 mb-10 md:h-[calc(100vh-5rem)] self-start">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Map View</span>
                </h3>
                {selectedPlace && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing: {selectedPlace.main_text}
                  </p>
                )}
              </div>

              {/* Google Maps Container */}
              <div className="flex-1 min-h-0">
                {data.trip.place && (
                  <TripMap
                    center={{
                      lat: data.trip.place.latitude || 0,
                      lng: data.trip.place.longitude || 0,
                    }}
                    selectedPlace={selectedPlace}
                    itineraryPlaces={itinerary.flatMap(day => day.places || [])}
                    itineraryDays={itinerary.map(d => ({
                      id: d.id,
                      date: d.date,
                    }))}
                    onAddPlaceToDay={async (dayId, marker) => {
                      // Reuse createPlace mutation with atomic upsert
                      try {
                        await createPlaceMutation.mutateAsync({
                          tripItineraryId: dayId,
                          placeId: marker.placeId,
                          placeName: marker.name,
                          formattedAddress: marker.details?.description || "",
                          mainText: marker.name,
                          secondaryText: marker.details?.description,
                          placeTypes: marker.details?.types || [],
                        });
                        // Expand day and scroll into view
                        setExpandedDays(prev => new Set(prev).add(dayId));
                        const el = dayCardRefs.current[dayId];
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                        toast.success("Place added to your itinerary");
                      } catch (e) {
                        console.error("Failed to add place from map", e);
                        toast.error("Failed to add place");
                      }
                    }}
                    onPlaceSelect={place => {
                      // Handle place selection from map if needed
                      console.log("Place selected from map:", place);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareTripDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
}

export function TripPlannerSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30">
      <div className="pl-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-6rem)]">
          {/* Left Side Skeleton */}
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="w-20 h-20 rounded-lg" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card/95 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <Skeleton className="w-5 h-5 mx-auto mb-2" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Search Skeleton */}
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Days Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-card/95 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Side Skeleton */}
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-[calc(100vh-12rem)] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
