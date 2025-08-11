import { z } from "zod";

export const createTripSchema = z
  .object({
    destination: z.string().min(1, "Please select a destination"),
    startDate: z.date({ message: "Start date is required" }),
    endDate: z.date({ message: "End date is required" }),
    visibility: z.enum(["private", "public"]),
    // Place data from Google Places
    place: z.object({
      place_id: z.string(),
      description: z.string(),
      main_text: z.string(),
      secondary_text: z.string().optional(),
      types: z.array(z.string()),
      latitude: z.number(),
      longitude: z.number(),
    }),
    // Optional image URL from Pexels
    imageUrl: z.string().url().optional(),
  })
  .refine(
    data => {
      return data.endDate >= data.startDate;
    },
    { path: ["endDate"], message: "End date cannot be before start date" }
  );

type CreateTripFormData = z.infer<typeof createTripSchema>;

export type { CreateTripFormData };
