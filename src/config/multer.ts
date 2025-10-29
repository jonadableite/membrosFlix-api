import multer from "multer";
import fs from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Obter o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const uploadDirectory = resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

export const multerConfig = {
  storage: multer.memoryStorage(), // Use memory storage for MinIO integration

  fileFilter: (_req: any, file: any, callback: any) => {
    // Extensões permitidas (aceita baseado apenas na extensão para ser mais tolerante)
    const allowedExtensions =
      /\.(jpeg|jpg|png|gif|webp|mp4|avi|mkv|mov|wmv|flv|webm|m4v)$/i;

    const extName = allowedExtensions.test(file.originalname.toLowerCase());

    if (extName) {
      console.log(
        `✅ Arquivo aceito: ${file.originalname}, mimetype: ${file.mimetype}`
      );
      return callback(null, true);
    }

    console.error(
      `❌ Arquivo rejeitado: ${file.originalname}, mimetype: ${file.mimetype}`
    );
    callback(
      new Error(
        `Tipo de arquivo não suportado. Apenas imagens (jpg, png, gif, webp) e vídeos (mp4, avi, mkv, mov, wmv, flv, webm, m4v) são permitidos.`
      )
    );
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
};

export default multerConfig;
