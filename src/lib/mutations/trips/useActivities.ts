import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createActivity, updateActivity, deleteActivity } from "~/server-functions/trip";

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const createActivityFn = useServerFn(createActivity);

  return useMutation({
    mutationFn: async (data: Parameters<typeof createActivityFn>[0]["data"]) => {
      return await createActivityFn({ data });
    },
    onSuccess: () => {
      // Invalidate trip stops queries to refresh activities
      queryClient.invalidateQueries({ 
        queryKey: ["trips"], 
        predicate: (query) => query.queryKey.includes("stops")
      });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  const updateActivityFn = useServerFn(updateActivity);

  return useMutation({
    mutationFn: async (data: Parameters<typeof updateActivityFn>[0]["data"]) => {
      return await updateActivityFn({ data });
    },
    onSuccess: () => {
      // Invalidate trip stops queries to refresh activities
      queryClient.invalidateQueries({ 
        queryKey: ["trips"], 
        predicate: (query) => query.queryKey.includes("stops")
      });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  const deleteActivityFn = useServerFn(deleteActivity);

  return useMutation({
    mutationFn: async (data: Parameters<typeof deleteActivityFn>[0]["data"]) => {
      return await deleteActivityFn({ data });
    },
    onSuccess: () => {
      // Invalidate trip stops queries to refresh activities
      queryClient.invalidateQueries({ 
        queryKey: ["trips"], 
        predicate: (query) => query.queryKey.includes("stops")
      });
    },
  });
}