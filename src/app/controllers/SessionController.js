// src/app/controllers/SessionController.js
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import logger from "../../../utils/logger";
import webSocketManager from "../../config/websocket";
import * as sessionService from "../services/sessionService";

const prisma = new PrismaClient();
const sessionLogger = logger.createLogger("SessionController");

class SessionController {
	async store(req, res) {
		const schema = Yup.object().shape({
			email: Yup.string().email().required("E-mail é obrigatório"),
			password: Yup.string().required("Senha é obrigatória"),
		});

		try {
			// Validação dos dados de entrada
			await schema.validate(req.body, { abortEarly: false });

			const { email, password } = req.body;

			// Autentica o usuário usando o serviço
			const user = await sessionService.authenticateUser(email, password);

			if (!user) {
				return res.status(401).json({ error: "Usuário não encontrado" });
			}

			// Gera o token JWT
			const token = sessionService.generateToken(user);
			const { id, name, role, status, email: userEmail } = user;

			try {
				// Criar notificação de boas-vindas no banco
				const notificacao = await prisma.notification.create({
					data: {
						id: uuidv4(),
						userId: id,
						tipo: "BOAS_VINDAS",
						mensagem: `Bem-vindo novamente, ${name}! Bons estudos!`,
						lida: false,
						dados: JSON.stringify({
							tipoNotificacao: 'LOGIN',
							timestamp: new Date().toISOString()
						}),
						criadoEm: new Date()
					}
				});

				// Enviar notificação via WebSocket
				await webSocketManager.notificarUsuario(id, {
					id: notificacao.id,
					tipo: notificacao.tipo,
					mensagem: notificacao.mensagem,
					criadoEm: notificacao.criadoEm,
					lida: notificacao.lida,
					dados: JSON.parse(notificacao.dados || '{}')
				});

				sessionLogger.info(`Notificação de boas-vindas criada para usuário ${id}`);
			} catch (notificationError) {
				sessionLogger.error("Erro ao criar notificação de boas-vindas:", {
					error: notificationError,
					userId: id
				});
				// Não impede o login se a notificação falhar
			}

			// Registrar último acesso
			try {
				await prisma.user.update({
					where: { id },
					data: {
						ultimoAcesso: new Date(),
						status: true // Marcar usuário como ativo
					}
				});
			} catch (updateError) {
				sessionLogger.error("Erro ao atualizar último acesso:", {
					error: updateError,
					userId: id
				});
			}

			// Retorna a resposta de sucesso
			return res.json({
				user: {
					id,
					name,
					email: userEmail,
					role,
					status,
					ultimoAcesso: new Date()
				},
				token,
			});

		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({
					error: "Erro de validação",
					errors: error.errors
				});
			}

			if (
				error.message === "Usuário não encontrado" ||
				error.message === "Senha incorreta"
			) {
				return res.status(401).json({ error: error.message });
			}

			sessionLogger.error("Erro na autenticação:", {
				error,
				email: req.body.email
			});

			return res.status(500).json({
				error: "Erro interno do servidor",
				message: "Não foi possível realizar o login. Tente novamente mais tarde."
			});
		}
	}

	async refreshToken(req, res) {
		try {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				return res.status(400).json({ error: "Refresh token não fornecido" });
			}

			const newToken = await sessionService.refreshToken(refreshToken);

			return res.json({ token: newToken });
		} catch (error) {
			sessionLogger.error("Erro ao renovar token:", error);

			if (error.message === "Token inválido") {
				return res.status(401).json({ error: "Token inválido ou expirado" });
			}

			return res.status(500).json({
				error: "Erro ao renovar token",
				message: "Não foi possível renovar o token de acesso"
			});
		}
	}

	async logout(req, res) {
		try {
			const { userId } = req;

			if (!userId) {
				return res.status(400).json({ error: "ID de usuário não fornecido" });
			}

			// Desconectar WebSocket
			webSocketManager.tratarDesconexao({ id: userId });

			// Limpar sessão no banco se necessário
			await sessionService.invalidateSession(userId);

			// Atualizar status do usuário
			await prisma.user.update({
				where: { id: userId },
				data: { status: false }
			});

			return res.status(204).send();
		} catch (error) {
			sessionLogger.error("Erro ao realizar logout:", {
				error,
				userId: req.userId
			});
			return res.status(500).json({
				error: "Erro ao realizar logout",
				message: "Não foi possível encerrar a sessão"
			});
		}
	}
}

export default new SessionController();
