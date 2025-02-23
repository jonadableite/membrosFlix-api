// src/config/websocket.js
import { Server } from "socket.io";
import logger from "../../utils/logger";

// Mapeamento de usuários conectados
const connectedUsers = new Map();
let io; // Variável para armazenar a instância do servidor WebSocket

/**
 * Configura o WebSocket para o servidor HTTP fornecido.
 * @param {http.Server} server - Servidor HTTP.
 * @returns {Server} - Instância do servidor WebSocket.
 */
export function setupWebSocket(server) {
	io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
		},
	});

	io.on("connection", (socket) => {
		const socketLogger = logger.createLogger("WebSocket");
		socketLogger.log("Novo cliente conectado");

		// Autenticação do socket
		socket.on("authenticate", (userId) => {
			connectedUsers.set(userId, socket.id);
			socketLogger.log(`Usuário ${userId} autenticado`);
		});

		// Desconexão
		socket.on("disconnect", () => {
			for (const [userId, socketId] of connectedUsers.entries()) {
				if (socketId === socket.id) {
					socketLogger.log(`Usuário ${userId} desconectado`);
					connectedUsers.delete(userId);
					break;
				}
			}
		});

		// Evento de progresso de curso
		socket.on("updateProgress", async (data) => {
			try {
				const { userId, courseId, aulaId, progress } = data;
				const updatedProgress = await updateUserProgress(
					userId,
					courseId,
					aulaId,
					progress,
				);

				// Emitir notificação para o usuário
				const userSocketId = connectedUsers.get(userId);
				if (userSocketId) {
					io.to(userSocketId).emit("progressUpdated", updatedProgress);
				}
			} catch (error) {
				socketLogger.error("Erro ao atualizar progresso:", error);
			}
		});
	});

	return io;
}

// Função para emitir notificações
export function notifyUser(userId, notification) {
	const socketLogger = logger.createLogger("WebSocket");

	setTimeout(() => {
		const userSocketId = connectedUsers.get(String(userId));
		if (userSocketId && io) {
			socketLogger.log(`Enviando notificação para o usuário ${userId}`, {
				userId,
				notification
			}, {
				context: 'WebSocket Notification',
				file: 'websocket.js'
			});

			io.to(userSocketId).emit("notification", notification);
		} else {
			socketLogger.error(
				`Não foi possível enviar notificação para o usuário ${userId}`,
				{
					userId,
					userSocketId: userSocketId || 'não encontrado',
					ioInitialized: !!io
				},
				{
					context: 'WebSocket Notification Error',
					file: 'websocket.js'
				}
			);
		}
	}, 2000); // Atraso de 2 segundos
}
