import type { Volunteer } from "@/generated/prisma/client";
import { z } from "zod";
import { CreateUserSchema } from "@/lib/validators/user.validator";

export const RegisterVolunteerSchema = CreateUserSchema.extend({
  phone: z.string().min(1, "El teléfono es requerido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  profession: z.string().min(1, "La profesión es requerida"),
  emergencyContactName: z.string().min(1, "El contacto de emergencia es requerido"),
  emergencyContactPhone: z.string().min(1, "El teléfono de emergencia es requerido"),
  inmediateAvailability: z.boolean().default(false),
});

export type RegisterVolunteerCommand = z.infer<typeof RegisterVolunteerSchema>;
export type { Volunteer };
