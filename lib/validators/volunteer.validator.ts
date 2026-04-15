import { z } from "zod"

export const CreateVolunteerSchema = z.object({
  userId:                 z.number().int(),
  phone:                  z.string().min(1, "El teléfono es requerido"),
  nationality:            z.string().min(1, "La nacionalidad es requerida"),
  profession:             z.string().min(1, "La profesión es requerida"),
  emergencyContactName:   z.string().min(1, "El contacto de emergencia es requerido"),
  emergencyContactPhone:  z.string().min(1, "El teléfono de emergencia es requerido"),
  inmediateAvailability:  z.boolean(),
})

export const UpdateVolunteerSchema = CreateVolunteerSchema.omit({ userId: true }).partial()

export const CreateVolunteerAvailabilitySchema = z.object({
  volunteerId: z.number().int(),
  startDate:   z.coerce.date(),
  endDate:     z.coerce.date(),
  notes:       z.string().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "La fecha de fin debe ser mayor a la de inicio",
  path: ["endDate"],
})

export const CreateVolunteerSkillSchema = z.object({
  volunteerId: z.number().int(),
  name:        z.string().min(1).max(100),
  description: z.string().min(1),
})

export const UpdateVolunteerSkillSchema = CreateVolunteerSkillSchema.omit({ volunteerId: true }).partial()

export type CreateVolunteerDTO             = z.infer<typeof CreateVolunteerSchema>
export type UpdateVolunteerDTO             = z.infer<typeof UpdateVolunteerSchema>
export type CreateVolunteerAvailabilityDTO = z.infer<typeof CreateVolunteerAvailabilitySchema>
export type CreateVolunteerSkillDTO        = z.infer<typeof CreateVolunteerSkillSchema>
