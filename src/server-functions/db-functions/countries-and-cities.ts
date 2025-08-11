import { db } from "~/lib/db";
import { eq } from "drizzle-orm";
import { cities, countries } from "~/lib/db/schema";

export async function getAllCountries() {
  return db.select().from(countries);
}

export async function getCountryCities(countryId: number) {
  return db.select().from(cities).where(eq(cities.countryId, countryId));
}
