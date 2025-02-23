import fs from "fs";
// src/app/controllers/AulasController.js
import { PrismaClient } from "@prisma/client";
import * as Yup from "yup";
import logger from "../../../utils/logger";
import minioClient from "../../config/minioClient";
import * as aulaService from "../services/aulaService";
import notificationService from "../services/notificationService";

const prisma = new PrismaClient();

class AulasController {
	async index(req, res) {
		try {
			const { courseId } = req.params;

			const aulas = await prisma.aula.findMany({
				where: { courseId: Number(courseId) },
				include: {
					instructor: {
						select: {
							name: true,
						},
					},
				},
			});

			const aulasComInstrutor = aulas.map((aula) => ({
				...aula,
				instructorName: aula.instructor?.name || "Não atribuído",
			}));

			return res.json(aulasComInstrutor);
		} catch (error) {
			const aulasLogger = logger.setContext("AulasController");
			aulasLogger.error("Erro ao listar aulas:", error.message);
			return res.status(500).json({ error: "Erro ao listar aulas" });
		}
	}

	async show(req, res) {
		try {
			const { courseId, id: lessonId } = req.params;
			const userId = req.userId;

			const aula = await prisma.aula.findUnique({
				where: { id: Number(lessonId) },
				include: {
					likes: true,
					comments: true,
					instructor: true,
				},
			});

			if (!aula) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			const likesCount = aula.likes.length;
			const userLiked = aula.likes.some((like) => like.userId === userId);

			return res.json({
				...aula,
				instructorName: aula.instructor?.name || "Não atribuído",
				likesCount,
				userLiked,
			});
		} catch (error) {
			aulasLogger.error("Erro ao exibir aula:", error);
			return res.status(500).json({ error: "Erro ao exibir aula" });
		}
	}

	async proximas(req, res) {
		try {
			const { courseId } = req.params;
			const nextLessons = await aulaService.listProximasAulas(courseId);

			if (!nextLessons || nextLessons.length === 0) {
				return res
					.status(404)
					.json({ error: "Nenhuma aula encontrada para este curso" });
			}

			return res.json(nextLessons);
		} catch (error) {
			logger.error("Erro ao buscar próximas aulas:", error.message);
			return res.status(500).json({ error: "Erro ao buscar próximas aulas" });
		}
	}

	async store(req, res) {
		aulasLogger.log("req.body:", req.body);
		try {
			const schema = Yup.object().shape({
				courseId: Yup.number().required(
					"O ID do curso é obrigatório e deve ser um número.",
				),
				name: Yup.string().required("O nome da aula é obrigatório."),
				description: Yup.string().nullable(),
				duration: Yup.number().required(
					"A duração da aula é obrigatória e deve ser um número.",
				),
				instructorId: Yup.string().required("O ID do instrutor é obrigatório."),
			});

			const validatedData = await schema.validate(req.body, {
				abortEarly: false,
			});

			const { file } = req;
			const { courseId, name, description, duration, instructorId } =
				validatedData;

			if (!file) {
				logger.warn("Nenhum arquivo de vídeo enviado.");
				return res
					.status(400)
					.json({ error: "Nenhum arquivo de vídeo enviado." });
			}

			const cursoExiste = await prisma.curso.findUnique({
				where: { id: Number(courseId) },
			});
			if (!cursoExiste) {
				return res.status(400).json({ error: "Curso não encontrado" });
			}

			const bucketName = "curso";

			const bucketExists = await minioClient.bucketExists(bucketName);
			if (!bucketExists) {
				await minioClient.makeBucket(bucketName, "eu-south");
			}

			await minioClient.fPutObject(bucketName, file.filename, file.path, {
				"Content-Type": file.mimetype,
			});

			const path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${file.filename}`;

			const aula = await aulaService.createAula(
				{
					courseId,
					name,
					description,
					duration: Number(duration),
					instructorId,
				},
				path,
			);

			if (fs.existsSync(file.path)) {
				try {
					fs.unlinkSync(file.path);
					logger.info("Arquivo local removido com sucesso");
				} catch (error) {
					logger.error("Erro ao remover arquivo local:", error.message);
					return res
						.status(500)
						.json({ error: "Erro ao remover arquivo local" });
				}
			} else {
				logger.warn("Arquivo local não encontrado para remoção");
			}

			// Enviar notificação para todos os usuários
			const users = await prisma.user.findMany();

			for (const user of users) {
				aulasLogger.log("user.id:", user.id, typeof user.id);
				const userIdString = String(user.id);
				aulasLogger.log("userIdString:", userIdString, typeof userIdString);

				try {
					await notificationService.createNotification(
						userIdString,
						"NOVA_AULA",
						`Nova aula publicada: ${name}`,
					);
				} catch (error) {
					aulasLogger.error(`Erro ao notificar usuário ${user.id}:`, error);
				}
			}
			logger.info("Aula criada com sucesso", { aula });
			return res.status(201).json({ message: "Aula criada com sucesso", aula });
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				const validationErrors = {};
				error.inner.forEach((err) => {
					validationErrors[err.path] = err.message;
				});
				logger.error("Erro de validação:", validationErrors);
				return res.status(400).json({ errors: validationErrors });
			}
			logger.error("Erro inesperado ao criar aula:", error.message);
			return res.status(500).json({ error: "Erro ao criar aula" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				courseId: Yup.number().required("O ID do curso é obrigatório."),
				name: Yup.string().required("O nome da aula é obrigatório."),
				description: Yup.string().nullable(),
				duration: Yup.number().required("A duração da aula é obrigatória."),
				instructorId: Yup.string()
					.uuid()
					.required("O ID do instrutor é obrigatório."),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { courseId, id } = req.params;
			const { name, description, duration, path, instructorId } = req.body;

			const updatedAula = await aulaService.updateAula(
				Number(courseId),
				Number(id),
				{
					name,
					description,
					duration: duration !== undefined ? Number(duration) : undefined,
					path,
					instructorId:
						instructorId !== undefined ? Number(instructorId) : undefined,
				},
			);

			if (!updatedAula) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			return res.status(200).json(updatedAula);
		} catch (error) {
			logger.error("Erro ao atualizar aula:", error.message);
			return res
				.status(500)
				.json({ error: "Erro ao atualizar aula", details: error.message });
		}
	}

	async delete(req, res) {
		try {
			const { courseId, id } = req.params;
			const deleted = await aulaService.deleteAula(courseId, id);

			if (!deleted) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao excluir aula:", error.message);
			return res.status(500).json({ error: "Erro ao excluir aula" });
		}
	}
}

export default new AulasController();
