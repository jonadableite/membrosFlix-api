import { Router } from "express";
import multer from "multer";
import multerConfig from "../../../config/multer.js";
import { CourseController } from '../controllers/course.controller.js';
import { CourseServiceImpl } from '../services/course.service.js';
import { CourseRepositoryImpl } from '../repositories/course.repository.js';
import {
  authenticate,
  authorize,
} from '../../../shared/middlewares/auth.middleware.js';
import { courseLessonRoutes } from '../../lesson/routes/lesson.routes.js';

// Initialize dependencies
const courseRepository = new CourseRepositoryImpl();
const courseService = new CourseServiceImpl(courseRepository);
const courseController = new CourseController(courseService);

// Initialize multer for file uploads
const upload = multer(multerConfig);

const courseRoutes = Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Listar cursos
 *     description: Lista todos os cursos públicos com filtros e paginação
 *     tags: [Courses]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: Filtrar por status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         description: Filtrar por nível
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título ou descrição
 *     responses:
 *       200:
 *         description: Lista de cursos
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
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
courseRoutes.get("/", (req, res, next) =>
  courseController.index(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Visualizar curso
 *     description: Visualiza um curso específico
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Curso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.get("/:id", (req, res, next) =>
  courseController.show(req, res, next)
);

// Protected routes
courseRoutes.use(authenticate);
courseRoutes.use("/:courseId/lessons", courseLessonRoutes);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Criar curso
 *     description: Cria um novo curso (apenas para instrutores e administradores)
 *     tags: [Courses]
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
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Curso de JavaScript Moderno"
 *               description:
 *                 type: string
 *                 example: "Aprenda JavaScript do zero ao avançado"
 *               instructorId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               price:
 *                 type: number
 *                 example: 99.90
 *               category:
 *                 type: string
 *                 example: "Programação"
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                 example: "BEGINNER"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["javascript", "frontend", "web"]
 *               slug:
 *                 type: string
 *                 example: "curso-javascript-moderno"
 *     responses:
 *       201:
 *         description: Curso criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
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
courseRoutes.post(
  "/",
  authorize("INSTRUCTOR", "ADMIN"),
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => courseController.store(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Atualizar curso
 *     description: Atualiza um curso existente
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Curso de JavaScript Moderno - Atualizado"
 *               description:
 *                 type: string
 *                 example: "Aprenda JavaScript do zero ao avançado com as últimas features"
 *               price:
 *                 type: number
 *                 example: 149.90
 *               category:
 *                 type: string
 *                 example: "Programação Web"
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Curso atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
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
 *         description: Curso não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.put(
  "/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  (req, res, next) => courseController.update(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}/publish:
 *   put:
 *     summary: Publicar curso
 *     description: Publica um curso (muda status para PUBLISHED)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Curso publicado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curso não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.put("/:id/publish", (req, res, next) =>
  courseController.publish(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}/archive:
 *   put:
 *     summary: Arquivar curso
 *     description: Arquiva um curso (muda status para ARCHIVED)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Curso arquivado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Course'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curso não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.put("/:id/archive", (req, res, next) =>
  courseController.archive(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Matricular em curso
 *     description: Matricula o usuário autenticado em um curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Matrícula realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Usuário já matriculado
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
 *         description: Curso não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.post("/:id/enroll", (req, res, next) =>
  courseController.enroll(req, res, next)
);

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   delete:
 *     summary: Cancelar matrícula
 *     description: Cancela a matrícula do usuário autenticado em um curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do curso
 *     responses:
 *       200:
 *         description: Matrícula cancelada com sucesso
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
 *       404:
 *         description: Matrícula não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.delete("/:id/enroll", (req, res, next) =>
  courseController.unenroll(req, res, next)
);

/**
 * @swagger
 * /api/courses/instructor/{instructorId}:
 *   get:
 *     summary: Cursos do instrutor
 *     description: Lista todos os cursos de um instrutor específico
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do instrutor
 *     responses:
 *       200:
 *         description: Lista de cursos do instrutor
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
 *                         $ref: '#/components/schemas/Course'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Instrutor não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.get("/instructor/:instructorId", (req, res, next) =>
  courseController.getInstructorCourses(req, res, next)
);

/**
 * @swagger
 * /api/courses/admin/stats:
 *   get:
 *     summary: Estatísticas de cursos (Admin)
 *     description: Retorna estatísticas gerais dos cursos (apenas para administradores)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Estatísticas dos cursos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalCourses:
 *                           type: integer
 *                           example: 150
 *                         publishedCourses:
 *                           type: integer
 *                           example: 120
 *                         draftCourses:
 *                           type: integer
 *                           example: 30
 *                         totalEnrollments:
 *                           type: integer
 *                           example: 2500
 *                         averageRating:
 *                           type: number
 *                           example: 4.5
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado (apenas administradores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.get("/admin/stats", authorize("ADMIN"), (req, res, next) =>
  courseController.getStats(req, res, next)
);

/**
 * @swagger
 * /api/courses/instructor/{instructorId}/stats:
 *   get:
 *     summary: Estatísticas do instrutor
 *     description: Retorna estatísticas dos cursos de um instrutor específico
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do instrutor
 *     responses:
 *       200:
 *         description: Estatísticas do instrutor
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         instructorId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         totalCourses:
 *                           type: integer
 *                           example: 25
 *                         publishedCourses:
 *                           type: integer
 *                           example: 20
 *                         totalEnrollments:
 *                           type: integer
 *                           example: 500
 *                         averageRating:
 *                           type: number
 *                           example: 4.8
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Instrutor não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
courseRoutes.get("/instructor/:instructorId/stats", (req, res, next) =>
  courseController.getInstructorStats(req, res, next)
);

export { courseRoutes };
