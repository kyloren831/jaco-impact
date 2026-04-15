import { z } from "zod"

const baseTaskSchema = z.object({
  eventId:     z.number().int(),
  title:       z.string().min(1, "El título es requerido").max(150),
  description: z.string().optional(),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH"]),
  taskStatus:  z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"]).default("OPEN"),
  startDate:   z.coerce.date().optional(),
  dueDate:     z.coerce.date().optional(),
})

export const CreateTaskSchema = baseTaskSchema.refine(data => {
  if (data.startDate && data.dueDate) return data.dueDate > data.startDate
  return true
}, {
  message: "La fecha de vencimiento debe ser mayor a la de inicio",
  path: ["dueDate"],
})

export const UpdateTaskSchema = baseTaskSchema.partial().refine(data => {
  if (data.startDate && data.dueDate) return data.dueDate > data.startDate
  return true
}, {
  message: "La fecha de vencimiento debe ser mayor a la de inicio",
  path: ["dueDate"],
})

export const AssignTaskToVolunteerSchema = z.object({
  taskId:      z.number().int(),
  volunteerId: z.number().int(),
})

export const UpdateTaskAssignmentSchema = z.object({
  status:         z.enum(["ASSIGNED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]),
  completionNote: z.string().optional(),
})

export const CreateTaskEvidenceSchema = z.object({
  taskId:      z.number().int(),
  volunteerId: z.number().int(),
  fileUrl:     z.string().url("Debe ser una URL válida"),
  fileType:    z.enum(["IMAGE", "VIDEO", "DOCUMENT", "OTHER"]),
  description: z.string().optional(),
})

export const ReviewTaskEvidenceSchema = z.object({
  status:  z.enum(["PENDING", "APPROVED", "REJECTED"]),
})

export type CreateTaskDTO              = z.infer<typeof CreateTaskSchema>
export type UpdateTaskDTO              = z.infer<typeof UpdateTaskSchema>
export type AssignTaskToVolunteerDTO   = z.infer<typeof AssignTaskToVolunteerSchema>
export type UpdateTaskAssignmentDTO    = z.infer<typeof UpdateTaskAssignmentSchema>
export type CreateTaskEvidenceDTO      = z.infer<typeof CreateTaskEvidenceSchema>
export type ReviewTaskEvidenceDTO      = z.infer<typeof ReviewTaskEvidenceSchema>
