// src/app/controllers/LikeController.js

import logger from "../../../utils/logger";
import * as likeService from "../services/likeService";

class LikeController {
	async add(req, res) {
		try {
			const { userId } = req.body;
			const { entityId, entityType } = req.params;

			const like = await likeService.addLike(userId, entityId, entityType);

			return res.status(201).json(like);
		} catch (error) {
			logger.error("Erro ao adicionar like:", error);
			return res.status(500).json({ error: "Erro ao adicionar like" });
		}
	}

	async remove(req, res) {
		try {
			const { userId } = req.body;
			const { entityId, entityType } = req.params;

			await likeService.removeLike(userId, entityId, entityType);

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao remover like:", error);
			return res.status(500).json({ error: "Erro ao remover like" });
		}
	}

	async list(req, res) {
		try {
			const { entityId, entityType } = req.params;

			const likes = await likeService.listLikes(entityId, entityType);

			return res.json(likes);
		} catch (error) {
			logger.error("Erro ao listar likes:", error);
			return res.status(500).json({ error: "Erro ao listar likes" });
		}
	}
}

export default new LikeController();
