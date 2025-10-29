import { Router } from "express";
import {
  healthCheck,
  readinessCheck,
  livenessCheck,
  detailedHealthCheck,
} from "./health.controller";
import { correlationMiddleware } from "@/shared/middlewares/correlation.middleware";
import { tenantContext } from "@/shared/middlewares/tenant.middleware";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check básico
 *     description: Verifica o status geral do sistema e seus serviços
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 15
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 5
 *                     eventEmitter:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *       503:
 *         description: Sistema com problemas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/health", healthCheck);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Verifica se o sistema está pronto para receber tráfego (usado pelo Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema pronto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *       503:
 *         description: Sistema não está pronto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/health/ready", readinessCheck);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     description: Verifica se o processo está vivo (usado pelo Kubernetes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Processo vivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get("/health/live", livenessCheck);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Health check detalhado
 *     description: Verificação detalhada com contexto de tenant e correlation ID
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: header
 *         name: X-Correlation-ID
 *         schema:
 *           type: string
 *         description: Correlation ID para rastreamento
 *     responses:
 *       200:
 *         description: Health check detalhado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 responseTime:
 *                   type: number
 *                   example: 25
 *                 tenantId:
 *                   type: string
 *                   example: "tenant-123"
 *                 correlationId:
 *                   type: string
 *                   example: "corr-456"
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 15
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 5
 *                     eventEmitter:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Sistema com problemas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/health/detailed",
  correlationMiddleware as any,
  tenantContext as any,
  detailedHealthCheck as any
);

export default router;
