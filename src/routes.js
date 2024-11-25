import { Router } from "express";
import multer from "multer";
import authMiddleware from "./app/middlewares/auth";
import multerConfig from "./config/multer";

import AulasController from "./app/controllers/AulasController";
import CursosController from "./app/controllers/CursosController";
import SessionController from "./app/controllers/SessionController";
import UserController from "./app/controllers/UserController";
import UserProgressController from "./app/controllers/UserProgressController";

const routes = new Router();
const upload = multer(multerConfig);

// Rotas públicas
routes.post("/users", UserController.store);
routes.post("/sessions", SessionController.store);

// Rotas protegidas
routes.use(authMiddleware);

// Rotas para usuários (protegidas)
routes.get("/users", UserController.index);
routes.get("/users/:id", UserController.show);
routes.put("/users/:id", UserController.update); // Rota para atualizar usuário
routes.delete("/users/:id", UserController.delete);

// Rotas para aulas (protegidas)
routes.post("/aulas", upload.single("video"), AulasController.store);
routes.get("/cursos/:courseId/aulas", AulasController.index);
routes.get("/cursos/:courseId/aulas/:id", AulasController.show);
routes.put(
	"/aulas/:courseId/:id",
	upload.single("video"),
	AulasController.update,
);
routes.delete("/aulas/:courseId/:id", AulasController.delete);

// Rotas para cursos (protegidas)
routes.post("/cursos", upload.single("file"), CursosController.store);
routes.get("/cursos", CursosController.index);
routes.get("/cursos/:id", CursosController.show);
routes.put("/cursos/:id", upload.single("file"), CursosController.update);
routes.delete("/cursos/:id", CursosController.delete);

// Rotas de progresso (protegidas)
routes.put(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.update,
);
routes.get(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.show,
);

export default routes;
