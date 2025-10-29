import { z } from "zod";
import type { CourseStatus } from "@prisma/client";

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título muito longo"),
  description: z.string().optional(),
  thumbnail: z.string().optional(), // Aceita path local ou URL
  path: z.string().optional(), // Path do vídeo
  tenantId: z.string().optional(), // Resolved automatically by service
  instructorId: z
    .number()
    .int()
    .positive("ID do instrutor inválido")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  duracaoTotal: z.number().min(0, "Duração deve ser positiva").optional(),
  price: z.number().min(0, "Preço deve ser positivo").optional(),
  category: z.string().max(100, "Categoria muito longa").optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título muito longo")
    .optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(), // Aceita path local ou URL
  path: z.string().optional(), // Path do vídeo
  tenantId: z.string().min(1).optional(), // Optional for updates
  instructorId: z
    .number()
    .int()
    .positive("ID do instrutor inválido")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "ARCHIVED"]).optional(),
  duracaoTotal: z.number().min(0, "Duração deve ser positiva").optional(),
  price: z.number().min(0, "Preço deve ser positivo").optional(),
  category: z.string().max(100, "Categoria muito longa").optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const courseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "ARCHIVED"]).optional(),
  instructorId: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  sortBy: z
    .enum(["title", "createdAt", "updatedAt", "duracaoTotal"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
export type CourseQueryDto = z.infer<typeof courseQuerySchema>;

export interface CourseResponseDto {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  status: CourseStatus;
  duracaoTotal?: number;
  price?: number;
  category?: string;
  level?: string;
  tags?: string[];
  totalAulas: number;
  totalEstudantes: number;
  totalComments: number;
  totalLikes: number;
  instructor?: {
    id: number;
    name: string;
    profilePicture?: string;
    bio?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithLessonsDto extends CourseResponseDto {
  aulas: {
    id: number;
    name: string;
    description?: string;
    duration?: number;
    ordemAula: number;
    thumbnail?: string;
  }[];
}

export interface CourseStatsDto {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  totalStudents: number;
  totalLessons: number;
  totalDuration: number;
}

export interface InstructorCourseStatsDto {
  instructorId: number;
  instructorName: string;
  totalCourses: number;
  totalStudents: number;
  totalLessons: number;
  averageRating?: number;
}
