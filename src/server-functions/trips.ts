import { createServerFn } from "@tanstack/react-start";
import { getUserTrips } from "./db-functions/get-user-trips";
import { authMiddleware } from "./auth-middleware";

export const getUserTripsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return getUserTrips(context.session.userId);
  });
