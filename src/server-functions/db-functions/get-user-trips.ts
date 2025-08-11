import { eq, count, getTableColumns, countDistinct } from "drizzle-orm";
import { db, trips, tripStops } from "~/lib/db";

export async function getUserTrips(userId: string) {
  return db
    .select({
      ...getTableColumns(trips),
      tripStopsCount: count(tripStops.id),
      tripStopCountries: countDistinct(tripStops.countryId),
      tripStopCities: countDistinct(tripStops.cityId),
    })
    .from(trips)
    .where(eq(trips.userId, userId))
    .leftJoin(tripStops, eq(trips.id, tripStops.tripId))
    .groupBy(trips.id);
}
