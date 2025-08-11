import { queryOptions } from "@tanstack/react-query";
import { getSession } from "~/server-functions/auth";

export const getSessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: getSession,
  staleTime: 1000 * 60 * 15,
});
