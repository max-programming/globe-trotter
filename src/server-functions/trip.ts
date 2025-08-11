import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createTripSchema } from "~/components/trips/trip-schema";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import { trips, tripStops, tripStopActivities, cities, countries } from "~/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const createTrip = createServerFn({ method: "POST" })
  .validator(createTripSchema)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
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

    return newTrip;
  });

export const getTripWithStops = createServerFn({ method: "GET" })
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

    // Get trip stops with their cities, countries, and activities
    const stops = await db
      .select({
        tripStop: tripStops,
        city: cities,
        country: countries,
        activities: tripStopActivities,
      })
      .from(tripStops)
      .innerJoin(cities, eq(tripStops.cityId, cities.id))
      .innerJoin(countries, eq(tripStops.countryId, countries.id))
      .leftJoin(tripStopActivities, eq(tripStops.id, tripStopActivities.tripStopId))
      .where(eq(tripStops.tripId, data.tripId))
      .orderBy(tripStops.stopOrder, desc(tripStopActivities.createdAt));

    // Group activities by stop
    const stopsWithActivities = stops.reduce((acc, row) => {
      const stopId = row.tripStop.id;
      
      if (!acc[stopId]) {
        acc[stopId] = {
          ...row.tripStop,
          city: row.city,
          country: row.country,
          activities: [],
        };
      }
      
      if (row.activities) {
        acc[stopId].activities.push(row.activities);
      }
      
      return acc;
    }, {} as Record<string, any>);

    return {
      trip: trip[0],
      stops: Object.values(stopsWithActivities),
    };
  });

export const createTripStop = createServerFn({ method: "POST" })
  .validator(z.object({
    tripId: z.string(),
    countryId: z.number(),
    cityId: z.number(),
    arrivalDate: z.string().optional(),
    departureDate: z.string().optional(),
    budget: z.number().optional(),
    notes: z.string().optional(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify trip ownership
    const trip = await db
      .select()
      .from(trips)
      .where(and(eq(trips.id, data.tripId), eq(trips.userId, context.user.id)))
      .limit(1);

    if (!trip.length) {
      throw new Error("Trip not found or access denied");
    }

    // Get the next stop order
    const lastStop = await db
      .select({ stopOrder: tripStops.stopOrder })
      .from(tripStops)
      .where(eq(tripStops.tripId, data.tripId))
      .orderBy(desc(tripStops.stopOrder))
      .limit(1);

    const nextOrder = lastStop.length ? lastStop[0].stopOrder + 100 : 100;

    const [newStop] = await db
      .insert(tripStops)
      .values({
        tripId: data.tripId,
        countryId: data.countryId,
        cityId: data.cityId,
        stopOrder: nextOrder,
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        budget: data.budget,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .returning();

    return newStop;
  });

export const updateTripStop = createServerFn({ method: "PUT" })
  .validator(z.object({
    stopId: z.string(),
    arrivalDate: z.string().optional(),
    departureDate: z.string().optional(),
    budget: z.number().optional(),
    notes: z.string().optional(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip
    const stopWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripStops)
      .innerJoin(trips, eq(tripStops.tripId, trips.id))
      .where(eq(tripStops.id, data.stopId))
      .limit(1);

    if (!stopWithTrip.length || stopWithTrip[0].tripUserId !== context.user.id) {
      throw new Error("Stop not found or access denied");
    }

    const [updatedStop] = await db
      .update(tripStops)
      .set({
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        budget: data.budget,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(tripStops.id, data.stopId))
      .returning();

    return updatedStop;
  });

export const deleteTripStop = createServerFn({ method: "DELETE" })
  .validator(z.object({ stopId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip
    const stopWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripStops)
      .innerJoin(trips, eq(tripStops.tripId, trips.id))
      .where(eq(tripStops.id, data.stopId))
      .limit(1);

    if (!stopWithTrip.length || stopWithTrip[0].tripUserId !== context.user.id) {
      throw new Error("Stop not found or access denied");
    }

    await db.delete(tripStops).where(eq(tripStops.id, data.stopId));
    
    return { success: true };
  });

export const createActivity = createServerFn({ method: "POST" })
  .validator(z.object({
    tripStopId: z.string(),
    activityCategory: z.enum(["sightseeing", "food", "entertainment", "adventure", "culture", "shopping", "relaxation", "transportation", "accommodation", "other"]),
    activityName: z.string(),
    scheduledDate: z.string().optional(),
    actualCost: z.number().optional(),
    notes: z.string().optional(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip stop
    const stopWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripStops)
      .innerJoin(trips, eq(tripStops.tripId, trips.id))
      .where(eq(tripStops.id, data.tripStopId))
      .limit(1);

    if (!stopWithTrip.length || stopWithTrip[0].tripUserId !== context.user.id) {
      throw new Error("Stop not found or access denied");
    }

    const [newActivity] = await db
      .insert(tripStopActivities)
      .values({
        tripStopId: data.tripStopId,
        activityCategory: data.activityCategory,
        activityName: data.activityName,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        actualCost: data.actualCost,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .returning();

    return newActivity;
  });

export const updateActivity = createServerFn({ method: "PUT" })
  .validator(z.object({
    activityId: z.number(),
    activityCategory: z.enum(["sightseeing", "food", "entertainment", "adventure", "culture", "shopping", "relaxation", "transportation", "accommodation", "other"]).optional(),
    activityName: z.string().optional(),
    scheduledDate: z.string().optional(),
    actualCost: z.number().optional(),
    notes: z.string().optional(),
    isCompleted: z.boolean().optional(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip stop and trip
    const activityWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripStopActivities)
      .innerJoin(tripStops, eq(tripStopActivities.tripStopId, tripStops.id))
      .innerJoin(trips, eq(tripStops.tripId, trips.id))
      .where(eq(tripStopActivities.id, data.activityId))
      .limit(1);

    if (!activityWithTrip.length || activityWithTrip[0].tripUserId !== context.user.id) {
      throw new Error("Activity not found or access denied");
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (data.activityCategory !== undefined) updateData.activityCategory = data.activityCategory;
    if (data.activityName !== undefined) updateData.activityName = data.activityName;
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    const [updatedActivity] = await db
      .update(tripStopActivities)
      .set(updateData)
      .where(eq(tripStopActivities.id, data.activityId))
      .returning();

    return updatedActivity;
  });

export const deleteActivity = createServerFn({ method: "DELETE" })
  .validator(z.object({ activityId: z.number() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    // Verify ownership through trip stop and trip
    const activityWithTrip = await db
      .select({ tripUserId: trips.userId })
      .from(tripStopActivities)
      .innerJoin(tripStops, eq(tripStopActivities.tripStopId, tripStops.id))
      .innerJoin(trips, eq(tripStops.tripId, trips.id))
      .where(eq(tripStopActivities.id, data.activityId))
      .limit(1);

    if (!activityWithTrip.length || activityWithTrip[0].tripUserId !== context.user.id) {
      throw new Error("Activity not found or access denied");
    }

    await db.delete(tripStopActivities).where(eq(tripStopActivities.id, data.activityId));
    
    return { success: true };
  });
