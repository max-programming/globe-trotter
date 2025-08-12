import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import {
  MapPin,
  Star,
  Clock,
  Navigation,
  Phone,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Place } from "~/lib/db";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (San Francisco as fallback)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  scrollwheel: true,
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
};

interface PlaceMarker {
  placeId: string;
  name: string;
  position: google.maps.LatLngLiteral;
  type: "search" | "itinerary";
  details?: {
    description?: string;
    types?: string[];
    rating?: number;
    userRatingsTotal?: number;
    openNow?: boolean | null;
    openingHours?: string[];
    phoneNumber?: string;
    websiteUrl?: string;
    googleUrl?: string;
    photoUrl?: string;
  };
}

interface TripMapProps {
  selectedPlace?: {
    place_id: string;
    description: string;
    main_text: string;
    secondary_text: string;
    types: string[];
  } | null;
  itineraryPlaces?: Array<{
    id: number;
    placeId: string;
    place?: Place;
  }>;
  onPlaceSelect?: (place: PlaceMarker) => void;
  center?: google.maps.LatLngLiteral;
  itineraryDays?: Array<{ id: number; date: string }>;
  onAddPlaceToDay?: (
    dayId: number,
    marker: PlaceMarker
  ) => Promise<void> | void;
}

// Internal component that only renders when API key is available
function TripMapInternal({
  apiKey,
  selectedPlace,
  itineraryPlaces = [],
  onPlaceSelect,
  center,
  itineraryDays = [],
  onAddPlaceToDay,
}: TripMapProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    version: "weekly",
    libraries: ["places"],
    preventGoogleFontsLoading: true,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<PlaceMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<PlaceMarker | null>(
    null
  );
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | undefined>(
    itineraryDays[0]?.id
  );
  const animationRef = useRef<number | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    placesService.current = new google.maps.places.PlacesService(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    placesService.current = null;
  }, []);

  // Smooth camera animation (center + optional zoom)
  const animateCamera = useCallback(
    (
      target: google.maps.LatLngLiteral,
      options: { zoom?: number; durationMs?: number } = {}
    ) => {
      if (!map) return;
      const duration = options.durationMs ?? 700;
      const start = performance.now();
      const startCenter = map.getCenter();
      if (!startCenter) return;
      const startZoom = map.getZoom() ?? 10;
      const endZoom = options.zoom ?? startZoom;

      const fromLat = startCenter.lat();
      const fromLng = startCenter.lng();
      const toLat = target.lat;
      const toLng = target.lng;

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        const e = easeInOutCubic(t);
        const lat = fromLat + (toLat - fromLat) * e;
        const lng = fromLng + (toLng - fromLng) * e;
        const zoom = startZoom + (endZoom - startZoom) * e;
        map.setCenter({ lat, lng });
        if (endZoom !== startZoom) map.setZoom(zoom);

        if (t < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(step);
    },
    [map]
  );

  // Helper to create nicer SVG markers
  const createSvgPin = useCallback(
    (color: string, size: number, isSelected = false): google.maps.Icon => ({
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0.85"/>
            </linearGradient>
          </defs>
          <g filter="url(#shadow)">
            <path d="M24 2C14 2 6 9.7 6 19.3c0 11.1 15.3 25.8 17.9 28.3.6.6 1.6.6 2.2 0C26.7 45 42 30.4 42 19.3 42 9.7 34 2 24 2z" fill="url(#grad)" stroke="white" stroke-width="2"/>
            <circle cx="24" cy="19" r="7" fill="white"/>
          </g>
          ${isSelected ? '<circle cx="24" cy="19" r="11" fill="none" stroke="white" stroke-width="2"/>' : ""}
        </svg>
      `),
      scaledSize: new window.google.maps.Size(size, size),
    }),
    []
  );

  // Fetch place details and location from Google Places API
  const fetchPlaceDetails = useCallback(
    async (placeId: string, type: "search" | "itinerary") => {
      if (!placesService.current) return null;

      return new Promise<PlaceMarker | null>((resolve) => {
        const request = {
          placeId: placeId,
          fields: [
            "place_id",
            "name",
            "geometry",
            "formatted_address",
            "types",
            "rating",
            "photos",
            "user_ratings_total",
            "opening_hours",
            "formatted_phone_number",
            "website",
            "url",
          ],
        };

        placesService.current!.getDetails(request, (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            const marker: PlaceMarker = {
              placeId: place.place_id!,
              name: place.name || "Unknown Place",
              position: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              type,
              details: {
                description: place.formatted_address,
                types: place.types || [],
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total ?? undefined,
                openNow: place.opening_hours?.isOpen() ?? null,
                openingHours: place.opening_hours?.weekday_text ?? undefined,
                phoneNumber: (place as any).formatted_phone_number,
                websiteUrl: place.website || undefined,
                googleUrl: (place as any).url || undefined,
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 600 }),
              },
            };
            resolve(marker);
          } else {
            resolve(null);
          }
        });
      });
    },
    []
  );

  // Handle selected place from search
  useEffect(() => {
    if (!selectedPlace || !placesService.current) return;

    const updateSelectedPlaceMarker = async () => {
      const marker = await fetchPlaceDetails(selectedPlace.place_id, "search");
      if (marker) {
        setMarkers((prev) => {
          // Remove any existing search markers and add the new one
          const filtered = prev.filter((m) => m.type !== "search");
          return [...filtered, marker];
        });

        // Center map on the selected place with smooth animation
        setMapCenter(marker.position);
        if (map) {
          animateCamera(marker.position, { zoom: 16, durationMs: 750 });
        }
        // Update the bottom panel to reflect the latest selected place
        setSelectedMarker(marker);
        setShowBottomPanel(true);
      }
    };

    updateSelectedPlaceMarker();
  }, [selectedPlace, fetchPlaceDetails, map]);

  // Update default selected day if itinerary changes
  useEffect(() => {
    if (itineraryDays.length && !selectedDayId) {
      setSelectedDayId(itineraryDays[0].id);
    }
  }, [itineraryDays, selectedDayId]);

  // Handle itinerary places
  useEffect(() => {
    if (!itineraryPlaces.length || !placesService.current) return;

    const updateItineraryMarkers = async () => {
      const itineraryMarkers: PlaceMarker[] = [];

      for (const place of itineraryPlaces) {
        if (place.place?.latitude && place.place?.longitude) {
          // Use existing coordinates if available
          const marker: PlaceMarker = {
            placeId: place.placeId,
            name: place.place.name,
            position: {
              lat: place.place.latitude,
              lng: place.place.longitude,
            },
            type: "itinerary",
            details: {
              description: place.place.formattedAddress,
            },
          };
          itineraryMarkers.push(marker);
        } else {
          // Fetch details if coordinates not available
          const marker = await fetchPlaceDetails(place.placeId, "itinerary");
          if (marker) {
            itineraryMarkers.push(marker);
          }
        }
      }

      setMarkers((prev) => {
        // Keep search markers, replace itinerary markers
        const searchMarkers = prev.filter((m) => m.type === "search");
        return [...searchMarkers, ...itineraryMarkers];
      });
    };

    updateItineraryMarkers();
  }, [itineraryPlaces, fetchPlaceDetails]);

  const handleMarkerClick = (marker: PlaceMarker) => {
    setSelectedMarker(marker);
    onPlaceSelect?.(marker);
    setShowBottomPanel(true);
    if (map) animateCamera(marker.position, { durationMs: 650 });
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  // Compute once per itineraryPlaces change.
  // Must be declared before any early returns to keep hook order stable.
  const alreadyAddedPlaceIds = useMemo(
    () => new Set(itineraryPlaces.map((p) => p.placeId)),
    [itineraryPlaces]
  );

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Map Loading Error</h3>
            <p className="text-sm text-muted-foreground">
              Failed to load Google Maps. Please check your configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={10}
      // Do not force a new zoom on each render; keep current zoom to avoid jumping
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
      onClick={(e) => {
        const placeId = (e as any)?.placeId as string | undefined;
        if (!placesService.current) return;
        if (placeId) {
          // Prevent default info window
          (e as any).stop();
          fetchPlaceDetails(placeId, "search").then((marker) => {
            if (!marker) return;
            setMarkers((prev) => {
              const filtered = prev.filter((m) => m.type !== "search");
              return [...filtered, marker];
            });
            setSelectedMarker(marker);
            setShowBottomPanel(true);
            setMapCenter(marker.position);
            if (map) animateCamera(marker.position, { durationMs: 650 });
          });
          return;
        }

        // Fallback: find nearest POI to click
        const latLng = e.latLng?.toJSON();
        if (!latLng) return;
        placesService.current.nearbySearch(
          {
            location: latLng,
            radius: 40,
            type: "point_of_interest",
          },
          (results, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              results &&
              results.length
            ) {
              const nearest = results[0];
              if (nearest.place_id) {
                fetchPlaceDetails(nearest.place_id, "search").then((marker) => {
                  if (!marker) return;
                  setMarkers((prev) => {
                    const filtered = prev.filter((m) => m.type !== "search");
                    return [...filtered, marker];
                  });
                  setSelectedMarker(marker);
                  setShowBottomPanel(true);
                  setMapCenter(marker.position);
                  if (map)
                    animateCamera(marker.position, {
                      durationMs: 650,
                    });
                });
              }
            }
          }
        );
      }}
    >
      {markers.map((marker) => (
        <Marker
          key={`${marker.placeId}-${marker.type}`}
          position={marker.position}
          onClick={() => handleMarkerClick(marker)}
          icon={
            marker.type === "search" &&
            !alreadyAddedPlaceIds.has(marker.placeId)
              ? createSvgPin(
                  "#6b7280", // gray for candidate/search
                  40,
                  selectedMarker?.placeId === marker.placeId
                )
              : createSvgPin("#dc2626", 28, false) // red for itinerary
          }
          animation={
            selectedMarker?.placeId === marker.placeId
              ? window.google.maps.Animation.BOUNCE
              : undefined
          }
        />
      ))}

      {/* Bottom place details panel */}
      {selectedMarker && showBottomPanel && (
        <div className="absolute left-3 right-3 bottom-3 z-[1]">
          <div className="rounded-xl shadow-2xl overflow-hidden bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
            <div className="flex items-stretch">
              <div className="flex-1 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold leading-tight text-sm sm:text-base text-foreground">
                      {selectedMarker.name}
                    </h4>
                    {selectedMarker.details?.description && (
                      <p className="mt-1 text-[12px] sm:text-sm text-muted-foreground/90 leading-snug line-clamp-2">
                        {selectedMarker.details.description}
                      </p>
                    )}
                    {selectedMarker.details?.types && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedMarker.details.types.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
                          >
                            {t.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedMarker.type === "search"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] h-5"
                    >
                      {alreadyAddedPlaceIds.has(selectedMarker.placeId)
                        ? "Added"
                        : selectedMarker.type === "search"
                          ? "Search"
                          : "Planned"}
                    </Badge>
                    <button
                      aria-label="Close panel"
                      className="h-6 w-6 rounded-md border hover:bg-muted text-xs text-muted-foreground"
                      onClick={() => setShowBottomPanel(false)}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] sm:text-xs">
                  {selectedMarker.details?.rating && (
                    <span className="inline-flex items-center gap-1 text-foreground/90">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      {selectedMarker.details.rating}
                      {selectedMarker.details.userRatingsTotal
                        ? ` (${selectedMarker.details.userRatingsTotal})`
                        : null}
                    </span>
                  )}
                  {selectedMarker.details?.openNow !== null && (
                    <span
                      className={
                        selectedMarker.details?.openNow
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {selectedMarker.details?.openNow ? "Open now" : "Closed"}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                  {selectedMarker.details?.phoneNumber && (
                    <a
                      href={`tel:${selectedMarker.details.phoneNumber}`}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-foreground/90 hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                  {selectedMarker.details?.websiteUrl && (
                    <a
                      href={selectedMarker.details.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm text-foreground/90 hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                  <button
                    className="inline-flex items-center gap-2 text-xs sm:text-sm px-2 py-1 rounded-md border hover:bg-muted"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.position.lat},${selectedMarker.position.lng}`,
                        "_blank"
                      );
                    }}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Directions
                  </button>
                </div>

                {/* Add to day controls (only show if not already added) */}
                {onAddPlaceToDay &&
                  itineraryDays.length > 0 &&
                  !alreadyAddedPlaceIds.has(selectedMarker.placeId) && (
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        value={selectedDayId}
                        onChange={(e) =>
                          setSelectedDayId(Number(e.target.value))
                        }
                        aria-label="Choose day to add"
                        disabled={isAdding}
                      >
                        {itineraryDays.map((d) => (
                          <option key={d.id} value={d.id}>
                            {new Date(d.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={isAdding}
                        onClick={async () => {
                          if (!selectedDayId || isAdding) return;
                          try {
                            setIsAdding(true);
                            await Promise.resolve(
                              onAddPlaceToDay(selectedDayId, selectedMarker)
                            );
                          } finally {
                            setIsAdding(false);
                          }
                        }}
                      >
                        {isAdding ? "Adding..." : "Add to day"}
                      </Button>
                    </div>
                  )}
              </div>
              {selectedMarker.details?.photoUrl && (
                <div className="hidden sm:block w-44 md:w-60 h-28 md:h-36 relative">
                  <img
                    src={selectedMarker.details.photoUrl}
                    alt={selectedMarker.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GoogleMap>
  );
}

// Main component that handles API key loading
export function TripMap({
  selectedPlace,
  itineraryPlaces = [],
  onPlaceSelect,
  center,
  itineraryDays,
  onAddPlaceToDay,
}: TripMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">API Key Error</h3>
            <p className="text-sm text-muted-foreground">
              Failed to get Google Maps API key. Please check your
              configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render the internal component when we have the API key
  return (
    <TripMapInternal
      apiKey={apiKey}
      selectedPlace={selectedPlace}
      itineraryPlaces={itineraryPlaces}
      onPlaceSelect={onPlaceSelect}
      center={center}
      itineraryDays={itineraryDays}
      onAddPlaceToDay={onAddPlaceToDay}
    />
  );
}
