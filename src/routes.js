// src/routes.js
import { Router } from "express";
import multer from "multer";
import adminMiddleware from "./app/middlewares/admin.js";
import authMiddleware from "./app/middlewares/auth.js";
import multerConfig from "./config/multer.js";

import AulasController from "./app/controllers/AulasController.js";
import CertificateController from "./app/controllers/CertificateController.js";
import CommentController from "./app/controllers/CommentController.js";
import CursosController from "./app/controllers/CursosController.js";
import InstructorController from "./app/controllers/InstructorController.js";
import LikeController from "./app/controllers/LikeController.js";
import MaterialController from "./app/controllers/MaterialController.js";
import NotificationController from "./app/controllers/NotificationController.js";
import ReferralController from "./app/controllers/ReferralController.js";
import SessionController from "./app/controllers/SessionController.js";
import UserController from "./app/controllers/UserController.js";
import UserProgressController from "./app/controllers/UserProgressController.js";

const routes = new Router();
const upload = multer(multerConfig);

// Rotas públicas
routes.post("/sessions", SessionController.store);
routes.post("/users", UserController.store);

// Middleware de autenticação
routes.use(authMiddleware);

// Rotas de usuários

routes.get("/users", adminMiddleware, UserController.index);
routes.get("/users/:id", adminMiddleware, UserController.show);
routes.put("/users/:id", UserController.update);
routes.delete("/users/:id", adminMiddleware, UserController.delete);

// Rotas de instrutores
routes.post("/instructors", adminMiddleware, InstructorController.create);
routes.get("/instructors", InstructorController.index);
routes.get("/instructors/:userId", InstructorController.show);
routes.put(
	"/instructors/:userId",
	adminMiddleware,
	InstructorController.update,
);
routes.delete(
	"/instructors/:userId",
	adminMiddleware,
	InstructorController.delete,
);

// Rotas de cursos
routes.get("/cursos", CursosController.index);
routes.get("/cursos/:id", CursosController.show);
routes.post(
	"/cursos",
	adminMiddleware,
	upload.fields([
		{ name: "file", maxCount: 1 },
		{ name: "thumbnail", maxCount: 1 },
	]),
	CursosController.store,
);
routes.put(
	"/cursos/:id",
	adminMiddleware,
	upload.fields([
		{ name: "file", maxCount: 1 },
		{ name: "thumbnail", maxCount: 1 },
	]),
	CursosController.update,
);
routes.delete("/cursos/:id", adminMiddleware, CursosController.delete);

// Rotas de aulas
routes.get("/cursos/:courseId/aulas", AulasController.index);
routes.get("/cursos/:courseId/aulas/:id", AulasController.show);
routes.get("/cursos/:courseId/aulas/proximas", AulasController.proximas);
routes.post(
	"/cursos/:courseId/aulas",
	adminMiddleware,
	upload.single("video"),
	AulasController.store,
);
routes.put(
	"/cursos/:courseId/aulas/:id",
	adminMiddleware,
	upload.single("video"),
	AulasController.update,
);
routes.delete(
	"/cursos/:courseId/aulas/:id",
	adminMiddleware,
	AulasController.delete,
);

// Rotas de progresso
routes.put(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.update,
);
routes.get(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.show,
);

// Rotas de comentários
routes.post(
	"/cursos/:courseId/aulas/:lessonId/comentarios",
	CommentController.create,
);
routes.get(
	"/cursos/:courseId/aulas/:lessonId/comentarios",
	CommentController.list,
);
routes.put("/comments/:commentId", CommentController.update);
routes.delete("/comments/:commentId", CommentController.delete);

// Rotas de likes para aulas
routes.get("/cursos/:courseId/aulas/:lessonId/likes", LikeController.list);
routes.post("/cursos/:courseId/aulas/:lessonId/likes", LikeController.add);
routes.delete("/cursos/:courseId/aulas/:lessonId/likes", LikeController.remove);

// Rotas de likes para comentários
routes.get(
	"/cursos/:courseId/aulas/:lessonId/comentarios/:commentId/likes",
	LikeController.list,
);
routes.post(
	"/cursos/:courseId/aulas/:lessonId/comentarios/:commentId/likes",
	LikeController.add,
);
routes.delete(
	"/cursos/:courseId/aulas/:lessonId/comentarios/:commentId/likes",
	LikeController.remove,
);

// Rotas de materiais
routes.get(
	"/cursos/:courseId/aulas/:lessonId/materiais",
	MaterialController.list,
);
routes.post(
	"/cursos/:courseId/aulas/:lessonId/materiais",
	adminMiddleware,
	upload.single("file"),
	MaterialController.create,
);

// Rotas de indicação
routes.post("/referrals", ReferralController.create);
routes.get("/users/:userId/referrals", ReferralController.list);

// Rotas de certificados
routes.post("/certificates", CertificateController.issue);
routes.get("/users/:userId/certificates", CertificateController.list);


// Rotas de notificações
routes.post(
	'/usuarios/:userId/notificacoes/boas-vindas',
	NotificationController.criarNotificacaoBemVindo
);

routes.get(
	'/usuarios/:userId/notificacoes/nao-lidas',
	NotificationController.buscarNotificacoesNaoLidas
);

routes.put(
	'/notificacoes/:id/lida',
	NotificationController.marcarComoLida
);

routes.put(
	'/usuarios/:userId/notificacoes/marcar-todas-lidas',
	NotificationController.marcarTodasComoLidas
);

routes.post(
	'/aulas/notificar',
	adminMiddleware,
	NotificationController.notificarNovaAula
);

routes.post(
	'/materiais/notificar',
	adminMiddleware,
	NotificationController.notificarAtualizacaoMaterial
);

export default routes;
