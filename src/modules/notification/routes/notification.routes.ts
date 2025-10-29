import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { NotificationServiceImpl } from "../services/notification.service";
import { NotificationRepositoryImpl } from "../repositories/notification.repository";
import { authenticate } from "@/shared/middlewares/auth.middleware";
import { prisma } from "@/shared/database/prisma";

// Initialize dependencies
const notificationRepository = new NotificationRepositoryImpl(prisma);
const notificationService = new NotificationServiceImpl(notificationRepository);
const notificationController = new NotificationController(notificationService);

const notificationRoutes = Router();

// All notification routes require authentication
notificationRoutes.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Listar notificações do usuário
 *     description: Lista todas as notificações do usuário autenticado
 *     tags: [Notifications]
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
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [NOVA_AULA, NOVO_COMENTARIO, PROGRESSO, CONQUISTA, INDICACAO, CURSO_NOVO, MENSAGEM, BOAS_VINDAS]
 *         description: Filtrar por tipo de notificação
 *       - in: query
 *         name: lida
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de leitura
 *     responses:
 *       200:
 *         description: Lista de notificações
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
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.get("/", (req, res, next) =>
  notificationController.getUserNotifications(req, res, next)
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Visualizar notificação
 *     description: Visualiza uma notificação específica
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado (notificação de outro usuário)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.get("/:id", (req, res, next) =>
  notificationController.getNotification(req, res, next)
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificação como lida
 *     description: Marca uma notificação específica como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
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
 *         description: Acesso negado (notificação de outro usuário)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.patch("/:id/read", (req, res, next) =>
  notificationController.markAsRead(req, res, next)
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marcar todas as notificações como lidas
 *     description: Marca todas as notificações do usuário como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
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
 *                         updatedCount:
 *                           type: integer
 *                           example: 5
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.patch("/read-all", (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Contar notificações não lidas
 *     description: Retorna o número de notificações não lidas do usuário
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Contagem de notificações não lidas
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
 *                         unreadCount:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.get("/unread-count", (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Excluir notificação
 *     description: Exclui uma notificação específica
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação excluída com sucesso
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
 *         description: Acesso negado (notificação de outro usuário)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
notificationRoutes.delete("/:id", (req, res, next) =>
  notificationController.deleteNotification(req, res, next)
);

export { notificationRoutes };
