// services/notificationService.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cria uma nova notificação para um usuário.
 * @param {string} userId - ID do usuário que receberá a notificação.
 * @param {string} tipo - Tipo da notificação.
 * @param {string} mensagem - Mensagem da notificação.
 * @returns {Promise<Object>} - A notificação criada.
 */
async function createNotification(userId, tipo, mensagem) {
	try {
		const notification = await prisma.notification.create({
			data: {
				userId,
				tipo: String(tipo), // Converte o tipo para string
				mensagem,
			},
		});
		return notification;
	} catch (error) {
		console.error("Erro ao criar notificação:", error);
		console.error("Detalhes do erro:", {
			userId,
			tipo,
			mensagem,
			errorMessage: error.message,
			errorCode: error.code,
		});
		throw error;
	}
}

/**
 * Marca uma notificação como lida.
 * @param {string} notificationId - ID da notificação a ser marcada como lida.
 * @returns {Promise<Object>} - A notificação atualizada.
 */
async function markNotificationAsRead(notificationId) {
	try {
		const notification = await prisma.notification.update({
			where: { id: notificationId },
			data: { lida: true },
		});
		return notification;
	} catch (error) {
		console.error("Erro ao marcar notificação como lida:", error);
		throw new Error("Erro ao marcar notificação como lida");
	}
}

/**
 * Obtém todas as notificações não lidas de um usuário.
 * @param {string} userId - ID do usuário.
 * @returns {Promise<Array>} - Lista de notificações não lidas.
 */
export async function getUnreadNotifications(userId) {
	const token = localStorage.getItem("@membrosflix:token");

	try {
		const response = await fetch(`/users/${userId}/notifications/unread`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			// Tenta capturar o texto da resposta em vez de JSON
			const errorText = await response.text();
			throw new Error(`Erro ao obter notificações: ${errorText}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Erro ao obter notificações não lidas:", error);
		throw error;
	}
}

export default {
	createNotification,
	markNotificationAsRead,
	getUnreadNotifications,
};
