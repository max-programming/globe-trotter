import { eq } from "drizzle-orm";
import { db, trips } from "~/lib/db";

export async function getUserTrips(userId: string) {
  return db.query.trips.findMany({
    where: eq(trips.userId, userId),
    with: {
      tripStops: {
        with: {
          activities: true,
        },
      },
    },
  });
}
