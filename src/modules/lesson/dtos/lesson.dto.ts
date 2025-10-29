import { z } from "zod";

export const createLessonSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  description: z.string().optional(),
  courseId: z.coerce.number().int("ID do curso deve ser um número inteiro"),
  instructorId: z.string().uuid("ID do instrutor inválido").optional(),
  path: z.string().optional(), // Can be URL or local path
  duration: z.coerce.number().min(0, "Duração deve ser positiva").optional(),
  ordemAula: z.coerce
    .number()
    .min(1, "Ordem da aula deve ser positiva")
    .optional(),
  thumbnail: z.string().optional(), // Can be URL or local path
  videoUrl: z.string().optional(), // Can be URL or local path
  materials: z.array(z.string()).optional(),
  isPreview: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const updateLessonSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome muito longo")
    .optional(),
  description: z.string().optional(),
  instructorId: z.string().uuid("ID do instrutor inválido").optional(),
  path: z.string().optional(), // Can be URL or local path
  duration: z.number().min(0, "Duração deve ser positiva").optional(),
  ordemAula: z.number().min(1, "Ordem da aula deve ser positiva").optional(),
  thumbnail: z.string().optional(), // Can be URL or local path
  videoUrl: z.string().optional(), // Can be URL or local path
  materials: z.array(z.string()).optional(),
  isPreview: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const lessonQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  courseId: z.coerce.number().int().optional(),
  instructorId: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sortBy: z
    .enum(["name", "ordemAula", "createdAt", "updatedAt", "duration"])
    .default("ordemAula"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const reorderLessonsSchema = z.object({
  lessons: z
    .array(
      z.object({
        id: z.string().uuid(),
        ordemAula: z.number().min(1),
      })
    )
    .min(1, "Pelo menos uma aula deve ser fornecida"),
});

export type CreateLessonDto = z.infer<typeof createLessonSchema>;
export type UpdateLessonDto = z.infer<typeof updateLessonSchema>;
export type LessonQueryDto = z.infer<typeof lessonQuerySchema>;
export type ReorderLessonsDto = z.infer<typeof reorderLessonsSchema>;

export interface LessonResponseDto {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  instructorId?: string;
  path?: string;
  duration?: number;
  ordemAula: number;
  thumbnail?: string;
  videoUrl?: string;
  materials?: string[];
  isPreview: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  totalComments: number;
  totalLikes: number;
  course?: {
    id: string;
    title: string;
    thumbnail?: string;
  };
  instructor?: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonWithProgressDto extends LessonResponseDto {
  progress?: {
    id: string;
    userId: string;
    completed: boolean;
    watchTime: number;
    completedAt?: Date;
  };
}

export interface LessonStatsDto {
  totalLessons: number;
  publishedLessons: number;
  draftLessons: number;
  archivedLessons: number;
  totalDuration: number;
  averageDuration: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
}

export interface CourseLessonsDto {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  totalDuration: number;
  lessons: LessonResponseDto[];
}
