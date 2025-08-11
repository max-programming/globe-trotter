import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { cities, countries, trips } from "./travel";

export const users = pgTable("users", (t) => ({
  id: t.text().primaryKey(),
  name: t.text().notNull(),
  email: t.text().notNull().unique(),
  emailVerified: t
    .boolean()
    .$defaultFn(() => !1)
    .notNull(),
  phone: t.text(),
  cityId: t.integer().references(() => cities.id),
  countryId: t.integer().references(() => countries.id),

  additionalInfo: t.text(),
  image: t.text(),
  createdAt: t
    .timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: t
    .timestamp()
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const sessions = pgTable("sessions", (t) => ({
  id: t.text().primaryKey(),
  expiresAt: t.timestamp().notNull(),
  token: t.text().notNull().unique(),
  createdAt: t.timestamp().notNull(),
  updatedAt: t.timestamp().notNull(),
  ipAddress: t.text(),
  userAgent: t.text(),
  userId: t
    .text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}));

export const accounts = pgTable("accounts", (t) => ({
  id: t.text().primaryKey(),
  accountId: t.text().notNull(),
  providerId: t.text().notNull(),
  userId: t
    .text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: t.text(),
  refreshToken: t.text(),
  idToken: t.text(),
  accessTokenExpiresAt: t.timestamp(),
  refreshTokenExpiresAt: t.timestamp(),
  scope: t.text(),
  password: t.text(),
  createdAt: t.timestamp().notNull(),
  updatedAt: t.timestamp().notNull(),
}));

export const verifications = pgTable("verifications", (t) => ({
  id: t.text().primaryKey(),
  identifier: t.text().notNull(),
  value: t.text().notNull(),
  expiresAt: t.timestamp().notNull(),
  createdAt: t.timestamp().$defaultFn(() => new Date()),
  updatedAt: t.timestamp().$defaultFn(() => new Date()),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  country: one(countries, {
    fields: [users.countryId],
    references: [countries.id],
  }),
  city: one(cities, {
    fields: [users.cityId],
    references: [cities.id],
  }),
  trips: many(trips),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
