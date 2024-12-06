// src/routes.js

import { Router } from "express";
import multer from "multer";
import adminMiddleware from "./app/middlewares/admin";
import authMiddleware from "./app/middlewares/auth";
import multerConfig from "./config/multer";

import AulasController from "./app/controllers/AulasController";
import CommentController from "./app/controllers/CommentController";
import CursosController from "./app/controllers/CursosController";
import LikeController from "./app/controllers/LikeController";
import SessionController from "./app/controllers/SessionController";
import UserController from "./app/controllers/UserController";
import UserProgressController from "./app/controllers/UserProgressController";

const routes = new Router();
const upload = multer(multerConfig);

// Rotas públicas
routes.post("/sessions", SessionController.store); // Autenticação

// Middleware de autenticação
routes.use(authMiddleware);

// Rotas de usuários
routes.post("/users", adminMiddleware, UserController.store); // Criação de usuário restrita a administradores
routes.get("/users", adminMiddleware, UserController.index); // Listagem de usuários restrita a administradores
routes.get("/users/:id", adminMiddleware, UserController.show); // Visualização de usuário restrita a administradores
routes.put("/users/:id", UserController.update); // Edição de usuário permitida para qualquer usuário autenticado
routes.delete("/users/:id", adminMiddleware, UserController.delete); // Exclusão de usuário restrita a administradores

// Rotas de cursos (algumas protegidas por autorização de admin)
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

// Rotas de aulas (algumas protegidas por autorização de admin)
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

// Rotas de progresso (protegidas apenas por autenticação)
routes.put(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.update,
);
routes.get(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.show,
);

// Rotas de comentários (protegidas por autenticação)
routes.post("/comments", CommentController.create);
routes.get("/comments/:entityId/:entityType", CommentController.list);
routes.put("/comments/:commentId", CommentController.update);
routes.delete("/comments/:commentId", CommentController.delete);

// Rotas de likes (protegidas por autenticação)
routes.post("/likes/:entityId/:entityType", LikeController.add);
routes.delete("/likes/:entityId/:entityType", LikeController.remove);
routes.get("/likes/:entityId/:entityType", LikeController.list);

export default routes;
