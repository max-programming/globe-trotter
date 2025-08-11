import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "~/server-functions/profile";

export const getCurrentUserQuery = queryOptions({
  queryKey: ["user", "current"] as const,
  queryFn: getCurrentUser,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
