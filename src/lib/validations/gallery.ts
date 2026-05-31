import { z } from "zod"

export const galleryItemCreateSchema = z.object({
  title: z.string().trim().max(100, "Title is too long").optional().or(z.literal("")),
  description: z.string().trim().max(1000, "Description is too long").optional().or(z.literal("")),
  beforeImageUrl: z.string().url("Invalid Before Image URL").min(1, "Before image is required"),
  afterImageUrl: z.string().url("Invalid After Image URL").min(1, "After image is required"),
})

export type GalleryItemCreateInput = z.infer<typeof galleryItemCreateSchema>