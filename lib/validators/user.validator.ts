import { z } from "zod"

export const CreateUserSchema = z.object({
  name:     z.string().min(1, "El nombre es requerido").max(100),
  email:    z.string().email("Email inválido").max(150),
  password: z.string().min(8, "Mínimo 8 caracteres").max(255),
  isActive: z.boolean().default(true),
})

export const UpdateUserSchema = CreateUserSchema.partial()

export const AssignRoleSchema = z.object({
  userId: z.number().int(),
  role:   z.enum(["ADMIN", "COORDINATOR", "MODERATOR", "VOLUNTEER", "PYME_MANAGER"]),
})

export type CreateUserDTO     = z.infer<typeof CreateUserSchema>
export type UpdateUserDTO     = z.infer<typeof UpdateUserSchema>
export type AssignRoleDTO     = z.infer<typeof AssignRoleSchema>

export const LoginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "El password es requerido"),
})
export type LoginUserDTO      = z.infer<typeof LoginUserSchema>

