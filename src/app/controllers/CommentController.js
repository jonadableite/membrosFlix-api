import * as Yup from "yup";
import logger from "../../../utils/logger.js";
import * as commentService from "../services/commentService.js";

class CommentController {
	async create(req, res) {
		try {
			const schema = Yup.object().shape({
				content: Yup.string().required(
					"O conteúdo do comentário é obrigatório",
				),
				userId: Yup.string().required("O ID do usuário é obrigatório"),
				aulaId: Yup.number().required("O ID da aula é obrigatório"),
				cursoId: Yup.number().required("O ID do curso é obrigatório"),
				parentId: Yup.number().nullable(),
				isAnonymous: Yup.boolean().default(false),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { content, userId, aulaId, cursoId, parentId, isAnonymous } =
				req.body;

			const comment = await commentService.createComment({
				content,
				userId,
				aulaId,
				cursoId,
				parentId,
				isAnonymous,
			});

			return res.status(201).json(comment);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao criar comentário:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao criar comentário:", error.message);
			return res.status(500).json({ error: "Erro ao criar comentário" });
		}
	}

	async list(req, res) {
		try {
			const { courseId, lessonId } = req.params;

			const comments = await commentService.listComments(courseId, lessonId);

			return res.json(comments);
		} catch (error) {
			logger.error("Erro ao listar comentários:", error.message);
			return res.status(500).json({ error: "Erro ao listar comentários" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				content: Yup.string().required(
					"O conteúdo do comentário é obrigatório",
				),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { commentId } = req.params;
			const { content } = req.body;
			const userId = req.userId;

			// Verifica se o comentário pertence ao usuário
			const comment = await commentService.getCommentById(commentId);
			if (!comment) {
				return res.status(404).json({ error: "Comentário não encontrado" });
			}
			if (comment.userId !== userId) {
				return res.status(403).json({
					error: "Você não tem permissão para editar este comentário",
				});
			}

			const updatedComment = await commentService.updateComment(
				commentId,
				content,
				userId,
			);

			return res.json(updatedComment);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error(
					"Erro de validação ao atualizar comentário:",
					error.errors,
				);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao atualizar comentário:", error.message);
			return res.status(500).json({ error: "Erro ao atualizar comentário" });
		}
	}

	async delete(req, res) {
		try {
			const { commentId } = req.params;
			const userId = req.userId;

			const comment = await commentService.getCommentById(commentId);
			if (!comment) {
				return res.status(404).json({ error: "Comentário não encontrado" });
			}
			if (comment.userId !== userId) {
				return res.status(403).json({
					error: "Você não tem permissão para excluir este comentário",
				});
			}

			await commentService.deleteComment(commentId, userId);

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao excluir comentário:", error.message);
			return res.status(500).json({ error: "Erro ao excluir comentário" });
		}
	}
}

export default new CommentController();
