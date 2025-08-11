import { createServerFn } from "@tanstack/react-start";

export const getGoogleMapsApiKey = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }
  
  return { apiKey };
});