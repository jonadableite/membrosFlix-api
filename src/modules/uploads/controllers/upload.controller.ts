import type { Request, Response, NextFunction } from "express";
import { UploadService } from "../services/upload.service.js";
import { AppError } from "../../../shared/errors/app.error.js";

const uploadService = new UploadService();

export class UploadController {
  /**
   * POST /uploads/presign
   * Body: { bucket: string, fileName?: string, contentType?: string, expiresSeconds?: number }
   * Returns: { url, objectKey, publicUrl }
   */
  presign = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    const { bucket, fileName, contentType, expiresSeconds } = req.body || {};

    if (!bucket || typeof bucket !== "string") {
      throw AppError.badRequest("Bucket é obrigatório");
    }

    const result = await uploadService.getPresignedUploadUrl(
      bucket,
      fileName,
      contentType,
      typeof expiresSeconds === "number" ? expiresSeconds : 600
    );

    res.status(200).json({ success: true, message: "URL gerada", data: result });
  };
}

export default UploadController;