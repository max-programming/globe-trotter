import { createServerFn } from "@tanstack/react-start";
import { createTripSchema } from "~/components/trips/trip-schema";
import { authMiddleware } from "./auth-middleware";
import { db } from "~/lib/db";
import { trips } from "~/lib/db/schema";

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
