import fs from "fs";
import path from "path";
import { promisify } from "util";
import logger from "../../../utils/logger";
import minioClient from "../../config/minioClient";
import prisma from "../../prismaClient";

const unlinkAsync = promisify(fs.unlink);

class MaterialController {
	async list(req, res) {
		const { courseId, lessonId } = req.params;
		try {
			const materialLogger = logger.setContext("MaterialController");
			materialLogger.log(
				`Listando materiais para aula ${lessonId} do curso ${courseId}`,
			);
			const materiais = await prisma.material.findMany({
				where: {
					aulaId: Number.parseInt(lessonId, 10),
				},
			});
			return res.json(materiais);
		} catch (error) {
			materialLogger.error("Erro ao buscar materiais:", error.message);
			return res.status(500).json({ error: "Erro ao buscar materiais" });
		}
	}

	async create(req, res) {
		const { courseId, lessonId } = req.params;
		const { title } = req.body;
		const file = req.file;

		if (!file) {
			materialLogger.error("Nenhum arquivo enviado.");
			return res.status(400).json({ error: "Arquivo não enviado" });
		}

		try {
			const bucketName = process.env.MINIO_BUCKET_NAME;
			materialLogger.log(`Verificando se o bucket ${bucketName} existe...`);

			const bucketExists = await minioClient.bucketExists(bucketName);
			if (!bucketExists) {
				materialLogger.log(`Bucket ${bucketName} não existe. Criando...`);
				await minioClient.makeBucket(bucketName, process.env.MINIO_REGION);
			}

			// Upload do arquivo para o MinIO
			const filePath = path.resolve(file.path);
			materialLogger.log(
				`Fazendo upload do arquivo: ${filePath} para o bucket: ${bucketName}`,
			);
			await minioClient.fPutObject(bucketName, file.filename, filePath, {
				"Content-Type": file.mimetype,
			});

			// Remova o arquivo local após o upload
			await unlinkAsync(filePath);
			materialLogger.log(`Arquivo local ${filePath} removido após upload.`);

			// Crie o registro do material no banco de dados
			materialLogger.log(`Criando registro do material no banco de dados...`);
			const material = await prisma.material.create({
				data: {
					title,
					url: `${process.env.MINIO_SERVER_URL}/${bucketName}/${file.filename}`,
					aulaId: Number.parseInt(lessonId, 10),
				},
			});

			materialLogger.log("Material criado com sucesso:", material);
			return res.status(201).json(material);
		} catch (error) {
			materialLogger.error("Erro ao criar material:", error.message);
			return res.status(500).json({ error: "Erro ao criar material" });
		}
	}
}

export default new MaterialController();
