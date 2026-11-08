import { z } from "zod";

export const createTechnicianSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().min(10).max(15),
  password: z.string().min(8).max(72),
  skills: z.array(z.string().trim().min(2).max(60)).min(1).max(10),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
});

export const technicianStatusSchema = z.object({
  isActive: z.boolean(),
});
