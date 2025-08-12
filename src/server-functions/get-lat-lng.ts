import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getLatLng = createServerFn({ method: "POST" })
  .validator(z.object({ placeId: z.string() }))
  .handler(async ({ data }) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${data.placeId}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&fields=geometry`
    );

    const place = await response.json();

    console.log({ place });

    return place.result.geometry.location as {
      lat: number;
      lng: number;
    };
  });
