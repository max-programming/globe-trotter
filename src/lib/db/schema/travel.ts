import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { nanoid } from "nanoid";
import { activityCategories, tripStatuses } from "./constants";

export const countries = pgTable("countries", (t) => ({
  id: t.serial().primaryKey(),
  name: t.text().notNull(),
  code: t.text().notNull(), // ISO 3166-1 alpha-2 code
  region: t.text(), // continent/region
  currency: t.text(), // ISO 4217 currency code
  createdAt: t
    .timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: t
    .timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
}));

// Cities master table - global destination data
export const cities = pgTable(
  "cities",
  (t) => ({
    id: t.serial().primaryKey(),
    name: t.text().notNull(),
    countryId: t
      .integer()
      .notNull()
      .references(() => countries.id),
    latitude: t.doublePrecision(),
    longitude: t.doublePrecision(),
    timezone: t.text(),
    popularity: t.integer().default(0), // usage count for recommendations
    description: t.text(),
    imageUrl: t.text(),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    countryIdx: index("cities_country_idx").on(table.countryId),
    cityCountryIdx: index("cities_city_country_idx").on(
      table.countryId,
      table.id
    ),
    popularityIdx: index("cities_popularity_idx").on(table.popularity),
    cityNameIdx: index("cities_name_idx").on(table.name),
  })
);

export const places = pgTable(
  "places",
  (t) => ({
    id: t.serial().primaryKey(),
    placeId: t.text().notNull().unique(),
    name: t.text().notNull(),
    formattedAddress: t.text().notNull(),
    mainText: t.text().notNull(),
    secondaryText: t.text(),
    placeTypes: t.text().array(),
    latitude: t.doublePrecision(),
    longitude: t.doublePrecision(),
    countryCode: t.text(),
    countryName: t.text(),
    administrativeLevels: t.jsonb(),
    timezone: t.text(),
    photoReference: t.text(),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    placeIdIdx: index("places_place_id_idx").on(table.placeId),
    countryCodeIdx: index("places_country_code_idx").on(table.countryCode),
    placeTypesIdx: index("places_place_types_idx").on(table.placeTypes),
    nameIdx: index("places_name_idx").on(table.name),
  })
);

// Enums for better type safety and data integrity
export const tripStatusEnum = pgEnum("trip_status", tripStatuses);

// Main trips table
export const trips = pgTable(
  "trips",
  (t) => ({
    id: t
      .text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: t.text().notNull(),
    description: t.text(),
    startDate: t.timestamp(),
    endDate: t.timestamp(),
    coverImageUrl: t.text(),
    status: tripStatusEnum().default("draft").notNull(),
    totalBudget: t.doublePrecision(),
    isPublic: t.boolean().default(false).notNull(),
    placeId: t
      .text()
      .references(() => places.placeId, { onDelete: "set null" }),
    destinationName: t.text(),
    destinationImageUrl: t.text(),
    userId: t
      .text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    userIdx: index("trips_user_idx").on(table.userId),
    statusIdx: index("trips_status_idx").on(table.status),
    publicIdx: index("trips_public_idx").on(table.isPublic),
    datesIdx: index("trips_dates_idx").on(table.startDate, table.endDate),
  })
);

export const tripItinerary = pgTable(
  "trip_itinerary",
  (t) => ({
    id: t.serial().primaryKey(),
    tripId: t
      .text()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    date: t.date().notNull(),
    notes: t.text(),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    tripIdx: index("trip_itinerary_trip_idx").on(table.tripId),
    dateIdx: index("trip_itinerary_date_idx").on(table.date),
  })
);

export const tripPlaces = pgTable(
  "trip_places",
  (t) => ({
    id: t.serial().primaryKey(),
    tripItineraryId: t
      .integer()
      .notNull()
      .references(() => tripItinerary.id, { onDelete: "cascade" }),
    placeId: t
      .text()
      .notNull()
      .references(() => places.placeId, { onDelete: "restrict" }),
    name: t.text().notNull(),
    type: t.text().notNull(),
    description: t.text(),
    time: t.time(),
    notes: t.text(),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    tripItineraryIdx: index("trip_places_trip_itinerary_idx").on(
      table.tripItineraryId
    ),
    placeIdx: index("trip_places_place_idx").on(table.placeId),
  })
);

// Trip stops - cities added to specific trips with order and dates
export const tripStops = pgTable(
  "trip_stops",
  (t) => ({
    id: t
      .text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    tripId: t
      .text()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    countryId: t
      .integer()
      .notNull()
      .references(() => countries.id),
    cityId: t
      .integer()
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    budget: t.doublePrecision(), // budget for the stop
    stopOrder: t.integer().notNull(), // order within the trip // unit 100
    arrivalDate: t.date(),
    departureDate: t.date(),
    notes: t.text(),
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    tripIdx: index("trip_stops_trip_idx").on(table.tripId),
    orderIdx: index("trip_stops_order_idx").on(table.tripId, table.stopOrder),
    datesIdx: index("trip_stops_dates_idx").on(
      table.arrivalDate,
      table.departureDate
    ),
    cityCountryIdx: index("trip_stops_city_country_idx").on(
      table.cityId,
      table.countryId
    ),
    cityIdx: index("trip_stops_city_idx").on(table.cityId),
    countryIdx: index("trip_stops_country_idx").on(table.countryId),
  })
);

export const activityCategoryEnum = pgEnum(
  "activity_category",
  activityCategories
);

// export const expenseCategoryEnum = pgEnum("expense_category", [
//   "transportation",
//   "accommodation",
//   "food",
//   "activities",
//   "shopping",
//   "other",
// ]);

// // Expenses tracking for detailed budget management
// export const expenses = pgTable(
//   "expenses",
//   (t) => ({
//     id: t.text().primaryKey(),
//     tripId: t
//       .text()
//       .notNull()
//       .references(() => trips.id, { onDelete: "cascade" }),
//     tripStopId: t
//       .text()
//       .references(() => tripStops.id, { onDelete: "set null" }),
//     tripActivityId: t
//       .text()
//       .references(() => tripActivities.id, { onDelete: "set null" }),
//     category: expenseCategoryEnum().notNull(),
//     amount: t.doublePrecision().notNull(),
//     currency: t.text().default("USD").notNull(),
//     description: t.text(),
//     expenseDate: t.timestamp().notNull(),
//     receiptUrl: t.text(), // for receipt uploads
//     createdAt: t
//       .timestamp()
//       .$defaultFn(() => new Date())
//       .notNull(),
//     updatedAt: t
//       .timestamp()
//       .$defaultFn(() => new Date())
//       .notNull(),
//   }),
//   (table) => ({
//     tripIdx: index("expenses_trip_idx").on(table.tripId),
//     categoryIdx: index("expenses_category_idx").on(table.category),
//     dateIdx: index("expenses_date_idx").on(table.expenseDate),
//   })
// );

// Trip sharing and collaboration
export const sharedTrips = pgTable(
  "shared_trips",
  (t) => ({
    id: t
      .text()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    tripId: t
      .text()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    shareToken: t.text().notNull().unique(), // public URL token
    isActive: t.boolean().default(true).notNull(),
    viewCount: t.integer().default(0),
    allowCopying: t.boolean().default(true).notNull(),
    expiresAt: t.timestamp(), // optional expiration
    createdAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: t
      .timestamp()
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (table) => ({
    tripIdx: index("shared_trips_trip_idx").on(table.tripId),
    tokenIdx: index("shared_trips_token_idx").on(table.shareToken),
    activeIdx: index("shared_trips_active_idx").on(table.isActive),
  })
);

// // User saved destinations for quick access
// export const savedDestinations = pgTable(
//   "saved_destinations",
//   (t) => ({
//     id: t.text().primaryKey(),
//     userId: t
//       .text()
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     cityId: t
//       .text()
//       .notNull()
//       .references(() => cities.id, { onDelete: "cascade" }),
//     notes: t.text(),
//     createdAt: t
//       .timestamp()
//       .$defaultFn(() => new Date())
//       .notNull(),
//   }),
//   (table) => ({
//     userIdx: index("saved_destinations_user_idx").on(table.userId),
//     userCityIdx: index("saved_destinations_user_city_idx").on(
//       table.userId,
//       table.cityId
//     ),
//   })
// );
