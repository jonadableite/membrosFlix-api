// src/app/controllers/CommentController.js

import logger from "../../../utils/logger";
import * as commentService from "../services/commentService";

class CommentController {
	async create(req, res) {
		try {
			const { content, userId, aulaId, cursoId, parentId } = req.body;

			const comment = await commentService.createComment({
				content,
				userId,
				aulaId,
				cursoId,
				parentId,
			});

			return res.status(201).json(comment);
		} catch (error) {
			logger.error("Erro ao criar comentário:", error);
			return res.status(500).json({ error: "Erro ao criar comentário" });
		}
	}

	async list(req, res) {
		try {
			const { entityId, entityType } = req.params;

			const comments = await commentService.listComments(entityId, entityType);

			return res.json(comments);
		} catch (error) {
			logger.error("Erro ao listar comentários:", error);
			return res.status(500).json({ error: "Erro ao listar comentários" });
		}
	}

	async update(req, res) {
		try {
			const { commentId } = req.params;
			const { content } = req.body;

			const updatedComment = await commentService.updateComment(
				commentId,
				content,
			);

			return res.json(updatedComment);
		} catch (error) {
			logger.error("Erro ao atualizar comentário:", error);
			return res.status(500).json({ error: "Erro ao atualizar comentário" });
		}
	}

	async delete(req, res) {
		try {
			const { commentId } = req.params;

			await commentService.deleteComment(commentId);

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao excluir comentário:", error);
			return res.status(500).json({ error: "Erro ao excluir comentário" });
		}
	}
}

export default new CommentController();
