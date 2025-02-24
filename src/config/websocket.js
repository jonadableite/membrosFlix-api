import { PrismaClient } from "@prisma/client";
// src/config/websocket.js
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/logger.js";

const prisma = new PrismaClient();
const socketLogger = logger.createLogger("WebSocket");

class WebSocketManager {
	static instancia;
	io = null;
	usuariosConectados = new Map();

	constructor() {
		if (WebSocketManager.instancia) {
			// biome-ignore lint/correctness/noConstructorReturn: <explanation>
			return WebSocketManager.instancia;
		}
		WebSocketManager.instancia = this;
	}

	static getInstancia() {
		if (!this.instancia) {
			this.instancia = new WebSocketManager();
		}
		return this.instancia;
	}

	setupWebSocket(server) {
		this.io = new Server(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			},
			pingTimeout: 60000,
			pingInterval: 25000,
		});

		this.io.on("connection", (socket) => {
			socketLogger.log("Novo cliente conectado");

			socket.on("authenticate", (userId) => {
				this.registrarUsuario(userId, socket.id);
				socketLogger.log(`Usuário ${userId} autenticado`);
			});

			socket.on("disconnect", () => {
				this.tratarDesconexao(socket);
			});

			socket.on("atualizarProgresso", async (dados) => {
				try {
					const progressoAtualizado = await this.atualizarProgressoUsuario(dados);
					this.notificarAtualizacaoProgresso(dados.userId, progressoAtualizado);
				} catch (error) {
					socketLogger.error("Erro ao atualizar progresso:", error);
				}
			});

			socket.on("entrarCurso", (cursoId) => {
				socket.join(`curso:${cursoId}`);
			});
		});

		return this.io;
	}

	registrarUsuario(userId, socketId) {
		this.usuariosConectados.set(userId, socketId);
		socketLogger.log(`Usuário ${userId} registrado com socket ${socketId}`);
	}

	tratarDesconexao(socket) {
		for (const [userId, socketConectadoId] of this.usuariosConectados.entries()) {
			if (socketConectadoId === socket.id) {
				socketLogger.log(`Usuário ${userId} desconectado`);
				this.usuariosConectados.delete(userId);
				break;
			}
		}
	}

	async atualizarProgressoUsuario(dados) {
		const { userId, courseId, aulaId, progress } = dados;

		try {
			const progressoAtualizado = await prisma.userProgress.upsert({
				where: {
					userId_courseId: {
						userId,
						courseId
					}
				},
				update: {
					aulaId,
					progressoAula: progress,
					progressoCurso: progress,
					concluido: progress === 100,
					ultimoProgresso: new Date()
				},
				create: {
					userId,
					courseId,
					aulaId,
					progressoAula: progress,
					progressoCurso: progress,
					concluido: progress === 100,
					iniciadoEm: new Date(),
					ultimoProgresso: new Date()
				}
			});

			return progressoAtualizado;
		} catch (error) {
			socketLogger.error("Erro ao atualizar progresso do usuário:", error);
			throw error;
		}
	}

	notificarAtualizacaoProgresso(userId, progressoAtualizado) {
		const socketIdUsuario = this.usuariosConectados.get(userId);

		if (socketIdUsuario && this.io) {
			this.io.to(socketIdUsuario).emit("progressoAtualizado", progressoAtualizado);
		}
	}

	async notificarUsuario(userId, notificacao) {
		const socketIdUsuario = this.usuariosConectados.get(String(userId));

		try {
			// Criar notificação no banco de dados
			const notificacaoSalva = await prisma.notification.create({
				data: {
					id: uuidv4(),
					userId,
					tipo: notificacao.tipo,
					mensagem: notificacao.mensagem,
					dados: notificacao.dados ? JSON.stringify(notificacao.dados) : null,
					lida: false
				}
			});

			socketLogger.log(`Notificação criada para usuário ${userId}`, {
				userId,
				notificacaoId: notificacaoSalva.id
			});

			// Enviar notificação via WebSocket se o usuário estiver conectado
			if (socketIdUsuario && this.io) {
				this.io.to(socketIdUsuario).emit("notificacao", {
					id: notificacaoSalva.id,
					tipo: notificacaoSalva.tipo,
					mensagem: notificacaoSalva.mensagem,
					dados: notificacaoSalva.dados,
					criadoEm: notificacaoSalva.criadoEm
				});

				socketLogger.log(`Notificação enviada para o usuário ${userId}`);
			} else {
				socketLogger.warn(`Usuário ${userId} não conectado. Notificação salva no banco.`);
			}

			return notificacaoSalva;
		} catch (error) {
			socketLogger.error("Erro ao enviar notificação:", error);
			throw error;
		}
	}

	transmitirParaCurso(cursoId, evento, dados) {
		if (this.io) {
			this.io.to(`curso:${cursoId}`).emit(evento, dados);
			socketLogger.log(`Transmitindo evento ${evento} para curso ${cursoId}`);
		}
	}

	getIO() {
		return this.io;
	}
}

const webSocketManager = WebSocketManager.getInstancia();
export default webSocketManager;
