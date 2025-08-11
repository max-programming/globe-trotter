import { drizzle } from "drizzle-orm/postgres-js";
import { EnhancedQueryLogger } from "drizzle-query-logger";
import postgres from "postgres";
import { config } from "dotenv";
import * as schema from "./schema";

config();

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, {
  casing: "snake_case",
  schema,
  logger: new EnhancedQueryLogger(),
});

export { client };
