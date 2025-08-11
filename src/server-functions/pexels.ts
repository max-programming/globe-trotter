import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const searchImageSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

export const searchPexelsImages = createServerFn({ method: "POST" })
  .validator(searchImageSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      throw new Error("Pexels API key not configured");
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(data.query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const result = await response.json();

      // Return the first image URL if available
      if (result.photos && result.photos.length > 0) {
        const photo = result.photos[0];
        return {
          success: true,
          imageUrl: photo.src.large,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          pexelsUrl: photo.url,
        };
      }

      return {
        success: false,
        error: "No images found for this destination",
      };
    } catch (error) {
      console.error("Failed to fetch from Pexels:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch image",
      };
    }
  });
