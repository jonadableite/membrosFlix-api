import { Router } from "express";
import { InstructorController } from '../controllers/instructor.controller.js';
import { authorize } from '../../../shared/middlewares/auth.middleware.js';

const instructorRoutes = Router();
const instructorController = new InstructorController();

// Public routes
instructorRoutes.get("/", (req, res, next) =>
  instructorController.index(req, res, next)
);

instructorRoutes.get("/:id", (req, res, next) =>
  instructorController.show(req, res, next)
);

// Protected routes (Admin only)
instructorRoutes.post("/", authorize("ADMIN"), (req, res, next) =>
  instructorController.store(req, res, next)
);

instructorRoutes.put(
  "/:id",
  authorize("ADMIN", "INSTRUCTOR"),
  (req, res, next) => instructorController.update(req, res, next)
);

instructorRoutes.delete("/:id", authorize("ADMIN"), (req, res, next) =>
  instructorController.destroy(req, res, next)
);

export { instructorRoutes };
