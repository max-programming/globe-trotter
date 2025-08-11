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
  tripPlaces,
} from "~/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import {
  generateTripRecommendations,
  type UserProfile,
} from "~/lib/services/llm";
import { searchPexelsImage } from "./pexels";
import { searchAndGetPlaceDetails } from "./places-lookup";

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

      // Fetch destination image from Pexels if not already set
      let destinationImageUrl = recommendation.destinationImageUrl;
      if (!destinationImageUrl && recommendation.destinationName) {
        try {
          const pexelsResult = await searchPexelsImage({
            data: { query: recommendation.destinationName },
          });
          if (pexelsResult.success) {
            destinationImageUrl = pexelsResult.imageUrl;
          }
        } catch (error) {
          console.warn("Failed to fetch destination image:", error);
          // Continue without image - this is non-critical
        }
      }

      // Handle place data upsert (similar to manual trip creation)
      let existingPlace = null;
      let finalPlaceId = recommendation.placeId;

      if (recommendation.placeId) {
        // Check if place exists
        existingPlace = await db.query.places.findFirst({
          where: eq(places.placeId, recommendation.placeId),
        });

        // If place doesn't exist and we have place data from recommendation, create it
        if (!existingPlace && recommendation.place) {
          try {
            [existingPlace] = await db
              .insert(places)
              .values({
                placeId: recommendation.place.placeId,
                name:
                  recommendation.place.name || recommendation.destinationName,
                formattedAddress:
                  recommendation.place.formattedAddress ||
                  recommendation.destinationName,
                mainText:
                  recommendation.place.mainText ||
                  recommendation.destinationName,
                secondaryText: recommendation.place.secondaryText || null,
                placeTypes: recommendation.place.placeTypes || [],
                latitude: recommendation.place.latitude,
                longitude: recommendation.place.longitude,
                countryCode: recommendation.place.countryCode,
                countryName: recommendation.place.countryName,
                administrativeLevels: recommendation.place.administrativeLevels,
                timezone: recommendation.place.timezone,
                photoReference: recommendation.place.photoReference,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();
          } catch (placeError) {
            console.warn("Failed to create place record:", placeError);
            existingPlace = null;
          }
        }
      }

      // If we still don't have place data, try to lookup using destination name
      if (!existingPlace && recommendation.destinationName) {
        try {
          const placeSearchResult = await searchAndGetPlaceDetails({
            data: { query: recommendation.destinationName },
          });

          if (placeSearchResult.success && placeSearchResult.placeData) {
            const placeData = placeSearchResult.placeData;

            // Check if this place already exists (avoid duplicates)
            const existingPlaceByName = await db.query.places.findFirst({
              where: eq(places.placeId, placeData.placeId),
            });

            if (existingPlaceByName) {
              existingPlace = existingPlaceByName;
              finalPlaceId = existingPlaceByName.placeId;
            } else {
              // Create new place record
              [existingPlace] = await db
                .insert(places)
                .values({
                  placeId: placeData.placeId,
                  name: placeData.name,
                  formattedAddress: placeData.formattedAddress,
                  mainText: placeData.mainText,
                  secondaryText: placeData.secondaryText || null,
                  placeTypes: placeData.placeTypes,
                  latitude: placeData.latitude,
                  longitude: placeData.longitude,
                  countryCode: placeData.countryCode,
                  countryName: placeData.countryName,
                  administrativeLevels: placeData.administrativeLevels,
                  timezone: placeData.timezone,
                  photoReference: placeData.photoReference,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();

              finalPlaceId = placeData.placeId;
            }
          }
        } catch (placeError) {
          console.warn("Failed to lookup and create place:", placeError);
          // Continue without place - trip can still be created
        }
      }

      // Create a new trip based on recommendation
      const [newTrip] = await db
        .insert(trips)
        .values({
          name: recommendation.name,
          description: recommendation.description,
          destinationName: recommendation.destinationName,
          destinationImageUrl,
          placeId: finalPlaceId,
          totalBudget: recommendation.suggestedBudget,
          startDate: data.startDate,
          endDate: data.endDate,
          isPublic: data.visibility === "public",
          userId: context.user.id,
        })
        .returning();

      // Generate daily itinerary entries and convert activities to trip places
      let createdItinerary: any[] = [];
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
          createdItinerary = await db
            .insert(tripItinerary)
            .values(itineraryEntries)
            .returning();
        }
      }

      // Convert recommendation activities to trip places
      if (
        recommendation.activities &&
        recommendation.activities.length > 0 &&
        createdItinerary.length > 0
      ) {
        // Group activities by day
        const activitiesByDay: { [key: number]: any[] } = {};
        recommendation.activities.forEach(activity => {
          const day = activity.suggestedDay || 1;
          if (!activitiesByDay[day]) {
            activitiesByDay[day] = [];
          }
          activitiesByDay[day].push(activity);
        });

        // Process each day's activities
        for (const [dayNumber, dayActivities] of Object.entries(
          activitiesByDay
        )) {
          const dayIndex = parseInt(dayNumber) - 1; // Convert to 0-based index
          const itineraryEntry = createdItinerary[dayIndex];

          if (!itineraryEntry) continue; // Skip if no itinerary entry for this day

          // Process activities for this day
          for (let i = 0; i < dayActivities.length; i++) {
            const activity = dayActivities[i];
            let activityPlaceId = null;

            // Try to find or create a place for this activity
            if (activity.placeName) {
              try {
                // First, try to find existing place by name (fuzzy search)
                let existingActivityPlace = await db.query.places.findFirst({
                  where: sql`LOWER(${places.name}) LIKE LOWER(${`%${activity.placeName}%`})`,
                });

                if (!existingActivityPlace) {
                  // Try to get place details from Google Places
                  const placeSearchResult = await searchAndGetPlaceDetails({
                    data: { query: activity.placeName },
                  });

                  if (
                    placeSearchResult.success &&
                    placeSearchResult.placeData
                  ) {
                    const placeData = placeSearchResult.placeData;

                    // Create new place record
                    [existingActivityPlace] = await db
                      .insert(places)
                      .values({
                        placeId: placeData.placeId,
                        name: placeData.name,
                        formattedAddress: placeData.formattedAddress,
                        mainText: placeData.mainText,
                        secondaryText: placeData.secondaryText || null,
                        placeTypes: placeData.placeTypes,
                        latitude: placeData.latitude,
                        longitude: placeData.longitude,
                        countryCode: placeData.countryCode,
                        countryName: placeData.countryName,
                        administrativeLevels: placeData.administrativeLevels,
                        timezone: placeData.timezone,
                        photoReference: placeData.photoReference,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      })
                      .returning();
                  }
                }

                activityPlaceId = existingActivityPlace?.placeId || null;
              } catch (error) {
                console.warn(
                  `Failed to create place for activity "${activity.name}":`,
                  error
                );
                // Continue without place - activity can still be added as trip place
              }
            }

            // Create trip place entry (even without a specific place)
            try {
              const tripPlaceData = {
                tripItineraryId: itineraryEntry.id,
                sortOrder: i * 100, // Space activities 100 apart for easy reordering
                scheduledTime: null, // Could be set based on activity time if available
                userNotes: `${activity.name}${activity.description ? ` - ${activity.description}` : ""}`,
                isVisited: false,
                userRating: null,
                visitDuration: activity.estimatedDuration || null,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Only add placeId if we have one (required field)
              const placeIdToUse = activityPlaceId || finalPlaceId;
              if (placeIdToUse) {
                await db.insert(tripPlaces).values({
                  ...tripPlaceData,
                  placeId: placeIdToUse,
                });
              } else {
                console.warn(
                  `Skipping activity "${activity.name}" - no valid place ID found`
                );
              }
            } catch (error) {
              console.warn(
                `Failed to create trip place for activity "${activity.name}":`,
                error
              );
              // Continue with other activities even if one fails
            }
          }
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
