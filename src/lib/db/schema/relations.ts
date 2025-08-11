import { relations } from "drizzle-orm";
import { users } from "./auth";
import {
  cities,
  countries,
  trips,
  tripItinerary,
  tripPlaces,
  sharedTrips,
} from "./travel";

// Country relations
export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
  users: many(users),
}));

// City relations
export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  users: many(users),
}));

// Trip relations
export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  itinerary: many(tripItinerary),
  sharedTrips: many(sharedTrips),
}));

// Trip itinerary relations
export const tripItineraryRelations = relations(tripItinerary, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripItinerary.tripId],
    references: [trips.id],
  }),
  places: many(tripPlaces),
}));

// Trip places relations
export const tripPlacesRelations = relations(tripPlaces, ({ one }) => ({
  itinerary: one(tripItinerary, {
    fields: [tripPlaces.tripItineraryId],
    references: [tripItinerary.id],
  }),
}));

// Shared trips relations
export const sharedTripsRelations = relations(sharedTrips, ({ one }) => ({
  trip: one(trips, {
    fields: [sharedTrips.tripId],
    references: [trips.id],
  }),
}));
