import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Adiciona um like a uma entidade (aula ou comentário).
 * @param {string} userId - ID do usuário.
 * @param {string} entityId - ID da entidade (aula ou comentário).
 * @param {string} entityType - Tipo da entidade ("aula" ou "comment").
 * @returns {Promise<Object>} - Retorna o like criado ou existente.
 * @throws {Error} - Lança um erro se o usuário ou entidade não for encontrado.
 */
export async function addLike(userId, entityId, entityType) {
	try {
		const existingLike = await prisma.like.findFirst({
			where: {
				userId,
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		if (existingLike) return existingLike;

		const like = await prisma.like.create({
			data: {
				userId,
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		if (entityType === "comment") {
			await prisma.comment.update({
				where: { id: Number(entityId) },
				data: { likesCount: { increment: 1 } },
			});
		}

		return like;
	} catch (error) {
		console.error("Erro ao adicionar like:", error.message);
		throw new Error("Erro ao adicionar like");
	}
}

export async function removeLike(userId, entityId, entityType) {
	try {
		const like = await prisma.like.findFirst({
			where: {
				userId,
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		if (!like) {
			throw new Error("Like não encontrado");
		}

		await prisma.like.delete({
			where: { id: like.id },
		});

		if (entityType === "comment") {
			await prisma.comment.update({
				where: { id: Number(entityId) },
				data: { likesCount: { decrement: 1 } },
			});
		}

		return true;
	} catch (error) {
		console.error("Erro ao remover like:", error.message);
		throw new Error("Erro ao remover like");
	}
}

export async function listLikes(entityId, entityType) {
	try {
		const likes = await prisma.like.findMany({
			where: {
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		return likes;
	} catch (error) {
		console.error("Erro ao listar likes:", error.message);
		throw new Error("Erro ao listar likes");
	}
}
