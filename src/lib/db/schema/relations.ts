import { relations } from "drizzle-orm";
import { users } from "./auth";
import {
  cities,
  countries,
  trips,
  tripStops,
  tripStopActivities,
  sharedTrips,
} from "./travel";

// Country relations
export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
  tripStops: many(tripStops),
  users: many(users),
}));

// City relations
export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  tripStops: many(tripStops),
  users: many(users),
}));

// Trip relations
export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  tripStops: many(tripStops),
  sharedTrips: many(sharedTrips),
}));

// Trip stops relations
export const tripStopsRelations = relations(tripStops, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripStops.tripId],
    references: [trips.id],
  }),
  country: one(countries, {
    fields: [tripStops.countryId],
    references: [countries.id],
  }),
  city: one(cities, {
    fields: [tripStops.cityId],
    references: [cities.id],
  }),
  activities: many(tripStopActivities),
}));

// Trip activities relations
export const tripActivitiesRelations = relations(
  tripStopActivities,
  ({ one }) => ({
    tripStop: one(tripStops, {
      fields: [tripStopActivities.tripStopId],
      references: [tripStops.id],
    }),
  })
);

// Shared trips relations
export const sharedTripsRelations = relations(sharedTrips, ({ one }) => ({
  trip: one(trips, {
    fields: [sharedTrips.tripId],
    references: [trips.id],
  }),
}));
