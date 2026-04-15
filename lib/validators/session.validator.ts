import { z } from "zod"

export const CreateSessionSchema = z.object({
  userId:    z.number().int(),
  refreshHash: z.string().min(1),
  userAgent: z.string().optional(),
  ip:        z.string().optional(),
  expiresAt: z.coerce.date(),
})

export type CreateSessionDTO = z.infer<typeof CreateSessionSchema>
