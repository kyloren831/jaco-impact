import { z } from "zod"

// ─── Project Review ───────────────────────────────────────────────
export const CreateProjectReviewSchema = z.object({
  projectId:   z.number().int(),
  volunteerId: z.number().int(),
  rating:      z.number().int().min(1, "Mínimo 1").max(5, "Máximo 5"),
  comment:     z.string().min(1, "El comentario es requerido"),
})

export type CreateProjectReviewDTO = z.infer<typeof CreateProjectReviewSchema>

// ─── Pyme ─────────────────────────────────────────────────────────
export const CreatePymeSchema = z.object({
  name:          z.string().min(1).max(150),
  description:   z.string().optional(),
  category:      z.string().min(1).max(100),
  phone:         z.string().min(1).max(30),
  email:         z.string().email().optional(),
  logoUrl:       z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  catalogSlug:   z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  isActive:      z.boolean().default(true),
  isFeatured:    z.boolean().default(false),
  publishedAt:   z.coerce.date().optional(),
})

export const UpdatePymeSchema = CreatePymeSchema.partial()

export type CreatePymeDTO = z.infer<typeof CreatePymeSchema>
export type UpdatePymeDTO = z.infer<typeof UpdatePymeSchema>

// ─── Pyme Manager ─────────────────────────────────────────────────
export const CreatePymeManagerSchema = z.object({
  pymeId: z.number().int(),
  userId: z.number().int(),
  name:   z.string().min(1).max(150),
  phone:  z.string().min(1).max(30),
  email:  z.string().email().optional(),
})

export type CreatePymeManagerDTO = z.infer<typeof CreatePymeManagerSchema>

// ─── Product ──────────────────────────────────────────────────────
export const CreateProductSchema = z.object({
  pymeId:      z.number().int(),
  name:        z.string().min(1).max(150),
  description: z.string().min(1),
  price:       z.number().positive("El precio debe ser mayor a 0").multipleOf(0.01),
  imagenUrl:   z.string().url("Debe ser una URL válida"),
  isFeatured:  z.boolean().default(false),
  isActive:    z.boolean().default(true),
  publishedAt: z.coerce.date().optional(),
})

export const UpdateProductSchema = CreateProductSchema.omit({ pymeId: true }).partial()

export type CreateProductDTO = z.infer<typeof CreateProductSchema>
export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>

// ─── News ─────────────────────────────────────────────────────────
export const CreateNewsSchema = z.object({
  pillarId:   z.number().int(),
  projectId:  z.number().int().optional(),
  eventId:    z.number().int().optional(),
  title:      z.string().min(1).max(180),
  summary:    z.string().optional(),
  content:    z.string().min(1, "El contenido es requerido"),
  imagenUrl:  z.string().url("Debe ser una URL válida"),
  status:     z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
})

export const UpdateNewsSchema = CreateNewsSchema.partial()

export type CreateNewsDTO = z.infer<typeof CreateNewsSchema>
export type UpdateNewsDTO = z.infer<typeof UpdateNewsSchema>

// ─── Blog Post ────────────────────────────────────────────────────
export const CreateBlogPostSchema = z.object({
  title:       z.string().min(1).max(180),
  summary:     z.string().optional(),
  content:     z.string().min(1, "El contenido es requerido"),
  imagenUrl:   z.string().url("Debe ser una URL válida"),
  status:      z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  publishedAt: z.coerce.date().optional(),
})

export const UpdateBlogPostSchema = CreateBlogPostSchema.partial()

export type CreateBlogPostDTO = z.infer<typeof CreateBlogPostSchema>
export type UpdateBlogPostDTO = z.infer<typeof UpdateBlogPostSchema>
