import { betterAuth } from "better-auth";
import { reactStartCookies } from "./react-start";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as authSchema from "./db/schema/auth";

export const auth = betterAuth({
  appName: "Globe Trotter",
  advanced: {
    cookiePrefix: "gt_",
  },
  plugins: [reactStartCookies()],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.users,
      session: authSchema.sessions,
      account: authSchema.accounts,
      verification: authSchema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
