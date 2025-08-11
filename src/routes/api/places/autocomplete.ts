import { createServerFileRoute } from "@tanstack/react-start/server";
import { z } from "zod";

// Input validation schema
const autocompleteQuerySchema = z.object({
  input: z.string().min(1, "Input is required"),
  types: z.string().optional(), // e.g., "(cities)" or "geocode"
  language: z.string().optional(), // e.g., "en"
});

// Response type for Google Places Autocomplete
interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

interface GooglePlacesAutocompleteResponse {
  predictions: GooglePlacePrediction[];
  status: string;
}

export const ServerRoute = createServerFileRoute(
  "/api/places/autocomplete"
).methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());

      // Validate query parameters
      const validatedQuery = autocompleteQuerySchema.parse(queryParams);

      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!googleApiKey) {
        return Response.json(
          { error: "Google Maps API key not configured" },
          { status: 500 }
        );
      }

      // Build Google Places Autocomplete API URL
      const googleUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json"
      );

      googleUrl.searchParams.set("input", validatedQuery.input);
      googleUrl.searchParams.set("key", googleApiKey);

      // Optional parameters
      if (validatedQuery.types) {
        googleUrl.searchParams.set("types", validatedQuery.types);
      }
      if (validatedQuery.language) {
        googleUrl.searchParams.set("language", validatedQuery.language);
      }

      // Call Google Places API
      const googleResponse = await fetch(googleUrl.toString());

      if (!googleResponse.ok) {
        throw new Error(`Google API error: ${googleResponse.status}`);
      }

      const data: GooglePlacesAutocompleteResponse =
        await googleResponse.json();

      // Check Google API status
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        return Response.json(
          { error: `Google Places API error: ${data.status}` },
          { status: 400 }
        );
      }

      // Transform Google response to our format
      const suggestions = data.predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        main_text: prediction.structured_formatting.main_text,
        secondary_text: prediction.structured_formatting.secondary_text || "",
        types: prediction.types,
      }));

      return Response.json({
        suggestions,
        status: "success",
      });
    } catch (error) {
      console.error("Places autocomplete error:", error);

      if (error instanceof z.ZodError) {
        return Response.json(
          { error: "Invalid query parameters", details: error.issues },
          { status: 400 }
        );
      }

      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
});
