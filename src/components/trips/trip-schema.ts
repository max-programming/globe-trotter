import { z } from "zod";

export const createTripSchema = z
  .object({
    name: z.string().trim().min(1, "Trip name is required"),
    startDate: z.date(),
    endDate: z.date(),
    countryId: z.number({ message: "Please select a country" }),
    coverImageUrl: z
      .union([
        z.string().url({ message: "Invalid URL" }),
        z.undefined(),
        z.literal(""),
      ])
      .transform((v) => (v === "" ? undefined : v)),
    totalBudget: z
      .number()
      .nonnegative({ message: "Must be >= 0" })
      .max(1_000_000_000, { message: "Budget too large" })
      .optional(),
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
