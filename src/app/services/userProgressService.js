// src/app/services/userProgressService.js
import { PrismaClient } from "@prisma/client";
import logger from "../../../utils/logger.js";
import getIO from "../../config/websocket.js";

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

		// Obtenha a instância do WebSocket
		const io = getIO();

		// Emita o evento de progresso atualizado
		io.emit("progressUpdated", {
			userId,
			courseId,
			aulaId,
			progressoAula,
			concluido,
		});

		return progress;
	} catch (error) {
		logger.error("Erro ao atualizar progresso:", error);
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
		logger.error("Erro ao obter progresso:", error);
		throw error;
	}
}
