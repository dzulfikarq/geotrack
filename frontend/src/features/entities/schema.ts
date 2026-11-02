import { z } from "zod";
import { statuses } from "./types";

export const entitySchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9-]{3,32}$/, "Use 3–32 letters, numbers, or hyphens"),
  name: z.string().trim().min(2, "Use at least 2 characters").max(100, "Use at most 100 characters"),
	category_id: z.string().uuid("Choose a category"),
  status: z.enum(statuses),
  latitude: z.number().finite("Enter a valid latitude").min(-90, "Must be at least -90").max(90, "Must be at most 90"),
  longitude: z.number().finite("Enter a valid longitude").min(-180, "Must be at least -180").max(180, "Must be at most 180"),
  description: z.string().trim().max(500, "Use at most 500 characters"),
});
