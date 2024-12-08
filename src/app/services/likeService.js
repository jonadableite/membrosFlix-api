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
		// Verifica se o like já existe
		const existingLike = await prisma.like.findFirst({
			where: {
				userId,
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		if (existingLike) return existingLike;

		// Cria o like
		const like = await prisma.like.create({
			data: {
				userId,
				...(entityType === "aula" && { aulaId: Number(entityId) }),
				...(entityType === "comment" && { commentId: Number(entityId) }),
			},
		});

		// Atualiza o contador de likes no comentário
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
		// Verifica se o like existe
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

		// Remove o like
		await prisma.like.delete({
			where: { id: like.id },
		});

		// Atualiza o contador de likes no comentário
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
