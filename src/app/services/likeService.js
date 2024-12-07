// src/app/services/likeService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function addLike(userId, entityId, entityType) {
	try {
		// Verifica se o like já existe para evitar duplicações
		const existingLike = await prisma.like.findFirst({
			where: {
				userId,
				[entityType]: entityId,
			},
		});

		if (existingLike) {
			throw new Error("Like já existe");
		}

		// Cria o like
		const like = await prisma.like.create({
			data: {
				userId,
				[entityType]: entityId,
			},
		});

		return like;
	} catch (error) {
		console.error("Erro ao adicionar like:", error);
		throw error;
	}
}

export async function removeLike(userId, entityId, entityType) {
	try {
		const like = await prisma.like.findFirst({
			where: {
				userId,
				[entityType]: entityId,
			},
		});

		if (!like) {
			throw new Error("Like não encontrado");
		}

		await prisma.like.delete({
			where: { id: like.id },
		});
	} catch (error) {
		console.error("Erro ao remover like:", error);
		throw error;
	}
}

export async function listLikes(entityId, entityType) {
	try {
		return await prisma.like.findMany({
			where: {
				[entityType]: entityId,
			},
			include: {
				user: true, // Inclui informações do usuário que deu o like
			},
		});
	} catch (error) {
		console.error("Erro ao listar likes:", error);
		throw error;
	}
}
