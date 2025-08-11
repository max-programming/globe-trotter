import { useCallback, useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Clock, Navigation } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { getGoogleMapsApiKey } from "~/server-functions/config";

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
    photoReference?: string;
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
    placeDetails?: {
      name: string;
      formattedAddress: string;
      latitude?: number;
      longitude?: number;
    };
  }>;
  onPlaceSelect?: (place: PlaceMarker) => void;
  center?: google.maps.LatLngLiteral;
}

// Internal component that only renders when API key is available
function TripMapInternal({ apiKey, selectedPlace, itineraryPlaces = [], onPlaceSelect, center }: TripMapProps & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    version: "weekly",
    libraries: ["places"],
    preventGoogleFontsLoading: true,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<PlaceMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<PlaceMarker | null>(null);
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    placesService.current = new google.maps.places.PlacesService(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    placesService.current = null;
  }, []);

  // Fetch place details and location from Google Places API
  const fetchPlaceDetails = useCallback(async (placeId: string, type: "search" | "itinerary") => {
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
          "photos"
        ]
      };

      placesService.current!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
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
              photoReference: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
            },
          };
          resolve(marker);
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  // Handle selected place from search
  useEffect(() => {
    if (!selectedPlace || !placesService.current) return;

    const updateSelectedPlaceMarker = async () => {
      const marker = await fetchPlaceDetails(selectedPlace.place_id, "search");
      if (marker) {
        setMarkers(prev => {
          // Remove any existing search markers and add the new one
          const filtered = prev.filter(m => m.type !== "search");
          return [...filtered, marker];
        });
        
        // Center map on the selected place
        setMapCenter(marker.position);
        if (map) {
          map.panTo(marker.position);
          map.setZoom(15);
        }
      }
    };

    updateSelectedPlaceMarker();
  }, [selectedPlace, fetchPlaceDetails, map]);

  // Handle itinerary places
  useEffect(() => {
    if (!itineraryPlaces.length || !placesService.current) return;

    const updateItineraryMarkers = async () => {
      const itineraryMarkers: PlaceMarker[] = [];

      for (const place of itineraryPlaces) {
        if (place.placeDetails?.latitude && place.placeDetails?.longitude) {
          // Use existing coordinates if available
          const marker: PlaceMarker = {
            placeId: place.placeId,
            name: place.placeDetails.name,
            position: {
              lat: place.placeDetails.latitude,
              lng: place.placeDetails.longitude,
            },
            type: "itinerary",
            details: {
              description: place.placeDetails.formattedAddress,
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

      setMarkers(prev => {
        // Keep search markers, replace itinerary markers
        const searchMarkers = prev.filter(m => m.type === "search");
        return [...searchMarkers, ...itineraryMarkers];
      });
    };

    updateItineraryMarkers();
  }, [itineraryPlaces, fetchPlaceDetails]);

  const handleMarkerClick = (marker: PlaceMarker) => {
    setSelectedMarker(marker);
    onPlaceSelect?.(marker);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

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
      zoom={center ? 15 : 10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {markers.map((marker) => (
        <Marker
          key={`${marker.placeId}-${marker.type}`}
          position={marker.position}
          onClick={() => handleMarkerClick(marker)}
          icon={
            marker.type === "search"
              ? {
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="white" stroke-width="2"/>
                      <path d="M16 8l3 6h-6l3-6z" fill="white"/>
                      <circle cx="16" cy="20" r="2" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(32, 32),
                }
              : {
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(24, 24),
                }
          }
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 max-w-xs">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm pr-2">{selectedMarker.name}</h4>
                <Badge variant={selectedMarker.type === "search" ? "destructive" : "default"} className="text-xs">
                  {selectedMarker.type === "search" ? "Search" : "Planned"}
                </Badge>
              </div>
              
              {selectedMarker.details?.description && (
                <p className="text-xs text-gray-600">
                  {selectedMarker.details.description}
                </p>
              )}

              {selectedMarker.details?.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs">{selectedMarker.details.rating}</span>
                </div>
              )}

              <div className="flex space-x-1 pt-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.position.lat},${selectedMarker.position.lng}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Directions
                </Button>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

// Main component that handles API key loading
export function TripMap({ selectedPlace, itineraryPlaces = [], onPlaceSelect, center }: TripMapProps) {
  const getApiKeyFn = useServerFn(getGoogleMapsApiKey);
  const { data: apiKeyData, isLoading: isApiKeyLoading, error: apiKeyError } = useQuery({
    queryKey: ["google-maps-api-key"],
    queryFn: () => getApiKeyFn(),
    staleTime: Infinity, // API key doesn't change
  });

  if (apiKeyError) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold mb-2">API Key Error</h3>
            <p className="text-sm text-muted-foreground">
              Failed to get Google Maps API key. Please check your configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isApiKeyLoading || !apiKeyData?.apiKey) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Getting API key...</p>
        </div>
      </div>
    );
  }

  // Only render the internal component when we have the API key
  return (
    <TripMapInternal 
      apiKey={apiKeyData.apiKey}
      selectedPlace={selectedPlace}
      itineraryPlaces={itineraryPlaces}
      onPlaceSelect={onPlaceSelect}
      center={center}
    />
  );
}