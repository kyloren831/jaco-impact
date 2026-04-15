import { z } from "zod"

export const CreatePillarSchema = z.object({
  coordinatorId: z.number().int(),
  name:          z.string().min(1, "El nombre es requerido").max(100),
  description:   z.string().min(1, "La descripción es requerida"),
  iconUrl:       z.string().url("Debe ser una URL válida"),
  color:         z.string().max(30, "Máximo 30 caracteres"),
  isActive:      z.boolean().default(true),
})

export const UpdatePillarSchema = CreatePillarSchema.partial()

export type CreatePillarDTO = z.infer<typeof CreatePillarSchema>
export type UpdatePillarDTO = z.infer<typeof UpdatePillarSchema>
