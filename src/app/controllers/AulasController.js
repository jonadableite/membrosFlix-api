// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import fs from "fs";
import * as Yup from "yup";
import Aulas from "../models/Aulas";
const Minio = require("minio");

// Configura o MinIO
const minioClient = new Minio.Client({
	endPoint: "minioapi.whatlead.com.br",
	port: 443,
	useSSL: true,
	accessKey: process.env.MINIO_ROOT_USER,
	secretKey: process.env.MINIO_ROOT_PASSWORD,
	region: "eu-south",
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Aula:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         duration:
 *           type: integer
 *         path:
 *           type: string
 *         courseId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AulaInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         duration:
 *           type: integer
 *         courseId:
 *           type: integer
 */

/**
 * Controller para gerenciar as aulas.
 */
class AulasController {
	/**
	 * Lista todas as aulas de um curso específico.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {number} req.params.courseId - ID do curso.
	 * @returns {Object} JSON com a lista de aulas ou um erro 500.
	 */

	/**
	 * @swagger
	 * /cursos/{courseId}/aulas:
	 *   get:
	 *     summary: Lista todas as aulas de um curso
	 *     tags: [Aulas]
	 *     parameters:
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     responses:
	 *       200:
	 *         description: Lista de aulas
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Aula'
	 *       500:
	 *         description: Erro ao listar aulas
	 */

	async index(req, res) {
		try {
			const { courseId } = req.params;
			const aulas = await Aulas.findAll({ where: { courseId } });
			return res.json(aulas);
		} catch (error) {
			console.error("Erro ao listar aulas:", error); // Mensagem de erro mais descritiva
			return res.status(500).json({ error: "Erro ao listar aulas" });
		}
	}

	/**
	 * Exibe uma aula específica de um curso.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {number} req.params.courseId - ID do curso.
	 * @param {number} req.params.id - ID da aula.
	 * @returns {Object} JSON com a aula ou um erro 404/500.
	 */

	/**
	 * @swagger
	 * /cursos/{courseId}/aulas/{id}:
	 *   get:
	 *     summary: Exibe uma aula específica
	 *     tags: [Aulas]
	 *     parameters:
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID da aula
	 *     responses:
	 *       200:
	 *         description: Dados da aula
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Aula'
	 *       404:
	 *         description: Aula não encontrada
	 *       500:
	 *         description: Erro ao exibir aula
	 */

	async show(req, res) {
		try {
			const { courseId, id } = req.params;
			const aulas = await Aulas.findOne({ where: { id, courseId } });

			if (!aulas) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			return res.json(aulas);
		} catch (error) {
			console.error("Erro ao exibir aula:", error);
			return res.status(500).json({ error: "Erro ao exibir aula" });
		}
	}

	/**
	 * Cria uma nova aula com upload de vídeo.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {File} req.file - Arquivo de vídeo enviado.
	 * @param {string} req.body.name - Nome da aula.
	 * @param {string} req.body.description - Descrição da aula.
	 * @param {number} req.body.duration - Duração da aula.
	 * @param {number} req.body.courseId - ID do curso.
	 * @returns {Object} JSON com a aula criada ou um erro 400/404/500.
	 */

	/**
	 * @swagger
	 * /cursos/{courseId}/aulas:
	 *   post:
	 *     summary: Cria uma nova aula
	 *     tags: [Aulas]
	 *     parameters:
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         multipart/form-data:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               file:
	 *                 type: string
	 *                 format: binary
	 *                 description: Arquivo de vídeo
	 *               name:
	 *                 type: string
	 *               description:
	 *                 type: string
	 *               duration:
	 *                 type: integer
	 *     responses:
	 *       201:
	 *         description: Aula criada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Aula'
	 *       400:
	 *         description: Erro de validação ou arquivo não enviado
	 *       500:
	 *         description: Erro ao criar aula
	 */

	/**
	 * Cria uma nova aula com upload de vídeo.
	 */
	async store(req, res) {
		try {
			const schema = Yup.object().shape({
				courseId: Yup.number().required(),
				name: Yup.string().required(),
				description: Yup.string(),
				duration: Yup.number().required(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { file } = req;
			const { courseId, name, description, duration } = req.body;

			if (!file) {
				return res
					.status(400)
					.json({ error: "Nenhum arquivo de vídeo enviado." });
			}

			const bucketName = "curso"; // Nome do bucket

			// Cria o bucket se ele não existir
			const bucketExists = await minioClient.bucketExists(bucketName);
			if (!bucketExists) {
				await minioClient.makeBucket(bucketName, "eu-south");
			}

			// Envia o arquivo para o MinIO
			await minioClient.fPutObject(bucketName, file.filename, file.path, {
				"Content-Type": file.mimetype,
			});

			const path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${file.filename}`;

			const aulas = await Aulas.create({
				name,
				description,
				duration,
				path,
				courseId,
			});

			fs.unlinkSync(file.path); // Remove o arquivo temporário

			return res
				.status(201)
				.json({ message: "Aula criada com sucesso", aula: aulas }); // Retorna o objeto aula
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				console.error("Erro de validação:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			console.error("Erro inesperado ao criar aula:", error); // Mensagem de erro mais descritiva
			return res.status(500).json({ error: "Erro ao criar aula" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				name: Yup.string(),
				description: Yup.string(),
				duration: Yup.number(),
				path: Yup.string(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { courseId, id } = req.params;
			const aulas = await Aulas.findOne({ where: { id, courseId } });

			if (!aulas) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			const { name, description, duration, path } = req.body;

			await aulas.update({ name, description, duration, path }); // Atualiza a aula

			return res.status(200).json(aulas); // Retorna 200 OK e os dados atualizados
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			console.error(error);
			return res.status(500).json({ error: "Erro ao atualizar aula" });
		}
	}

	/**
	 * @swagger
	 * /cursos/{courseId}/aulas/{id}:
	 *   delete:
	 *     summary: Exclui uma aula
	 *     tags: [Aulas]
	 *     parameters:
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID da aula
	 *     responses:
	 *       204:
	 *         description: Aula excluída com sucesso
	 *       404:
	 *         description: Aula não encontrada
	 *       500:
	 *         description: Erro ao excluir aula
	 */

	async delete(req, res) {
		try {
			const { courseId, id } = req.params;
			const aulas = await Aulas.findOne({ where: { id, courseId } });

			if (!aulas) {
				return res.status(404).json({ error: "Aula não encontrada" });
			}

			await aulas.destroy(); // Exclui a aula (hard delete)

			return res.status(204).send(); // Retorna 204 No Content
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Erro ao excluir aula" });
		}
	}
}

export default new AulasController();
