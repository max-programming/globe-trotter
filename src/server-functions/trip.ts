import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createTripSchema } from "~/components/trips/trip-schema";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import { trips, places, tripPlaces, tripItinerary } from "~/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

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
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, data.tripId), eq(trips.userId, context.user.id)),
      with: {
        itinerary: {
          with: {
            places: {
              with: {
                place: true,
              },
            },
          },
        },
      },
      orderBy: [
        asc(tripItinerary.date),
        asc(tripPlaces.sortOrder),
        asc(tripPlaces.scheduledTime),
      ],
    });

    if (!trip) {
      throw new Error("Trip not found or access denied");
    }

    return {
      trip: trip,
      itinerary: trip.itinerary,
    };
  });

export const updateItineraryNotes = createServerFn({ method: "POST" })
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
      placeId: z.string(), // Google Place ID
      scheduledTime: z.string().optional(), // HH:MM format
      userNotes: z.string().optional(),
      visitDuration: z.number().optional(), // in minutes
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

    // Ensure the place exists in the places table (it should from the search/autocomplete)
    const existingPlace = await db
      .select()
      .from(places)
      .where(eq(places.placeId, data.placeId))
      .limit(1);

    if (!existingPlace.length) {
      throw new Error("Place not found. Please search for the place first.");
    }

    // Determine next sort order for the day
    const existingForDay = await db
      .select({ id: tripPlaces.id })
      .from(tripPlaces)
      .where(eq(tripPlaces.tripItineraryId, data.tripItineraryId));

    const nextSort = existingForDay.length;

    const [newTripPlace] = await db
      .insert(tripPlaces)
      .values({
        tripItineraryId: data.tripItineraryId,
        placeId: data.placeId,
        sortOrder: nextSort,
        scheduledTime: data.scheduledTime,
        userNotes: data.userNotes,
        visitDuration: data.visitDuration,
        updatedAt: new Date(),
      })
      .returning();

    return newTripPlace;
  });

export const updatePlace = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tripPlaceId: z.number(), // ID of the tripPlaces record, not the Google place ID
      scheduledTime: z.string().optional(),
      userNotes: z.string().optional(),
      visitDuration: z.number().optional(),
      isVisited: z.boolean().optional(),
      userRating: z.number().min(1).max(5).optional(),
      sortOrder: z.number().optional(),
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
      .where(eq(tripPlaces.id, data.tripPlaceId))
      .limit(1);

    if (
      !placeWithTrip.length ||
      placeWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Place not found or access denied");
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.scheduledTime !== undefined)
      updateData.scheduledTime = data.scheduledTime;
    if (data.userNotes !== undefined) updateData.userNotes = data.userNotes;
    if (data.visitDuration !== undefined)
      updateData.visitDuration = data.visitDuration;
    if (data.isVisited !== undefined) updateData.isVisited = data.isVisited;
    if (data.userRating !== undefined) updateData.userRating = data.userRating;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const [updatedPlace] = await db
      .update(tripPlaces)
      .set(updateData)
      .where(eq(tripPlaces.id, data.tripPlaceId))
      .returning();

    return updatedPlace;
  });

export const deletePlace = createServerFn({ method: "POST" })
  .validator(z.object({ tripPlaceId: z.number() }))
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
      .where(eq(tripPlaces.id, data.tripPlaceId))
      .limit(1);

    if (
      !placeWithTrip.length ||
      placeWithTrip[0].tripUserId !== context.user.id
    ) {
      throw new Error("Place not found or access denied");
    }

    await db.delete(tripPlaces).where(eq(tripPlaces.id, data.tripPlaceId));

    return { success: true };
  });

// Function to store/upsert place details from Google Places API
export const upsertPlace = createServerFn({ method: "POST" })
  .validator(
    z.object({
      place_id: z.string(),
      name: z.string(),
      formatted_address: z.string(),
      main_text: z.string(),
      secondary_text: z.string().optional(),
      types: z.array(z.string()),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      country_code: z.string().optional(),
      country_name: z.string().optional(),
      administrative_levels: z.any().optional(),
      timezone: z.string().optional(),
      photo_reference: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    // Check if place already exists
    const existingPlace = await db
      .select()
      .from(places)
      .where(eq(places.placeId, data.place_id))
      .limit(1);

    if (existingPlace.length > 0) {
      // Update existing place with any new information
      const [updatedPlace] = await db
        .update(places)
        .set({
          name: data.name,
          formattedAddress: data.formatted_address,
          mainText: data.main_text,
          secondaryText: data.secondary_text,
          placeTypes: data.types,
          latitude: data.latitude,
          longitude: data.longitude,
          countryCode: data.country_code,
          countryName: data.country_name,
          administrativeLevels: data.administrative_levels,
          timezone: data.timezone,
          photoReference: data.photo_reference,
          updatedAt: new Date(),
        })
        .where(eq(places.placeId, data.place_id))
        .returning();

      return updatedPlace;
    } else {
      // Insert new place
      const [newPlace] = await db
        .insert(places)
        .values({
          placeId: data.place_id,
          name: data.name,
          formattedAddress: data.formatted_address,
          mainText: data.main_text,
          secondaryText: data.secondary_text,
          placeTypes: data.types,
          latitude: data.latitude,
          longitude: data.longitude,
          countryCode: data.country_code,
          countryName: data.country_name,
          administrativeLevels: data.administrative_levels,
          timezone: data.timezone,
          photoReference: data.photo_reference,
        })
        .returning();

      return newPlace;
    }
  });

export const updateTripNotes = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tripId: z.string(),
      notes: z.string(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, data.tripId), eq(trips.userId, context.user.id)))
      .limit(1);

    if (!trip.length) {
      throw new Error("Trip not found or access denied");
    }

    const [updatedTrip] = await db
      .update(trips)
      .set({
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, data.tripId))
      .returning();

    return updatedTrip;
  });
