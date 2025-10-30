import { minioClient } from "../lib/minio.client";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../../shared/errors/app.error";

export class UploadService {
  /**
   * Upload file to MinIO and return public URL
   */
  async uploadFile(
    file: Express.Multer.File,
    bucketName: string
  ): Promise<string> {
    try {
      // Ensure bucket exists
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName, "us-east-1");
      }

      // Generate unique filename
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;

      // Upload to MinIO with proper metadata for streaming
      const metadata = {
        "Content-Type": file.mimetype,
        "Content-Disposition": "inline", // Stream instead of download
        "Cache-Control": "public, max-age=31536000", // 1 year cache
      };

      await minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        file.size,
        metadata
      );

      // Return public URL
      const minioUrl =
        process.env.MINIO_SERVER_URL || "https://minioapi.whatlead.com.br";
      return `${minioUrl}/${bucketName}/${fileName}`;
    } catch (error: any) {
      const errorMessage =
        error?.message || "Erro desconhecido ao fazer upload para MinIO";
      console.error("Erro ao fazer upload para MinIO:", errorMessage, error);
      throw AppError.internal(
        `Erro ao fazer upload do arquivo: ${errorMessage}`
      );
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      await minioClient.removeObject(bucketName, fileName);
    } catch (error) {
      console.error("Erro ao deletar arquivo do MinIO:", error);
      throw AppError.internal("Erro ao deletar arquivo");
    }
  }

  /**
   * Get file URL from MinIO
   */
  async getFileUrl(bucketName: string, fileName: string): Promise<string> {
    const minioUrl =
      process.env.MINIO_SERVER_URL || "https://minioapi.whatlead.com.br";
    return `${minioUrl}/${bucketName}/${fileName}`;
  }
}
