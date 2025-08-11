import { createServerFileRoute } from "@tanstack/react-start/server";
import { createServerFileRoute } from "@tanstack/react-start";
import { z } from "zod";

const searchImageSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  perPage: z.number().min(1).max(80).default(20),
});

export const ServerRoute = createServerFileRoute("/api/search-images").methods(
  (api) => ({
    POST: api.handler(async ({ request }) => {
      try {
        const body = await request.json();
        const { query, perPage = 20 } = searchImageSchema.parse(body);

        const apiKey = process.env.PEXELS_API_KEY;

        if (!apiKey) {
          return Response.json(
            { error: "Pexels API key not configured" },
            { status: 500 }
          );
        }

        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
          {
            headers: {
              Authorization: apiKey,
            },
          }
        );

        if (!response.ok) {
          return Response.json(
            { error: `Pexels API error: ${response.status}` },
            { status: response.status }
          );
        }

        const result = await response.json();
        return Response.json(result);
      } catch (error) {
        console.error("Failed to fetch from Pexels:", error);
        return Response.json(
          { error: "Failed to fetch images" },
          { status: 500 }
        );
      }
    }),
  })
);
