import * as Yup from "yup";
import logger from "../../../utils/logger.js";
import * as likeService from "../services/likeService.js";

class LikeController {
	async add(req, res) {
		try {
			const schema = Yup.object().shape({
				userId: Yup.string().required("O ID do usuário é obrigatório"),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { userId } = req.body;
			const { lessonId, commentId } = req.params;

			// Verifica se é um like em aula ou comentário
			const entityType = commentId ? "comment" : "aula";
			const entityId = commentId || lessonId;

			const like = await likeService.addLike(userId, entityId, entityType);

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
			const { lessonId, commentId } = req.params;

			// Verifica se é um like em aula ou comentário
			const entityType = commentId ? "comment" : "aula";
			const entityId = commentId || lessonId;

			const removed = await likeService.removeLike(
				userId,
				entityId,
				entityType,
			);

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

	async list(req, res) {
		try {
			const { lessonId, commentId } = req.params;

			// Verifica se é um like em aula ou comentário
			const entityType = commentId ? "comment" : "aula";
			const entityId = commentId || lessonId;

			const likes = await likeService.listLikes(entityId, entityType);

			return res.status(200).json(likes);
		} catch (error) {
			logger.error("Erro ao listar likes:", error.message);
			return res.status(500).json({ error: "Erro ao listar likes" });
		}
	}
}

export default new LikeController();
