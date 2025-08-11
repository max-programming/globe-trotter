import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const searchPlaceSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export const searchAndGetPlaceDetails = createServerFn({ method: "POST" })
  .validator(searchPlaceSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      // Step 1: Search for place using Autocomplete API
      const autocompleteUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json"
      );
      autocompleteUrl.searchParams.set("input", data.query);
      autocompleteUrl.searchParams.set("key", apiKey);
      autocompleteUrl.searchParams.set("types", "(cities)");
      autocompleteUrl.searchParams.set("language", "en");

      const autocompleteResponse = await fetch(autocompleteUrl.toString());

      if (!autocompleteResponse.ok) {
        throw new Error(
          `Autocomplete API error: ${autocompleteResponse.status}`
        );
      }

      const autocompleteData = await autocompleteResponse.json();

      if (
        !autocompleteData.predictions ||
        autocompleteData.predictions.length === 0
      ) {
        return {
          success: false,
          error: "No places found for this query",
        };
      }

      // Get the first result (most relevant)
      const firstPrediction = autocompleteData.predictions[0];

      // Step 2: Get detailed information using Place Details API
      const detailsUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/details/json"
      );
      detailsUrl.searchParams.set("place_id", firstPrediction.place_id);
      detailsUrl.searchParams.set("key", apiKey);
      detailsUrl.searchParams.set(
        "fields",
        [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "types",
          "address_components",
          "photos",
          "website",
          "international_phone_number",
        ].join(",")
      );

      const detailsResponse = await fetch(detailsUrl.toString());

      if (!detailsResponse.ok) {
        throw new Error(`Details API error: ${detailsResponse.status}`);
      }

      const detailsData = await detailsResponse.json();

      if (!detailsData.result) {
        return {
          success: false,
          error: "Could not get place details",
        };
      }

      const place = detailsData.result;

      // Extract country and administrative levels from address components
      let countryCode = null;
      let countryName = null;
      const administrativeLevels: any = {};

      if (place.address_components) {
        for (const component of place.address_components) {
          if (component.types.includes("country")) {
            countryCode = component.short_name;
            countryName = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            administrativeLevels.level1 = {
              name: component.long_name,
              short: component.short_name,
            };
          }
          if (component.types.includes("administrative_area_level_2")) {
            administrativeLevels.level2 = {
              name: component.long_name,
              short: component.short_name,
            };
          }
        }
      }

      // Return structured place data
      return {
        success: true,
        placeData: {
          placeId: place.place_id,
          name: place.name,
          formattedAddress: place.formatted_address,
          mainText:
            firstPrediction.structured_formatting?.main_text || place.name,
          secondaryText:
            firstPrediction.structured_formatting?.secondary_text || "",
          placeTypes: place.types || [],
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          countryCode,
          countryName,
          administrativeLevels,
          timezone: null, // This would require additional API call
          photoReference: place.photos?.[0]?.photo_reference || null,
        },
      };
    } catch (error) {
      console.error("Failed to search and get place details:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to search for place",
      };
    }
  });
