import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { desc, eq, and, count, getTableColumns } from "drizzle-orm";
import {
  db,
  trips,
  users,
  tripStops,
  places,
  tripItinerary,
  tripPlaces,
} from "~/lib/db";
import { authMiddleware } from "./auth-middleware";

export interface PublicTripsParams {
  page?: number;
  limit?: number;
  destination?: string;
}

export const getPublicTrips = createServerFn({ method: "GET" })
  .validator(
    z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      destination: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const {
      page = 1,
      limit = 12,
      destination,
    } = (data as PublicTripsParams) || {};
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(trips.isPublic, true)];

    if (destination) {
      // Search in destination name or trip name
      // For now, we'll implement a simple search
      // You might need to adjust this based on your database
      whereConditions
        .push
        // Add destination-based filtering here if needed
        ();
    }

    // Get public trips with user info
    const publicTrips = await db
      .select({
        // Trip columns
        id: trips.id,
        name: trips.name,
        description: trips.description,
        startDate: trips.startDate,
        endDate: trips.endDate,
        coverImageUrl: trips.coverImageUrl,
        destinationName: trips.destinationName,
        destinationImageUrl: trips.destinationImageUrl,
        totalBudget: trips.totalBudget,
        createdAt: trips.createdAt,
        placeId: trips.placeId,
        // User info
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        // Trip stats
        tripStopsCount: count(tripStops.id),
        // Place info for destination
        place: {
          latitude: places.latitude,
          longitude: places.longitude,
        },
      })
      .from(trips)
      .innerJoin(users, eq(trips.userId, users.id))
      .leftJoin(tripStops, eq(trips.id, tripStops.tripId))
      .leftJoin(places, eq(trips.placeId, places.placeId))
      .where(and(...whereConditions))
      .groupBy(
        trips.id,
        trips.name,
        trips.description,
        trips.startDate,
        trips.endDate,
        trips.coverImageUrl,
        trips.destinationName,
        trips.destinationImageUrl,
        trips.totalBudget,
        trips.createdAt,
        trips.placeId,
        users.id,
        users.name,
        users.image,
        places.latitude,
        places.longitude
      )
      .orderBy(desc(trips.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch itinerary data for each trip
    const tripsWithItinerary = await Promise.all(
      publicTrips.map(async (trip) => {
        // Get itinerary for this trip
        const itinerary = await db
          .select({
            id: tripItinerary.id,
            date: tripItinerary.date,
            notes: tripItinerary.notes,
          })
          .from(tripItinerary)
          .where(eq(tripItinerary.tripId, trip.id))
          .orderBy(tripItinerary.date);

        // Get places for each day
        const itineraryWithPlaces = await Promise.all(
          itinerary.map(async (day) => {
            const dayPlaces = await db
              .select({
                id: tripPlaces.id,
                name: places.name,
                scheduledTime: tripPlaces.scheduledTime,
                visitDuration: tripPlaces.visitDuration,
                sortOrder: tripPlaces.sortOrder,
              })
              .from(tripPlaces)
              .innerJoin(places, eq(tripPlaces.placeId, places.placeId))
              .where(eq(tripPlaces.tripItineraryId, day.id))
              .orderBy(tripPlaces.sortOrder);

            return {
              ...day,
              places: dayPlaces,
            };
          })
        );

        return {
          ...trip,
          itinerary: itineraryWithPlaces,
        };
      })
    );

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(trips)
      .where(and(...whereConditions));

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      trips: tripsWithItinerary,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  });

export const duplicateTrip = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tripId: z.string(),
      newTripName: z.string().optional(),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const { tripId, newTripName } = data;
    const userId = context.session.userId;

    // First, verify the trip is public or belongs to the user
    const originalTrip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (!originalTrip.length) {
      throw new Error("Trip not found");
    }

    const trip = originalTrip[0];

    // Check if trip is public or belongs to the user
    if (!trip.isPublic && trip.userId !== userId) {
      throw new Error("You don't have permission to duplicate this trip");
    }

    // Generate a unique name for the duplicated trip
    const duplicatedTripName = newTripName || `Copy of ${trip.name}`;

    // Create the new trip
    const [newTrip] = await db
      .insert(trips)
      .values({
        name: duplicatedTripName,
        description: trip.description,
        notes: trip.notes,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverImageUrl: trip.coverImageUrl,
        totalBudget: trip.totalBudget,
        isPublic: false, // Duplicated trips are private by default
        placeId: trip.placeId,
        destinationName: trip.destinationName,
        destinationImageUrl: trip.destinationImageUrl,
        userId: userId, // Set to current user
        status: "draft", // Reset to draft
      })
      .returning();

    // Get the original trip's itinerary
    const originalItinerary = await db
      .select()
      .from(tripItinerary)
      .where(eq(tripItinerary.tripId, tripId));

    // Duplicate itinerary days
    for (const day of originalItinerary) {
      const [newDay] = await db
        .insert(tripItinerary)
        .values({
          tripId: newTrip.id,
          date: day.date,
          notes: day.notes,
        })
        .returning();

      // Get places for this day
      const dayPlaces = await db
        .select()
        .from(tripPlaces)
        .where(eq(tripPlaces.tripItineraryId, day.id))
        .orderBy(tripPlaces.sortOrder);

      // Duplicate places
      for (const place of dayPlaces) {
        await db.insert(tripPlaces).values({
          tripItineraryId: newDay.id,
          placeId: place.placeId,
          sortOrder: place.sortOrder,
          scheduledTime: place.scheduledTime,
          userNotes: place.userNotes,
          visitDuration: place.visitDuration,
          // Reset user-specific fields
          isVisited: false,
          userRating: null,
        });
      }
    }

    // Get trip stops
    const originalStops = await db
      .select()
      .from(tripStops)
      .where(eq(tripStops.tripId, tripId))
      .orderBy(tripStops.stopOrder);

    // Duplicate trip stops
    for (const stop of originalStops) {
      await db.insert(tripStops).values({
        tripId: newTrip.id,
        countryId: stop.countryId,
        cityId: stop.cityId,
        budget: stop.budget,
        stopOrder: stop.stopOrder,
        arrivalDate: stop.arrivalDate,
        departureDate: stop.departureDate,
        notes: stop.notes,
      });
    }

    return {
      success: true,
      tripId: newTrip.id,
      message: `Trip "${duplicatedTripName}" has been saved to your trips!`,
    };
  });
