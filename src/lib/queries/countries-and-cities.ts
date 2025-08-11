import { queryOptions } from "@tanstack/react-query";
import {
  getCountries,
  getCitiesByCountry,
} from "~/server-functions/countries-and-cities";

export const getCountriesQuery = queryOptions({
  queryKey: ["countries"] as const,
  queryFn: () => getCountries(),
  staleTime: 1000 * 60 * 60, // 1 hour - countries don't change often
});

export function getCitiesByCountryQuery(countryId: number | undefined) {
  return queryOptions({
    queryKey: ["cities", countryId] as const,
    queryFn: () => getCitiesByCountry({ data: { countryId: countryId! } }),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 30, // 30 minutes - cities don't change often
  });
}
