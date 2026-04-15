import { z } from "zod"

const baseEventSchema = z.object({
  projectId:        z.number().int(),
  visibility:       z.enum(["PUBLIC", "PRIVATE"]),
  name:             z.string().min(1, "El nombre es requerido").max(150),
  description:      z.string().optional(),
  eventDate:        z.coerce.date(),
  location:         z.string().max(150).optional(),
  volunteersNeeded: z.number().int().min(0).default(0),
  status:           z.enum(["PLANNED", "OPEN", "CLOSED", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  startDate:        z.coerce.date().optional(),
  endDate:          z.coerce.date().optional(),
})

export const CreateEventSchema = baseEventSchema.refine(data => {
  if (data.startDate && data.endDate) return data.endDate > data.startDate
  return true
}, {
  message: "La fecha de fin debe ser mayor a la de inicio",
  path: ["endDate"],
})

export const UpdateEventSchema = baseEventSchema.partial().refine(data => {
  if (data.startDate && data.endDate) return data.endDate > data.startDate
  return true
}, {
  message: "La fecha de fin debe ser mayor a la de inicio",
  path: ["endDate"],
})

export const RegisterVolunteerToEventSchema = z.object({
  eventId:     z.number().int(),
  volunteerId: z.number().int(),
})

export type CreateEventDTO                  = z.infer<typeof CreateEventSchema>
export type UpdateEventDTO                  = z.infer<typeof UpdateEventSchema>
export type RegisterVolunteerToEventDTO     = z.infer<typeof RegisterVolunteerToEventSchema>
