import { z } from "zod";

export const createTripSchema = z
  .object({
    name: z.string().min(1, "Trip name is required"),
    startDate: z.date(),
    endDate: z.date(),
    countryId: z.number({ message: "Please select a country" }),
    coverImageUrl: z.string().url({ message: "Invalid URL" }).optional(),
    totalBudget: z.number().nonnegative({ message: "Must be >= 0" }).optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return false;
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before start date" }
  );

type CreateTripFormData = z.infer<typeof createTripSchema>;

export type { CreateTripFormData };
