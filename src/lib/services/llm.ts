import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { activityCategories } from "../db/schema/constants";

const tripRecommendationSchema = z.object({
  trips: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      destinationName: z.string(),
      suggestedDuration: z.number(),
      suggestedBudget: z.number().optional(),
      suggestedSeason: z.enum(["spring", "summer", "fall", "winter", "any"]),
      tripType: z.enum([
        "adventure",
        "relaxation",
        "culture",
        "food",
        "nightlife",
        "business",
        "family",
      ]),
      activities: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          category: z.string(),
          suggestedDay: z.number(),
          estimatedDuration: z.number(),
          estimatedCost: z.number().optional(),
          placeName: z.string().optional(),
        })
      ),
    })
  ),
});

export interface UserProfile {
  country: string;
  city?: string;
  previousTrips: Array<{
    destinationName: string;
    tripType?: string;
    duration?: number;
    activities?: string[];
  }>;
  preferences?: string;
}

export async function generateTripRecommendations(userProfile: UserProfile) {
  const prompt = `
    Generate 3-5 personalized trip recommendations for a user based on their profile:

    User Location: ${userProfile.city ? `${userProfile.city}, ` : ""}${userProfile.country}
    
    Previous Trips:
    ${
      userProfile.previousTrips
        .map(
          (trip) =>
            `- ${trip.destinationName} (${trip.duration || "unknown"} days, ${trip.tripType || "general"} trip)`
        )
        .join("\n") || "No previous trips recorded"
    }

    Requirements:
    - Suggest destinations different from their previous trips but within reasonable travel distance/budget
    - Make sure the destinations are popular and well-known and real places.
    - Consider their location for practical travel options
    - Vary trip types and durations (weekend trips, week-long, extended trips)
    - Include specific activities for each day of the trip
    - Provide realistic cost estimates in USD
    - Focus on achievable and practical recommendations
    - Make activities interesting and engaging
    - Consider different seasons and optimal travel times

    Generate diverse recommendations covering different:
    - Trip types (adventure, culture, relaxation, food, nightlife, family, etc.)
    - Durations (2-3 days for weekend, 5-7 days for week, 10+ days for extended)
    - Budgets (budget-friendly $500-1500, mid-range $1500-4000, luxury $4000+)
    - Seasons (when best to visit each destination)
    - Activities should be realistic and include estimated duration in minutes and cost

    Make sure each trip has 3-7 activities distributed across the suggested days.
  `;

  try {
    const result = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: tripRecommendationSchema,
      prompt,
    });

    return result.object.trips;
  } catch (error) {
    console.error("Error generating trip recommendations:", error);
    throw new Error(
      "Failed to generate trip recommendations. Please try again later."
    );
  }
}
