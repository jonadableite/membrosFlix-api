import { PrismaClient } from "@prisma/client";
import { io } from "../../config/websocket";

const prisma = new PrismaClient();

export async function updateUserProgress(userId, courseId, progressData) {
	try {
		const { aulaId, progressoAula, concluido } = progressData;

		const progress = await prisma.userProgress.upsert({
			where: {
				userId_courseId: { userId, courseId: Number(courseId) },
			},
			update: {
				aulaId,
				progressoAula,
				concluido,
				ultimoAcesso: new Date(),
				tempoEstudo: { increment: 60 }, // incrementa 1 minuto
			},
			create: {
				userId,
				courseId: Number(courseId),
				aulaId,
				progressoAula,
				concluido,
				iniciadoEm: new Date(),
			},
		});

		io.emit("progressUpdated", {
			userId,
			courseId,
			aulaId,
			progressoAula,
			concluido,
		});

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
					courseId: Number(courseId),
				},
			},
		});

		if (!progress) {
			return {
				userId,
				courseId,
				progressoAula: 0,
				progressoCurso: 0,
				concluido: false,
			};
		}

		return progress;
	} catch (error) {
		console.error("Erro ao obter progresso:", error);
		throw error;
	}
}
