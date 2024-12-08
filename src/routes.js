import { Router } from "express";
import multer from "multer";
import adminMiddleware from "./app/middlewares/admin";
import authMiddleware from "./app/middlewares/auth";
import multerConfig from "./config/multer";

import AulasController from "./app/controllers/AulasController";
import CommentController from "./app/controllers/CommentController";
import CursosController from "./app/controllers/CursosController";
import LikeController from "./app/controllers/LikeController";
import MaterialController from "./app/controllers/MaterialController";
import SessionController from "./app/controllers/SessionController";
import UserController from "./app/controllers/UserController";
import UserProgressController from "./app/controllers/UserProgressController";

const routes = new Router();
const upload = multer(multerConfig);

// Rotas públicas
routes.post("/sessions", SessionController.store);

// Middleware de autenticação
routes.use(authMiddleware);

// Rotas de usuários
routes.post("/users", adminMiddleware, UserController.store);
routes.get("/users", adminMiddleware, UserController.index);
routes.get("/users/:id", adminMiddleware, UserController.show);
routes.put("/users/:id", UserController.update);
routes.delete("/users/:id", adminMiddleware, UserController.delete);

// Rotas de cursos
routes.get("/cursos", CursosController.index);
routes.get("/cursos/:id", CursosController.show);
routes.post(
	"/cursos",
	adminMiddleware,
	upload.single("file"),
	CursosController.store,
);
routes.put(
	"/cursos/:id",
	adminMiddleware,
	upload.single("file"),
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

export default routes;
