import { Router } from "express";
import { authenticate, authorize } from "../../../shared/middlewares/auth.middleware.js";
import { UploadController } from "../controllers/upload.controller.js";

const uploadRoutes = Router();
const uploadController = new UploadController();

// Generate presigned URL for direct MinIO uploads
uploadRoutes.post(
  "/presign",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  (req, res, next) => uploadController.presign(req, res, next)
);

export { uploadRoutes };