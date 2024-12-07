// src/app/controllers/AulasController.js

// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import fs from "fs";
import * as Yup from "yup";
import logger from "../../../utils/logger";
import minioClient from "../../config/minioClient";
import * as aulaService from "../services/aulaService";

class AulasController {
	async index(req, res) {
		try {
			const { courseId } = req.params;
			const aulas = await aulaService.listAulas(courseId);
			return res.json(aulas);
		} catch (error) {
			logger.error("Erro ao listar aulas:", error.message);
			return res.status(500).json({ error: "Erro ao listar aulas" });
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

	async show(req, res) {
		try {
			const { courseId, id } = req.params;
			const aula = await aulaService.getAula(courseId, id);

			if (!aula) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			return res.json(aula);
		} catch (error) {
			logger.error("Erro ao exibir aula:", error.message);
			return res.status(500).json({ error: "Erro ao exibir aula" });
		}
	}

	async store(req, res) {
		try {
			const schema = Yup.object().shape({
				courseId: Yup.number().required("O ID do curso é obrigatório"),
				name: Yup.string().required("O nome da aula é obrigatório"),
				description: Yup.string().nullable(),
				duration: Yup.number().required("A duração da aula é obrigatória"),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { file } = req;
			const { courseId, name, description, duration } = req.body;

			if (!file) {
				return res
					.status(400)
					.json({ error: "Nenhum arquivo de vídeo enviado." });
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
				{ courseId, name, description, duration },
				path,
			);

			fs.unlinkSync(file.path);

			return res.status(201).json({ message: "Aula criada com sucesso", aula });
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro inesperado ao criar aula:", error.message);
			return res.status(500).json({ error: "Erro ao criar aula" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				name: Yup.string(),
				description: Yup.string().nullable(),
				duration: Yup.number(),
				path: Yup.string(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { courseId, id } = req.params;
			const { name, description, duration, path } = req.body;

			const updatedAula = await aulaService.updateAula(courseId, id, {
				name,
				description,
				duration,
				path,
			});

			if (!updatedAula) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			return res.status(200).json(updatedAula);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao atualizar aula:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao atualizar aula:", error.message);
			return res.status(500).json({ error: "Erro ao atualizar aula" });
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
