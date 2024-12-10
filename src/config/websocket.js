import { Server } from "socket.io";

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
			origin: "http://localhost:5173", // Defina a origem como o endereço do frontend
			methods: ["GET", "POST"],
		},
	});

	io.on("connection", (socket) => {
		console.log("Novo cliente conectado");

		// Autenticação do socket
		socket.on("authenticate", (userId) => {
			connectedUsers.set(userId, socket.id);
			console.log(`Usuário ${userId} autenticado`);
		});

		// Desconexão
		socket.on("disconnect", () => {
			for (const [userId, socketId] of connectedUsers.entries()) {
				if (socketId === socket.id) {
					connectedUsers.delete(userId);
					console.log(`Usuário ${userId} desconectado`);
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
				console.error("Erro ao atualizar progresso:", error);
			}
		});
	});

	return io;
}

// Função para emitir notificações
export function notifyUser(userId, notification) {
	setTimeout(() => {
		const userSocketId = connectedUsers.get(String(userId));
		if (userSocketId && io) {
			console.log(`Enviando notificação para o usuário ${userId}`);
			io.to(userSocketId).emit("notification", notification);
		} else {
			console.error(
				`Não foi possível enviar notificação para o usuário ${userId}`,
			);
			if (!userSocketId) {
				console.error(`Socket ID não encontrado para o usuário ${userId}`);
			}
			if (!io) {
				console.error("Instância do servidor WebSocket não inicializada");
			}
		}
	}, 2000); // Atraso de 2 segundo
}
