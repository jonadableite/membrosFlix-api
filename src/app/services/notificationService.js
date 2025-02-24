// src/app/services/notificationService.js
import { PrismaClient } from "@prisma/client";
import logger from "../../../utils/logger.js";

const prisma = new PrismaClient();

export const createNotification = async (userId, type, message, data = null) => {
	try {
		const notification = await prisma.notification.create({
			data: {
				userId,
				tipo: type,
				mensagem: message,
				data: data ? JSON.stringify(data) : null,
			},
		});

		logger.log("Notificação criada com sucesso", {
			userId,
			notificationId: notification.id,
		});

		return notification;
	} catch (error) {
		logger.error("Erro ao criar notificação:", error);
		throw error;
	}
};

export const markAsRead = async (notificationId) => {
	try {
		const notification = await prisma.notification.update({
			where: { id: notificationId },
			data: { lida: true },
		});

		return notification;
	} catch (error) {
		logger.error("Erro ao marcar notificação como lida:", error);
		throw error;
	}
};

export const markAllAsRead = async (userId) => {
	try {
		await prisma.notification.updateMany({
			where: { userId, lida: false },
			data: { lida: true },
		});
	} catch (error) {
		logger.error("Erro ao marcar todas notificações como lidas:", error);
		throw error;
	}
};

export const getUnreadNotifications = async (userId) => {
	try {
		const notifications = await prisma.notification.findMany({
			where: {
				userId,
				lida: false,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return notifications;
	} catch (error) {
		logger.error("Erro ao buscar notificações não lidas:", error);
		throw error;
	}
};

export const getAllNotifications = async (userId, page = 1, limit = 10) => {
	try {
		const skip = (page - 1) * limit;

		const [notifications, total] = await Promise.all([
			prisma.notification.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			prisma.notification.count({
				where: { userId },
			}),
		]);

		return {
			notifications,
			pagination: {
				total,
				pages: Math.ceil(total / limit),
				currentPage: page,
				perPage: limit,
			},
		};
	} catch (error) {
		logger.error("Erro ao buscar todas as notificações:", error);
		throw error;
	}
};

export const deleteNotification = async (notificationId) => {
	try {
		await prisma.notification.delete({
			where: { id: notificationId },
		});
	} catch (error) {
		logger.error("Erro ao deletar notificação:", error);
		throw error;
	}
};

export const clearAllNotifications = async (userId) => {
	try {
		await prisma.notification.deleteMany({
			where: { userId },
		});
	} catch (error) {
		logger.error("Erro ao limpar todas as notificações:", error);
		throw error;
	}
};

export const countUnreadNotifications = async (userId) => {
	try {
		const count = await prisma.notification.count({
			where: {
				userId,
				lida: false,
			},
		});

		return count;
	} catch (error) {
		logger.error("Erro ao contar notificações não lidas:", error);
		throw error;
	}
};

// Exporta um objeto com todas as funções
export default {
	createNotification,
	markAsRead,
	markAllAsRead,
	getUnreadNotifications,
	getAllNotifications,
	deleteNotification,
	clearAllNotifications,
	countUnreadNotifications,
};
