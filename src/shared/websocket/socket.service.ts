import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { coloredLogger } from '../logger/colored.logger';

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      coloredLogger.info(`Cliente conectado: ${socket.id}`);

      // Evento de autenticação
      socket.on('authenticate', (userId: string) => {
        if (userId) {
          socket.join(`user_${userId}`);
          coloredLogger.info(`Usuário ${userId} autenticado no socket ${socket.id}`);
        }
      });

      // Evento de desconexão
      socket.on('disconnect', () => {
        coloredLogger.info(`Cliente desconectado: ${socket.id}`);
      });

      // Outros eventos podem ser adicionados aqui
      socket.on('error', (error) => {
        coloredLogger.error(`Erro no socket ${socket.id}:`, error);
      });
    });
  }

  // Método para enviar notificação para um usuário específico
  public sendNotificationToUser(userId: string, notification: any): void {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }

  // Método para broadcast para todos os clientes conectados
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Getter para acessar a instância do Socket.io
  public getIO(): SocketIOServer {
    return this.io;
  }
}