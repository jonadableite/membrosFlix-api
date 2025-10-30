import { Router } from "express";
import { CommentSimpleService } from "../services/comment-simple.service";
import { authenticate } from "../../../shared/middlewares/auth.middleware";

const commentRoutes = Router();
const commentService = new CommentSimpleService();

/**
 * GET /api/v1/comments/:id
 * Buscar comentário por ID (para redirecionamento de notificações)
 */
commentRoutes.get("/:id", authenticate, async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      return res.status(400).json({
        success: false,
        message: "ID do comentário é obrigatório",
      });
    }
    
    const commentId = parseInt(idParam);

    // Buscar comentário com dados da aula e curso
    const comment = await commentService.getCommentById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comentário não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Erro ao buscar comentário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar comentário",
    });
  }
});

export { commentRoutes };
