// src/app/controllers/LikeController.js

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
			const { entityId, entityType } = req.params;

			if (!entityId || !entityType) {
				return res.status(400).json({ error: "Parâmetros inválidos" });
			}

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
			const { entityId, entityType } = req.params;

			if (!entityId || !entityType) {
				return res.status(400).json({ error: "Parâmetros inválidos" });
			}

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
			const { entityId, entityType } = req.params;

			if (!entityId || !entityType) {
				return res.status(400).json({ error: "Parâmetros inválidos" });
			}

			const likes = await likeService.listLikes(entityId, entityType);

			if (!likes) {
				return res.status(404).json({ error: "Entidade não encontrada" });
			}

			return res.json(likes);
		} catch (error) {
			logger.error("Erro ao listar likes:", error.message);
			return res.status(500).json({ error: "Erro ao listar likes" });
		}
	}
}

export default new LikeController();
