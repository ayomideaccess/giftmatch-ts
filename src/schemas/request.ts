import { z } from "zod";

export const specialRequestSchema = z.object({
  name: z.string().trim().min(3),
  emailAdd: z.string().trim().email(),
  phone: z.string().trim().min(10),
  wantToGift: z.string().trim().min(2),
  description: z.string().trim().min(5),
});