
import { z } from 'zod';

// Image schema
export const imageSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  uploaded_at: z.coerce.date()
});

export type Image = z.infer<typeof imageSchema>;

// Input schema for uploading images
export const uploadImageInputSchema = z.object({
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable()
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

// Input schema for getting a single image
export const getImageInputSchema = z.object({
  id: z.number()
});

export type GetImageInput = z.infer<typeof getImageInputSchema>;

// Input schema for deleting an image
export const deleteImageInputSchema = z.object({
  id: z.number()
});

export type DeleteImageInput = z.infer<typeof deleteImageInputSchema>;

// Response schema for successful operations
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;
