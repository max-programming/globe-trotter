import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createTripSchema } from "~/components/trips/trip-schema";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import { trips, tripItinerary, tripPlaces } from "~/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const createTrip = createServerFn({ method: "POST" })
  .validator(createTripSchema)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Create the trip
    const [newTrip] = await db
      .insert(trips)
      .values({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        coverImageUrl: data.coverImageUrl ?? null,
        totalBudget: data.totalBudget ?? null,
        userId: context.user.id,
        updatedAt: new Date(),
      })
      .returning();

    // Generate daily itinerary entries if dates are provided
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const itineraryEntries = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        itineraryEntries.push({
          tripId: newTrip.id,
          date: currentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Insert all itinerary entries
      if (itineraryEntries.length > 0) {
        await db.insert(tripItinerary).values(itineraryEntries);
      }
    }

    return newTrip;
  });

export const getTripWithItinerary = createServerFn({ method: "GET" })
  .validator(z.object({ tripId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // First get the trip and verify ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, data.tripId), eq(trips.userId, context.user.id)))
      .limit(1);

    if (!trip.length) {
      throw new Error("Trip not found or access denied");
    }

    // Get trip itinerary with places
    const itineraryData = await db
      .select({
        itinerary: tripItinerary,
        place: tripPlaces,
      })
      .from(tripItinerary)
      .leftJoin(tripPlaces, eq(tripItinerary.id, tripPlaces.tripItineraryId))
      .where(eq(tripItinerary.tripId, data.tripId))
      .orderBy(tripItinerary.date, tripPlaces.time);

    // Group places by itinerary day
    const itineraryWithPlaces = itineraryData.reduce(
      (acc, row) => {
        const itineraryId = row.itinerary.id;

        if (!acc[itineraryId]) {
          acc[itineraryId] = {
            ...row.itinerary,
            places: [],
          };
        }

        if (row.place) {
          acc[itineraryId].places.push(row.place);
        }

        return acc;
      },
      {} as Record<string, any>
    );

    return {
      trip: trip[0],
      itinerary: Object.values(itineraryWithPlaces),
    };
  });

export const updateItineraryNotes = createServerFn({ method: "PUT" })
  .validator(
    z.object({
      itineraryId: z.number(),
      notes: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip
    const itineraryWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripItinerary)
      .innerJoin(trips, eq(tripItinerary.tripId, trips.id))
      .where(eq(tripItinerary.id, data.itineraryId))
      .limit(1);

    if (
      !itineraryWithTrip.length ||
      itineraryWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Itinerary not found or access denied");
    }

    const [updatedItinerary] = await db
      .update(tripItinerary)
      .set({
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(tripItinerary.id, data.itineraryId))
      .returning();

    return updatedItinerary;
  });

export const createPlace = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tripItineraryId: z.number(),
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
      time: z.string().optional(), // HH:MM format
      notes: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip itinerary
    const itineraryWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripItinerary)
      .innerJoin(trips, eq(tripItinerary.tripId, trips.id))
      .where(eq(tripItinerary.id, data.tripItineraryId))
      .limit(1);

    if (
      !itineraryWithTrip.length ||
      itineraryWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Itinerary not found or access denied");
    }

    const [newPlace] = await db
      .insert(tripPlaces)
      .values({
        tripItineraryId: data.tripItineraryId,
        name: data.name,
        type: data.type,
        description: data.description,
        time: data.time,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .returning();

    return newPlace;
  });

export const updatePlace = createServerFn({ method: "PUT" })
  .validator(
    z.object({
      placeId: z.number(),
      name: z.string().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
      time: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip itinerary and trip
    const placeWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripPlaces)
      .innerJoin(
        tripItinerary,
        eq(tripPlaces.tripItineraryId, tripItinerary.id)
      )
      .innerJoin(trips, eq(tripItinerary.tripId, trips.id))
      .where(eq(tripPlaces.id, data.placeId))
      .limit(1);

    if (
      !placeWithTrip.length ||
      placeWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Place not found or access denied");
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.time !== undefined) updateData.time = data.time;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedPlace] = await db
      .update(tripPlaces)
      .set(updateData)
      .where(eq(tripPlaces.id, data.placeId))
      .returning();

    return updatedPlace;
  });

export const deletePlace = createServerFn({ method: "DELETE" })
  .validator(z.object({ placeId: z.number() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip itinerary and trip
    const placeWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripPlaces)
      .innerJoin(
        tripItinerary,
        eq(tripPlaces.tripItineraryId, tripItinerary.id)
      )
      .innerJoin(trips, eq(tripItinerary.tripId, trips.id))
      .where(eq(tripPlaces.id, data.placeId))
      .limit(1);

    if (
      !placeWithTrip.length ||
      placeWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Place not found or access denied");
    }

    await db.delete(tripPlaces).where(eq(tripPlaces.id, data.placeId));

    return { success: true };
  });
