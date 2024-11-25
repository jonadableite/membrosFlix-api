import { Router } from "express";
import multer from "multer";
import adminMiddleware from "./app/middlewares/admin";
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
routes.post("/users", UserController.store); // Rota de cadastro de usuário continua pública
routes.post("/sessions", SessionController.store);

// Rotas protegidas por autenticação (authMiddleware)
routes.use(authMiddleware);

// Rotas protegidas por autenticação e autorização de admin
routes.use("/users", adminMiddleware); // Aplicar adminMiddleware a todas as rotas de /users
routes.get("/users", UserController.index);
routes.get("/users/:id", UserController.show);
routes.put("/users/:id", UserController.update);
routes.delete("/users/:id", UserController.delete);

routes.use("/cursos", adminMiddleware); // Aplicar adminMiddleware a todas as rotas de /cursos
routes.post("/cursos", upload.single("file"), CursosController.store);
routes.get("/cursos", CursosController.index);
routes.get("/cursos/:id", CursosController.show);
routes.put("/cursos/:id", upload.single("file"), CursosController.update);
routes.delete("/cursos/:id", CursosController.delete);

routes.use("/cursos/:courseId/aulas", adminMiddleware); // Aplicar adminMiddleware a todas as rotas de aulas
routes.post(
	"/cursos/:courseId/aulas",
	upload.single("video"),
	AulasController.store,
);
routes.get("/cursos/:courseId/aulas", AulasController.index);
routes.get("/cursos/:courseId/aulas/:id", AulasController.show);
routes.put(
	"/cursos/:courseId/aulas/:id",
	upload.single("video"),
	AulasController.update,
);
routes.delete("/cursos/:courseId/aulas/:id", AulasController.delete);

// Rotas de progresso (protegidas apenas por autenticação)
routes.put(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.update,
);
routes.get(
	"/users/:userId/courses/:courseId/progress",
	UserProgressController.show,
);

export default routes;
