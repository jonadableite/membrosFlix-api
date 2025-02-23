// src/app/controllers/UserProgressController.js
import * as Yup from "yup";
import logger from "../../../utils/logger";
import * as userProgressService from "../services/userProgressService";

class UserProgressController {
	async update(req, res) {
		const schema = Yup.object().shape({
			progressoCurso: Yup.number().min(0).max(100).required(),
			concluido: Yup.boolean().required(),
		});

		try {
			await schema.validate(req.body, { abortEarly: false });

			const { userId, courseId } = req.params;
			const progress = await userProgressService.updateUserProgress(
				userId,
				courseId,
				req.body,
			);

			return res.json(progress);
		} catch (err) {
			if (err instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: err.errors });
			}
			logger.error("Erro ao atualizar progresso:", err);
			return res.status(500).json({ error: "Erro ao atualizar progresso" });
		}
	}

	async show(req, res) {
		try {
			const { userId, courseId } = req.params;
			const progress = await userProgressService.getUserProgress(
				userId,
				courseId,
			);

			return res.json(progress);
		} catch (error) {
			logger.error("Erro ao obter progresso:", error);
			return res.status(500).json({ error: "Erro ao obter progresso" });
		}
	}
}

export default new UserProgressController();
