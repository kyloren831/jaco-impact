import { z } from "zod"

const baseProjectSchema = z.object({
  pillarId:    z.number().int(),
  name:        z.string().min(1, "El nombre es requerido").max(150),
  description: z.string().min(1, "La descripción es requerida"),
  objectives:  z.string().optional(),
  status:      z.enum(["DRAFT", "PUBLISHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("DRAFT"),
  visibility:  z.enum(["PUBLIC", "PRIVATE"]),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional(),
})

export const CreateProjectSchema = baseProjectSchema.refine(data => {
  if (data.startDate && data.endDate) return data.endDate > data.startDate
  return true
}, {
  message: "La fecha de fin debe ser mayor a la de inicio",
  path: ["endDate"],
})

export const UpdateProjectSchema = baseProjectSchema.partial().refine(data => {
  if (data.startDate && data.endDate) return data.endDate > data.startDate
  return true
}, {
  message: "La fecha de fin debe ser mayor a la de inicio",
  path: ["endDate"],
})

export type CreateProjectDTO = z.infer<typeof CreateProjectSchema>
export type UpdateProjectDTO = z.infer<typeof UpdateProjectSchema>
