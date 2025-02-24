// src/app/controllers/NotificationController.js
import { PrismaClient } from "@prisma/client";
import logger from "../../../utils/logger";

const prisma = new PrismaClient();
const notificacoesLogger = logger.createLogger("NotificationController");

class NotificationController {
	async criarNotificacaoBemVindo(req, res) {
		const { userId } = req.body;
		try {
			const notificacao = await prisma.notification.create({
				data: {
					userId,
					tipo: "BOAS_VINDAS",
					mensagem: "Bem-vindo à plataforma! Comece sua jornada de aprendizado.",
					lida: false,
					dados: null
				}
			});

			notificacoesLogger.info("Notificação de boas-vindas criada", { userId });
			return res.status(201).json(notificacao);
		} catch (error) {
			notificacoesLogger.error("Erro ao criar notificação de boas-vindas:", error);
			return res.status(500).json({ error: "Erro ao criar notificação de boas-vindas" });
		}
	}

	async notificarNovaAula(req, res) {
		const { title, description, instructorId } = req.body;
		try {
			const aula = await prisma.aula.create({
				data: {
					name: title,
					description,
					instructorId,
				},
			});

			const usuarios = await prisma.user.findMany();

			await prisma.notification.createMany({
				data: usuarios.map(usuario => ({
					userId: usuario.id,
					tipo: "NOVA_AULA",
					mensagem: `Nova aula publicada: ${title}`,
					dados: JSON.stringify({ aulaId: aula.id })
				}))
			});

			notificacoesLogger.info("Notificações de nova aula criadas", { aulaId: aula.id });
			return res.status(201).json(aula);
		} catch (error) {
			notificacoesLogger.error("Erro ao criar aula:", error);
			return res.status(500).json({ error: "Erro ao criar aula" });
		}
	}

	async notificarAtualizacaoMaterial(req, res) {
		const { title, url, aulaId } = req.body;
		try {
			const material = await prisma.material.create({
				data: { title, url, aulaId }
			});

			const progressos = await prisma.userProgress.findMany({
				where: { aulaId },
				include: { user: true }
			});

			await prisma.notification.createMany({
				data: progressos.map(({ user }) => ({
					userId: user.id,
					tipo: "MATERIAL_UPDATE",
					mensagem: `Material atualizado: ${title}`,
					dados: JSON.stringify({ materialId: material.id, aulaId })
				}))
			});

			return res.status(201).json(material);
		} catch (error) {
			notificacoesLogger.error("Erro ao criar material:", error);
			return res.status(500).json({ error: "Erro ao criar material" });
		}
	}

	async marcarComoLida(req, res) {
		const { id } = req.params;
		try {
			const notificacao = await prisma.notification.update({
				where: { id },
				data: { lida: true }
			});

			if (!notificacao) {
				return res.status(404).json({ error: "Notificação não encontrada" });
			}

			return res.status(200).json(notificacao);
		} catch (error) {
			notificacoesLogger.error("Erro ao marcar notificação como lida:", error);
			return res.status(500).json({ error: "Erro ao marcar notificação como lida" });
		}
	}

	async marcarTodasComoLidas(req, res) {
		const { userId } = req.params;
		try {
			await prisma.notification.updateMany({
				where: {
					userId,
					lida: false
				},
				data: { lida: true }
			});

			return res.status(200).json({
				message: "Todas as notificações foram marcadas como lidas"
			});
		} catch (error) {
			notificacoesLogger.error("Erro ao marcar todas notificações como lidas:", error);
			return res.status(500).json({ error: "Erro ao marcar notificações como lidas" });
		}
	}

	async buscarNotificacoesNaoLidas(req, res) {
		const { userId } = req.params;
		try {
			const notificacoes = await prisma.notification.findMany({
				where: {
					userId,
					lida: false,
				},
				orderBy: {
					criadoEm: 'desc'
				},
				select: {
					id: true,
					tipo: true,
					mensagem: true,
					dados: true,
					criadoEm: true,
				},
			});

			return res.status(200).json(notificacoes);
		} catch (error) {
			notificacoesLogger.error("Erro ao buscar notificações não lidas:", error);
			return res.status(500).json({
				error: "Erro ao buscar notificações não lidas",
				message: error.message,
			});
		}
	}
}

export default new NotificationController();
