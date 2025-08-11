import { db } from "~/lib/db";
import { eq } from "drizzle-orm";
import { cities } from "~/lib/db/schema";

export async function getAllCountries() {
  return db.query.countries.findMany();
}

export async function getCountryCities(countryId: number) {
  return db.query.cities.findMany({
    where: eq(cities.countryId, countryId),
  });
}
