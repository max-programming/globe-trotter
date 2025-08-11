import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAllCountries,
  getCountryCities,
} from "./db-functions/countries-and-cities";

export const getCountries = createServerFn({
  method: "GET",
  type: "static",
}).handler(async () => {
  return getAllCountries();
});

export const getCitiesByCountry = createServerFn({
  method: "GET",
})
  .validator(z.object({ countryId: z.number() }))
  .handler(async ({ data }) => {
    return getCountryCities(data.countryId);
  });
