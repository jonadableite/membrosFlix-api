// src/app/controllers/UserProgressController.js
import * as Yup from "yup";
import logger from "../../../utils/logger";
import UserProgress from "../models/UserProgress";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProgress:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         courseId:
 *           type: integer
 *         progressoAula:
 *           type: integer
 *         progressoCurso:
 *           type: integer
 *         concluido:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserProgressInput:
 *       type: object
 *       properties:
 *         progressoCurso:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Progresso do curso (0-100)
 *         concluido:
 *           type: boolean
 *           description: Indica se o curso foi concluído
 */
class UserProgressController {
	/**
	 * Atualiza ou cria o progresso do usuário em um curso.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {string} req.params.userId - ID do usuário.
	 * @param {string} req.params.courseId - ID do curso.
	 * @param {number} req.body.progressoCurso - Progresso do curso (0-100).
	 * @param {boolean} req.body.concluido - Indica se o curso foi concluído.
	 * @returns {Promise<Object>} JSON com o progresso atualizado ou um erro.
	 */

	/**
	 * @swagger
	 * /users/{userId}/courses/{courseId}/progress:
	 *   put:
	 *     summary: Atualiza ou cria o progresso do usuário em um curso
	 *     tags: [Progresso]
	 *     parameters:
	 *       - in: path
	 *         name: userId
	 *         schema:
	 *           type: string
	 *         required: true
	 *         description: ID do usuário
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UserProgressInput'
	 *     responses:
	 *       200:
	 *         description: Progresso atualizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/UserProgress'
	 *       400:
	 *         description: Erro de validação
	 *       500:
	 *         description: Erro ao atualizar progresso
	 */
	async update(req, res) {
		const schema = Yup.object().shape({
			progressoCurso: Yup.number().min(0).max(100).required(),
			concluido: Yup.boolean().required(),
		});

		try {
			await schema.validate(req.body, { abortEarly: false });

			const { userId, courseId } = req.params;
			const { progressoCurso, concluido } = req.body;

			let progress = await UserProgress.findOne({
				where: { userId, courseId },
			});

			if (!progress) {
				progress = await UserProgress.create({
					userId,
					courseId,
					progressoCurso,
					concluido,
				}); // Cria se não existir
			} else {
				await progress.update({ progressoCurso, concluido }); // Atualiza se existir
			}

			return res.json(progress);
		} catch (err) {
			if (err instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: err.errors });
			}
			logger.error("Erro ao atualizar progresso:", err);
			return res.status(500).json({ error: "Erro ao atualizar progresso" });
		}
	}

	/**
	 * Obtém o progresso do usuário em um curso.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {string} req.params.userId - ID do usuário.
	 * @param {string} req.params.courseId - ID do curso.
	 * @returns {Promise<Object>} JSON com o progresso ou um erro.
	 */

	/**
	 * @swagger
	 * /users/{userId}/courses/{courseId}/progress:
	 *   get:
	 *     summary: Obtém o progresso do usuário em um curso
	 *     tags: [Progresso]
	 *     parameters:
	 *       - in: path
	 *         name: userId
	 *         schema:
	 *           type: string
	 *         required: true
	 *         description: ID do usuário
	 *       - in: path
	 *         name: courseId
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     responses:
	 *       200:
	 *         description: Progresso obtido com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/UserProgress'
	 *       404:
	 *         description: Progresso não encontrado
	 *       500:
	 *         description: Erro ao obter progresso
	 */
	async show(req, res) {
		try {
			const { userId, courseId } = req.params;
			const progress = await UserProgress.findOne({
				where: { userId, courseId },
			});

			if (!progress) {
				return res.status(404).json({ error: "Progresso não encontrado" });
			}

			return res.json(progress);
		} catch (error) {
			logger.error("Erro ao obter progresso:", error);
			return res.status(500).json({ error: "Erro ao obter progresso" });
		}
	}
}

export default new UserProgressController();
