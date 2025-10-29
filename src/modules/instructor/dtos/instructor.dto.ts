import { z } from "zod";

// Schemas para Instructor
export const createInstructorSchema = z.object({
  userId: z.string().uuid("User ID deve ser um UUID válido"),
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional().default([]),
});

export const updateInstructorSchema = z.object({
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export const instructorResponseSchema = z.object({
  id: z.number(),
  userId: z.string(),
  bio: z.string().nullable(),
  expertise: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type CreateInstructorDTO = z.infer<typeof createInstructorSchema>;
export type UpdateInstructorDTO = z.infer<typeof updateInstructorSchema>;
export type InstructorResponse = z.infer<typeof instructorResponseSchema>;
