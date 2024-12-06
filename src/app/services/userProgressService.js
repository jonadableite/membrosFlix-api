// src/app/services/userProgressService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateUserProgress(userId, courseId, data) {
	try {
		const { progressoCurso, concluido } = data;

		let progress = await prisma.userProgress.findUnique({
			where: {
				userId_courseId: {
					userId,
					courseId: Number.parseInt(courseId),
				},
			},
		});

		if (!progress) {
			progress = await prisma.userProgress.create({
				data: {
					userId,
					courseId: Number.parseInt(courseId),
					progressoCurso,
					concluido,
				},
			});
		} else {
			progress = await prisma.userProgress.update({
				where: {
					userId_courseId: {
						userId,
						courseId: Number.parseInt(courseId),
					},
				},
				data: { progressoCurso, concluido },
			});
		}

		return progress;
	} catch (error) {
		console.error("Erro ao atualizar progresso:", error);
		throw error;
	}
}

export async function getUserProgress(userId, courseId) {
	try {
		const progress = await prisma.userProgress.findUnique({
			where: {
				userId_courseId: {
					userId,
					courseId: Number.parseInt(courseId),
				},
			},
		});

		if (!progress) {
			throw new Error("Progresso não encontrado");
		}

		return progress;
	} catch (error) {
		console.error("Erro ao obter progresso:", error);
		throw error;
	}
}
