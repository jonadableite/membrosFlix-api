// src/app/services/commentService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createComment(data) {
	try {
		const { content, userId, aulaId, cursoId, parentId } = data;

		// Verifica se o usuário existe
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!userExists) {
			throw new Error("Usuário não encontrado");
		}

		// Verifica se a aula ou curso existe
		if (aulaId) {
			const aulaExists = await prisma.aula.findUnique({
				where: { id: aulaId },
			});
			if (!aulaExists) {
				throw new Error("Aula não encontrada");
			}
		}

		if (cursoId) {
			const cursoExists = await prisma.curso.findUnique({
				where: { id: cursoId },
			});
			if (!cursoExists) {
				throw new Error("Curso não encontrado");
			}
		}

		// Verifica se o comentário pai existe, se fornecido
		if (parentId) {
			const parentCommentExists = await prisma.comment.findUnique({
				where: { id: parentId },
			});
			if (!parentCommentExists) {
				throw new Error("Comentário pai não encontrado");
			}
		}

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
		console.error("Erro ao criar comentário:", error.message);
		throw new Error("Erro ao criar comentário");
	}
}

export async function listComments(courseId, lessonId) {
	try {
		const whereClause = lessonId
			? { aulaId: Number.parseInt(lessonId, 10) }
			: { cursoId: Number.parseInt(courseId, 10) };

		return await prisma.comment.findMany({
			where: whereClause,
			include: {
				user: true, // Inclui informações do usuário que fez o comentário
				replies: true, // Inclui respostas ao comentário
			},
		});
	} catch (error) {
		console.error("Erro ao listar comentários:", error.message);
		throw new Error("Erro ao listar comentários");
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
		console.error("Erro ao atualizar comentário:", error.message);
		throw new Error("Erro ao atualizar comentário");
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
		console.error("Erro ao excluir comentário:", error.message);
		throw new Error("Erro ao excluir comentário");
	}
}
