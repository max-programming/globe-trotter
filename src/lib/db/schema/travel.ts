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

export const countries = pgTable("countries", (t) => ({
  id: t.serial().primaryKey(),
  name: t.text().notNull(),
  code: t.text().notNull(), // ISO 3166-1 alpha-2 code
  region: t.text(), // continent/region
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

// Enums for better type safety and data integrity
export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "planned",
  "active",
  "completed",
  "cancelled",
]);

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

export const activityCategoryEnum = pgEnum("activity_category", [
  "sightseeing",
  "food",
  "entertainment",
  "adventure",
  "culture",
  "shopping",
  "relaxation",
  "transportation",
  "accommodation",
  "other",
]);

// Trip activities - activities assigned to specific trip stops
export const tripStopActivities = pgTable(
  "trip_stop_activities",
  (t) => ({
    id: t.serial().primaryKey(),
    tripStopId: t
      .text()
      .notNull()
      .references(() => tripStops.id, { onDelete: "cascade" }),
    activityCategory: activityCategoryEnum().notNull(),
    activityName: t.text().notNull(),
    scheduledDate: t.timestamp(),
    actualCost: t.doublePrecision(),
    notes: t.text(),
    isCompleted: t.boolean().default(false),
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
    stopIdx: index("trip_activities_stop_idx").on(table.tripStopId),
    activityCategoryIdx: index("trip_activities_activity_category_idx").on(
      table.activityCategory
    ),
    dateIdx: index("trip_activities_date_idx").on(table.scheduledDate),
  })
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
