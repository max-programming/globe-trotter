import { createMiddleware } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });
    if (!session) {
      throw new UnauthorizedError("Unauthorized");
    }
    return next({ context: session });
  }
);

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
