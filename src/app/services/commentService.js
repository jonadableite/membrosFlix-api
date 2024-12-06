// src/app/services/commentService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createComment(data) {
	try {
		const { content, userId, aulaId, cursoId, parentId } = data;

		const comment = await prisma.comment.create({
			data: {
				content,
				userId,
				aulaId,
				cursoId,
				parentId,
			},
		});

		return comment;
	} catch (error) {
		console.error("Erro ao criar comentário:", error);
		throw error;
	}
}

export async function listComments(entityId, entityType) {
	try {
		return await prisma.comment.findMany({
			where: {
				[entityType]: entityId,
			},
			include: {
				user: true, // Inclui informações do usuário que fez o comentário
				replies: true, // Inclui respostas ao comentário
			},
		});
	} catch (error) {
		console.error("Erro ao listar comentários:", error);
		throw error;
	}
}

export async function updateComment(commentId, content) {
	try {
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			throw new Error("Comentário não encontrado");
		}

		return await prisma.comment.update({
			where: { id: commentId },
			data: { content },
		});
	} catch (error) {
		console.error("Erro ao atualizar comentário:", error);
		throw error;
	}
}

export async function deleteComment(commentId) {
	try {
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			throw new Error("Comentário não encontrado");
		}

		await prisma.comment.delete({
			where: { id: commentId },
		});
	} catch (error) {
		console.error("Erro ao excluir comentário:", error);
		throw error;
	}
}
