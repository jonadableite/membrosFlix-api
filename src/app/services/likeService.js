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
		// Verifica se o usuário existe
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!userExists) {
			throw new Error("Usuário não encontrado");
		}

		// Verifica se a entidade (aula ou comentário) existe
		const entityExists = await prisma[entityType].findUnique({
			where: { id: Number.parseInt(entityId, 10) },
		});

		if (!entityExists) {
			throw new Error(
				`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} não encontrado`,
			);
		}

		// Verifica se o like já existe para evitar duplicações
		const existingLike = await prisma.like.findFirst({
			where: {
				userId,
				...(entityType === "aula" && { aulaId: Number.parseInt(entityId, 10) }),
				...(entityType === "comment" && {
					commentId: Number.parseInt(entityId, 10),
				}),
			},
		});

		if (existingLike) {
			return existingLike; // Retorna o like existente
		}

		// Cria o like
		const like = await prisma.like.create({
			data: {
				userId,
				...(entityType === "aula" && { aulaId: Number.parseInt(entityId, 10) }),
				...(entityType === "comment" && {
					commentId: Number.parseInt(entityId, 10),
				}),
			},
		});

		return like;
	} catch (error) {
		console.error("Erro ao adicionar like:", error.message);
		throw new Error("Erro ao adicionar like");
	}
}

/**
 * Remove um like de uma entidade (aula ou comentário).
 * @param {string} userId - ID do usuário.
 * @param {string} entityId - ID da entidade (aula ou comentário).
 * @param {string} entityType - Tipo da entidade ("aula" ou "comment").
 * @returns {Promise<boolean>} - Retorna true se o like for removido com sucesso.
 * @throws {Error} - Lança um erro se o like não for encontrado.
 */
export async function removeLike(userId, entityId, entityType) {
	try {
		// Verifica se o like existe
		const like = await prisma.like.findFirst({
			where: {
				userId,
				...(entityType === "aula" && { aulaId: Number.parseInt(entityId, 10) }),
				...(entityType === "comment" && {
					commentId: Number.parseInt(entityId, 10),
				}),
			},
		});

		if (!like) {
			throw new Error("Like não encontrado");
		}

		// Remove o like
		await prisma.like.delete({
			where: { id: like.id },
		});

		return true;
	} catch (error) {
		console.error("Erro ao remover like:", error.message);
		throw new Error("Erro ao remover like");
	}
}
