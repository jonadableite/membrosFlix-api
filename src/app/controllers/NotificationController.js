// controllers/NotificationController.js
const { PrismaClient } = require("@prisma/client");
const notificationService = require("../services/notificationService");
const prisma = new PrismaClient();

/**
 * Notifica os usuários sobre uma nova aula publicada.
 */
async function notifyNewLesson(req, res) {
	const { title, description, instructorId } = req.body;
	try {
		const aula = await prisma.aula.create({
			data: {
				title,
				description,
				instructorId,
			},
		});
		const users = await prisma.user.findMany();
		users.forEach((user) => {
			notificationService.createNotification(
				user.id,
				"NEW_LESSON",
				`Nova aula publicada: ${title}`,
			);
		});
		res.status(201).json(aula);
	} catch (error) {
		console.error("Erro ao criar aula:", error);
		res.status(500).json({ error: "Erro ao criar aula" });
	}
}

/**
 * Notifica os usuários sobre uma atualização de material.
 */
async function notifyMaterialUpdate(req, res) {
	const { title, url, aulaId } = req.body;
	try {
		const material = await prisma.material.create({
			data: {
				title,
				url,
				aulaId,
			},
		});
		const progress = await prisma.userProgress.findMany({
			where: { aulaId },
			include: { user: true },
		});
		progress.forEach(({ user }) => {
			notificationService.createNotification(
				user.id,
				"MATERIAL_UPDATE",
				`Material atualizado: ${title}`,
			);
		});
		res.status(201).json(material);
	} catch (error) {
		console.error("Erro ao criar material:", error);
		res.status(500).json({ error: "Erro ao criar material" });
	}
}

/**
 * Notifica o usuário sobre uma resposta ao seu comentário.
 */
async function notifyCommentReply(req, res) {
	const { commentId } = req.params;
	const { content, userId } = req.body;
	try {
		const reply = await prisma.comment.create({
			data: {
				content,
				userId,
				parentId: commentId,
			},
		});
		const originalComment = await prisma.comment.findUnique({
			where: { id: commentId },
			include: { user: true },
		});
		notificationService.createNotification(
			originalComment.user.id,
			"COMMENT_REPLY",
			"Seu comentário foi respondido.",
		);
		res.status(201).json(reply);
	} catch (error) {
		console.error("Erro ao responder comentário:", error);
		res.status(500).json({ error: "Erro ao responder comentário" });
	}
}

/**
 * Notifica o usuário sobre um like recebido em seu comentário.
 */
async function notifyLikeReceived(req, res) {
	const { userId, commentId } = req.body;
	try {
		const like = await prisma.like.create({
			data: {
				userId,
				commentId,
			},
		});
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
			include: { user: true },
		});
		notificationService.createNotification(
			comment.user.id,
			"LIKE_RECEIVED",
			"Seu comentário recebeu um like.",
		);
		res.status(201).json(like);
	} catch (error) {
		console.error("Erro ao registrar like:", error);
		res.status(500).json({ error: "Erro ao registrar like" });
	}
}

/**
 * Marca uma notificação como lida.
 */
async function markAsRead(req, res) {
	const { notificationId } = req.params;
	try {
		const notification =
			await notificationService.markNotificationAsRead(notificationId);
		if (!notification) {
			return res.status(404).json({ error: "Notificação não encontrada" });
		}
		res.status(200).json(notification);
	} catch (error) {
		console.error("Erro ao marcar notificação como lida:", error);
		res.status(500).json({ error: "Erro ao marcar notificação como lida" });
	}
}

/**
 * Obtém todas as notificações não lidas de um usuário.
 */
async function getUnreadNotifications(req, res) {
	const { userId } = req.params;
	try {
		const notifications =
			await notificationService.getUnreadNotifications(userId);
		res.status(200).json(notifications);
	} catch (error) {
		console.error("Erro ao buscar notificações não lidas:", error);
		res.status(500).json({ error: "Erro ao buscar notificações não lidas" });
	}
}

module.exports = {
	notifyNewLesson,
	notifyMaterialUpdate,
	notifyCommentReply,
	notifyLikeReceived,
	markAsRead,
	getUnreadNotifications,
};
