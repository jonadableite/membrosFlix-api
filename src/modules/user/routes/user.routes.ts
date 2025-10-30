import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { UserServiceImpl } from "../services/user.service";
import { UserRepositoryImpl } from "../repositories/user.repository";
import {
  authenticate,
  authorize,
} from "../../../shared/middlewares/auth.middleware";

// Initialize dependencies
const userRepository = new UserRepositoryImpl();
const userService = new UserServiceImpl(userRepository);
const userController = new UserController(userService);

const userRoutes = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Criar usuário
 *     description: Cria um novo usuário (rota pública para registro)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - tenantId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "senha123"
 *               role:
 *                 type: string
 *                 enum: [STUDENT, INSTRUCTOR, ADMIN]
 *                 example: "STUDENT"
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               bio:
 *                 type: string
 *                 example: "Desenvolvedor apaixonado por tecnologia"
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Usuário já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.post("/", userController.store);

// Protected routes
userRoutes.use(authenticate);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obter perfil do usuário
 *     description: Retorna o perfil completo do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.get("/profile", userController.profile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualizar perfil do usuário
 *     description: Atualiza informações do perfil do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva Santos"
 *               bio:
 *                 type: string
 *                 example: "Desenvolvedor Full Stack"
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/new-avatar.jpg"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
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
 */
userRoutes.put("/profile", userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Alterar senha
 *     description: Altera a senha do usuário autenticado
 *     tags: [Users]
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "senhaAtual123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Senha atual incorreta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.put("/change-password", userController.changePassword);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar usuários (Admin)
 *     description: Lista todos os usuários com estatísticas (apenas para administradores)
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, INSTRUCTOR, ADMIN]
 *         description: Filtrar por role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *     responses:
 *       200:
 *         description: Lista de usuários
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
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
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
userRoutes.get("/", authorize("ADMIN"), userController.usersWithStats);

/**
 * @swagger
 * /api/users/email/{email}:
 *   get:
 *     summary: Buscar usuário por email (Admin)
 *     description: Busca um usuário pelo email (apenas para administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
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
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.get("/email/:email", authorize("ADMIN"), userController.findByEmail);

/**
 * @swagger
 * /api/users/referral/{code}:
 *   get:
 *     summary: Buscar usuário por código de indicação (Admin)
 *     description: Busca um usuário pelo código de indicação (apenas para administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de indicação
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
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
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.get(
  "/referral/:code",
  authorize("ADMIN"),
  userController.findByReferralCode
);

/**
 * @swagger
 * /api/users/{id}/award-points:
 *   post:
 *     summary: Conceder pontos (Admin)
 *     description: Concede pontos a um usuário (apenas para administradores)
 *     tags: [Users]
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
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - reason
 *             properties:
 *               points:
 *                 type: integer
 *                 example: 100
 *               reason:
 *                 type: string
 *                 example: "Conclusão de curso"
 *     responses:
 *       200:
 *         description: Pontos concedidos com sucesso
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
 *                         userId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         pointsAwarded:
 *                           type: integer
 *                           example: 100
 *                         totalPoints:
 *                           type: integer
 *                           example: 500
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
 *         description: Acesso negado (apenas administradores)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
userRoutes.post(
  "/:id/award-points",
  authorize("ADMIN"),
  userController.awardPoints
);

export { userRoutes };
