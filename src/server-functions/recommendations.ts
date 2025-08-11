import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import {
  users,
  trips,
  recommendedTrips,
  recommendedTripActivities,
  places,
  tripItinerary,
} from "~/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import {
  generateTripRecommendations,
  type UserProfile,
} from "~/lib/services/llm";
import { searchPexelsImage } from "./pexels";

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const user = context.user;

    try {
      // Get user's location and previous trips
      const userWithData = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
          country: true,
          city: true,
          trips: {
            where: eq(trips.status, "completed"),
            orderBy: desc(trips.createdAt),
            limit: 10,
          },
        },
      });

      if (!userWithData?.country) {
        throw new Error(
          "User location not found. Please update your profile with your country information."
        );
      }

      // Prepare user profile for LLM
      const userProfile: UserProfile = {
        country: userWithData.country.name,
        city: userWithData.city?.name,
        previousTrips: userWithData.trips.map(trip => ({
          destinationName: trip.destinationName || "Unknown",
          duration:
            trip.startDate && trip.endDate
              ? Math.ceil(
                  (new Date(trip.endDate).getTime() -
                    new Date(trip.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : undefined,
        })),
      };

      // Generate recommendations using LLM
      const recommendations = await generateTripRecommendations(userProfile);

      // Save recommendations to database
      const savedRecommendations = [];
      for (const rec of recommendations) {
        // Try to find matching place
        let placeId = null;
        if (rec.destinationName) {
          const place = await db.query.places.findFirst({
            where: sql`LOWER(${places.name}) LIKE LOWER(${`%${rec.destinationName}%`})`,
          });
          placeId = place?.placeId || null;
        }

        const [savedRec] = await db
          .insert(recommendedTrips)
          .values({
            userId: user.id,
            name: rec.name,
            description: rec.description,
            destinationName: rec.destinationName,
            placeId,
            suggestedDuration: rec.suggestedDuration,
            suggestedBudget: rec.suggestedBudget,
            suggestedSeason: rec.suggestedSeason,
            tripType: rec.tripType,
            llmModel: "gpt-4o-mini",
            generationPrompt: JSON.stringify(userProfile),
          })
          .returning();

        // Save activities
        if (rec.activities && rec.activities.length > 0) {
          await db.insert(recommendedTripActivities).values(
            rec.activities.map((activity, index) => ({
              recommendedTripId: savedRec.id,
              name: activity.name,
              description: activity.description,
              category: activity.category as any, // Cast to enum
              suggestedDay: activity.suggestedDay,
              estimatedDuration: activity.estimatedDuration,
              estimatedCost: activity.estimatedCost,
              placeName: activity.placeName,
              sortOrder: index * 100,
            }))
          );
        }

        savedRecommendations.push(savedRec);
      }

      return savedRecommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate recommendations"
      );
    }
  });

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const recommendations = await db.query.recommendedTrips.findMany({
        where: and(
          eq(recommendedTrips.userId, context.user.id),
          isNull(recommendedTrips.dismissedAt)
        ),
        with: {
          activities: {
            orderBy: [
              recommendedTripActivities.suggestedDay,
              recommendedTripActivities.sortOrder,
            ],
          },
        },
        orderBy: desc(recommendedTrips.generatedAt),
        limit: 10,
      });

      return recommendations;
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw new Error("Failed to fetch recommendations");
    }
  });

export const markRecommendationAsViewed = createServerFn({ method: "POST" })
  .validator(z.object({ recommendationId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    try {
      await db
        .update(recommendedTrips)
        .set({
          viewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recommendedTrips.id, data.recommendationId),
            eq(recommendedTrips.userId, context.user.id)
          )
        );

      return { success: true };
    } catch (error) {
      console.error("Error marking recommendation as viewed:", error);
      throw new Error("Failed to mark recommendation as viewed");
    }
  });

export const dismissRecommendation = createServerFn({ method: "POST" })
  .validator(z.object({ recommendationId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    try {
      await db
        .update(recommendedTrips)
        .set({
          dismissedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recommendedTrips.id, data.recommendationId),
            eq(recommendedTrips.userId, context.user.id)
          )
        );

      return { success: true };
    } catch (error) {
      console.error("Error dismissing recommendation:", error);
      throw new Error("Failed to dismiss recommendation");
    }
  });

export const getRecommendation = createServerFn({ method: "GET" })
  .validator(z.object({ recommendationId: z.string() }))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    try {
      const recommendation = await db.query.recommendedTrips.findFirst({
        where: and(
          eq(recommendedTrips.id, data.recommendationId),
          eq(recommendedTrips.userId, context.user.id),
          isNull(recommendedTrips.dismissedAt)
        ),
        with: {
          activities: {
            orderBy: [
              recommendedTripActivities.suggestedDay,
              recommendedTripActivities.sortOrder,
            ],
          },
          place: true,
          user: {
            with: {
              country: true,
              city: true,
            },
          },
        },
      });

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      return recommendation;
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      throw new Error("Failed to fetch recommendation");
    }
  });

export const convertRecommendationToTrip = createServerFn({ method: "POST" })
  .validator(
    z.object({
      recommendationId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      visibility: z.enum(["private", "public"]),
    })
  )
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    try {
      const recommendation = await db.query.recommendedTrips.findFirst({
        where: and(
          eq(recommendedTrips.id, data.recommendationId),
          eq(recommendedTrips.userId, context.user.id)
        ),
        with: {
          activities: true,
          place: true,
        },
      });

      if (!recommendation) {
        throw new Error("Recommendation not found");
      }

      // Create a new trip based on recommendation
      const [newTrip] = await db
        .insert(trips)
        .values({
          name: recommendation.name,
          description: recommendation.description,
          destinationName: recommendation.destinationName,
          destinationImageUrl: recommendation.destinationImageUrl,
          placeId: recommendation.placeId,
          totalBudget: recommendation.suggestedBudget,
          startDate: data.startDate,
          endDate: data.endDate,
          isPublic: data.visibility === "public",
          userId: context.user.id,
        })
        .returning();

      // Generate daily itinerary entries
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

      // Mark recommendation as converted
      await db
        .update(recommendedTrips)
        .set({
          convertedToTripAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(recommendedTrips.id, data.recommendationId));

      return newTrip;
    } catch (error) {
      console.error("Error converting recommendation to trip:", error);
      throw new Error("Failed to convert recommendation to trip");
    }
  });
