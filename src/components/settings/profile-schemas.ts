import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  cityId: z.number().optional(),
  countryId: z.number().optional(),
  additionalInfo: z.string().optional(),
  image: z.string().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
