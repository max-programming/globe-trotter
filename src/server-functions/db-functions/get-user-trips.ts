import { eq, count, getTableColumns } from "drizzle-orm";
import { db, trips, tripStops } from "~/lib/db";

export async function getUserTrips(userId: string) {
  return db
    .select({
      ...getTableColumns(trips),
      tripStopsCount: count(tripStops.id),
    })
    .from(trips)
    .where(eq(trips.userId, userId))
    .leftJoin(tripStops, eq(trips.id, tripStops.tripId))
    .groupBy(trips.id);
}
