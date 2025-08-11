import { createServerFn } from "@tanstack/react-start";
import { createTripSchema } from "~/components/trips/trip-schema";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import { trips, places } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

export const createTrip = createServerFn({ method: "POST" })
  .validator(createTripSchema)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // First, upsert the place data
    let existingPlace = await db.query.places.findFirst({
      where: eq(places.placeId, data.place.place_id),
    });

    if (!existingPlace) {
      // Insert new place if it doesn't exist
      [existingPlace] = await db
        .insert(places)
        .values({
          placeId: data.place.place_id,
          name: data.place.main_text,
          formattedAddress: data.place.description,
          mainText: data.place.main_text,
          secondaryText: data.place.secondary_text || null,
          placeTypes: data.place.types,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    // Create the trip
    const [newTrip] = await db
      .insert(trips)
      .values({
        name: `Trip to ${data.place.main_text}`,
        startDate: data.startDate,
        endDate: data.endDate,
        destinationName: data.place.main_text,
        destinationImageUrl: data.imageUrl || null,
        placeId: data.place.place_id,
        isPublic: data.visibility === "public",
        userId: context.user.id,
        updatedAt: new Date(),
      })
      .returning();

    return newTrip;
  });
