import { Router } from "express";
import { LessonController } from '../controllers/lesson.controller.js';
import { LessonServiceImpl } from '../services/lesson.service.js';
import { LessonRepositoryImpl } from '../repositories/lesson.repository.js';
import { CourseRepositoryImpl } from '../../course/repositories/course.repository.js';
import {
  authenticate,
  authorize,
} from '../../../shared/middlewares/auth.middleware.js';
import multer from "multer";
import multerConfig from '../../../config/multer.js';
import { LikeSimpleService } from '../../like/services/like-simple.service.js';
import { CommentSimpleService } from '../../comment/services/comment-simple.service.js';
import { prisma } from '../../../shared/database/prisma.js';

// Initialize dependencies
const lessonRepository = new LessonRepositoryImpl();
const courseRepository = new CourseRepositoryImpl();
const lessonService = new LessonServiceImpl(lessonRepository, courseRepository);
const lessonController = new LessonController(lessonService);

// Initialize Like and Comment services
const likeService = new LikeSimpleService();
const commentService = new CommentSimpleService();

// Initialize Multer
const upload = multer(multerConfig);

const lessonRoutes = Router();

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Visualizar aula
 *     description: Visualiza uma aula específica (rota pública para preview)
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da aula
 *     responses:
 *       200:
 *         description: Aula encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Aula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.get("/:id", (req, res, next) =>
  lessonController.show(req, res, next)
);

// Protected routes
lessonRoutes.use(authenticate);

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Listar aulas
 *     description: Lista todas as aulas com filtros e paginação
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
 *         description: Filtrar por curso
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *     responses:
 *       200:
 *         description: Lista de aulas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.get("/", (req, res, next) =>
  lessonController.index(req, res, next)
);

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Criar aula
 *     description: Cria uma nova aula (apenas para instrutores)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - courseId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Introdução ao JavaScript"
 *               description:
 *                 type: string
 *                 example: "Primeira aula do curso"
 *               duration:
 *                 type: integer
 *                 example: 60
 *               courseId:
 *                 type: integer
 *                 example: 1
 *               ordemAula:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *                 default: DRAFT
 *               isPreview:
 *                 type: boolean
 *                 default: false
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["PDF Guide", "Video Tutorial"]
 *     responses:
 *       201:
 *         description: Aula criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado (apenas instrutores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.post(
  "/",
  authorize("INSTRUCTOR", "ADMIN"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => lessonController.store(req, res, next)
);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Atualizar aula
 *     description: Atualiza uma aula existente
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Introdução ao JavaScript - Atualizada"
 *               description:
 *                 type: string
 *                 example: "Primeira aula do curso atualizada"
 *               duration:
 *                 type: integer
 *                 example: 90
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, ARCHIVED]
 *               isPreview:
 *                 type: boolean
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Aula atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Aula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.put(
  "/:id",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => lessonController.update(req, res, next)
);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Excluir aula
 *     description: Exclui uma aula (apenas o proprietário)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da aula
 *     responses:
 *       200:
 *         description: Aula excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Aula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.delete("/:id", (req, res, next) =>
  lessonController.destroy(req, res, next)
);

/**
 * @swagger
 * /api/lessons/{id}/publish:
 *   put:
 *     summary: Publicar aula
 *     description: Publica uma aula (muda status para PUBLISHED)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da aula
 *     responses:
 *       200:
 *         description: Aula publicada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Lesson'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Aula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.put("/:id/publish", (req, res, next) =>
  lessonController.publish(req, res, next)
);

/**
 * @swagger
 * /api/lessons/{id}/archive:
 *   put:
 *     summary: Arquivar aula
 *     description: Arquiva uma aula (muda status para ARCHIVED)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da aula
 *     responses:
 *       200:
 *         description: Aula arquivada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Lesson'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Aula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
lessonRoutes.put("/:id/archive", (req, res, next) =>
  lessonController.archive(req, res, next)
);

// Student progress
lessonRoutes.post("/:id/watch", (req, res, next) =>
  lessonController.markAsWatched(req, res, next)
);
lessonRoutes.post("/:id/complete", (req, res, next) =>
  lessonController.markAsCompleted(req, res, next)
);

// Statistics (admin only)
lessonRoutes.get("/admin/stats", authorize("ADMIN"), (req, res, next) =>
  lessonController.getStats(req, res, next)
);

export { lessonRoutes };

// Course-specific lesson routes (to be used in course routes)
export const courseLessonRoutes = Router({ mergeParams: true });

// Public: Get lessons by course
courseLessonRoutes.get("/", (req, res, next) =>
  lessonController.getLessonsByCourse(req, res, next)
);

// Public: Get specific lesson in course
courseLessonRoutes.get("/:id", (req, res, next) =>
  lessonController.show(req, res, next)
);

// Public: Get lesson comments (REAL implementation)
courseLessonRoutes.get("/:id/comentarios", async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const user = (req as any).user;
    const userId = user?.id;

    const comments = await commentService.getCommentsByLesson(lessonId);

    res.json({
      success: true,
      message: "Comentários recuperados com sucesso",
      data: comments,
      pagination: {
        page: 1,
        limit: 100,
        total: comments.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar comentários",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Protected: Create lesson comment (REAL implementation)
courseLessonRoutes.post("/:id/comentarios", authenticate, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const user = (req as any).user;
    const lessonId = parseInt(req.params.id);

    const comment = await commentService.createComment({
      content,
      userId: user.id,
      aulaId: lessonId,
      cursoId: parseInt(req.params.courseId),
      parentId: parentId ? parseInt(parentId) : undefined,
    });

    res.status(201).json({
      success: true,
      message: "Comentário criado com sucesso",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao criar comentário",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Public: Get lesson materials (temporary stub)
courseLessonRoutes.get("/:id/materiais", (req, res) => {
  res.json({
    success: true,
    message: "Materiais recuperados com sucesso",
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });
});

// Protected: Toggle like on lesson (REAL implementation)
courseLessonRoutes.post("/:id/likes", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const lessonId = parseInt(req.params.id);

    // Ordem correta: userId primeiro, depois aulaId
    const result = await likeService.toggleLessonLike(user.id, lessonId);

    res.json({
      success: true,
      message: result.liked
        ? "Like registrado com sucesso"
        : "Like removido com sucesso",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao processar like",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Protected: Unlike lesson - usando DELETE toggle
courseLessonRoutes.delete("/:id/likes", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const lessonId = parseInt(req.params.id);

    // Ordem correta: userId primeiro, depois aulaId
    const result = await likeService.toggleLessonLike(user.id, lessonId);

    res.json({
      success: true,
      message: "Like removido com sucesso",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao remover like",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Protected: Check if user liked lesson
courseLessonRoutes.get("/:id/likes/status", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const lessonId = parseInt(req.params.id);

    // Verificar se usuário deu like
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: user.id,
        aulaId: lessonId,
      },
    });

    // Contar total de likes
    const likesCount = await prisma.like.count({
      where: { aulaId: lessonId },
    });

    res.json({
      success: true,
      message: "Status de like recuperado com sucesso",
      data: {
        liked: !!existingLike,
        likesCount,
        userId: user.id,
        lessonId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao verificar status de like",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
});

// Protected: Like comment (REAL implementation)
courseLessonRoutes.post(
  "/:id/comentarios/:commentId/likes",
  authenticate,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const commentId = parseInt(req.params.commentId);

      // Ordem correta: userId primeiro, depois commentId
      const result = await likeService.toggleCommentLike(user.id, commentId);

      res.json({
        success: true,
        message: result.liked
          ? "Like registrado com sucesso"
          : "Like removido com sucesso",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro ao processar like no comentário",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
);

// Protected: Create lesson in course
courseLessonRoutes.post(
  "/",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => lessonController.store(req, res, next)
);

// Protected: Update lesson in course
courseLessonRoutes.put(
  "/:id",
  authenticate,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => lessonController.update(req, res, next)
);

// Protected: Delete lesson in course
courseLessonRoutes.delete("/:id", authenticate, (req, res, next) =>
  lessonController.destroy(req, res, next)
);

// Reorder lessons in course
courseLessonRoutes.put("/reorder", authenticate, (req, res, next) =>
  lessonController.reorderLessons(req, res, next)
);

// Get course lesson statistics
courseLessonRoutes.get("/stats", authenticate, (req, res, next) =>
  lessonController.getCourseStats(req, res, next)
);

// Instructor-specific lesson routes (to be used in instructor routes)
export const instructorLessonRoutes = Router({ mergeParams: true });

// Get lessons by instructor
instructorLessonRoutes.get("/", authenticate, (req, res, next) =>
  lessonController.getLessonsByInstructor(req, res, next)
);
