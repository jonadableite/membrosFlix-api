import * as Yup from "yup";
import logger from "../../../utils/logger";
import * as likeService from "../services/likeService";

class LikeController {
	async add(req, res) {
		try {
			const schema = Yup.object().shape({
				userId: Yup.string().required("O ID do usuário é obrigatório"),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { userId } = req.body;
			const { lessonId } = req.params;

			const like = await likeService.addLike(userId, lessonId, "aula");

			if (!like) {
				return res.status(404).json({ error: "Entidade não encontrada" });
			}

			return res.status(201).json(like);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao adicionar like:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao adicionar like:", error.message);
			return res.status(500).json({ error: "Erro ao adicionar like" });
		}
	}

	async remove(req, res) {
		try {
			const schema = Yup.object().shape({
				userId: Yup.string().required("O ID do usuário é obrigatório"),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { userId } = req.body;
			const { lessonId } = req.params;

			const removed = await likeService.removeLike(userId, lessonId, "aula");

			if (!removed) {
				return res.status(404).json({ error: "Like não encontrado" });
			}

			return res.status(204).send();
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao remover like:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao remover like:", error.message);
			return res.status(500).json({ error: "Erro ao remover like" });
		}
	}
}

export default new LikeController();
