// src/app/services/likeService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
				[entityType]: Number.parseInt(entityId, 10),
			},
		});

		if (existingLike) {
			throw new Error("Like já existe");
		}

		// Cria o like
		const like = await prisma.like.create({
			data: {
				userId,
				[entityType]: Number.parseInt(entityId, 10),
			},
		});

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
				[entityType]: Number.parseInt(entityId, 10),
			},
		});

		if (!like) {
			throw new Error("Like não encontrado");
		}

		await prisma.like.delete({
			where: { id: like.id },
		});
	} catch (error) {
		console.error("Erro ao remover like:", error.message);
		throw new Error("Erro ao remover like");
	}
}

export async function listLikes(entityId, entityType) {
	try {
		return await prisma.like.findMany({
			where: {
				[entityType]: Number.parseInt(entityId, 10),
			},
			include: {
				user: true, // Inclui informações do usuário que deu o like
			},
		});
	} catch (error) {
		console.error("Erro ao listar likes:", error.message);
		throw new Error("Erro ao listar likes");
	}
}
