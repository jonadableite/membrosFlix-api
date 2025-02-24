// src/server.js
import "dotenv/config";
import http from "http";
import swaggerUi from "swagger-ui-express";
import logger from "../utils/logger.js";
import app from "./app/index.js";
import webSocketManager from "./config/websocket.js";
import swaggerSpec from "./swagger.js";

// Configuração de tratamento de erros não capturados
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Criação do servidor HTTP
const server = http.createServer(app);

// Configuração do WebSocket
webSocketManager.setupWebSocket(server); // Alterado aqui

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';


// Configuração do Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Função para iniciar o servidor
const startServer = async () => {
	try {
		// Adicione aqui qualquer configuração inicial necessária
		// Por exemplo, conexão com banco de dados, verificação de variáveis de ambiente, etc.

		server.listen(PORT, HOST, () => {
			logger.info(`🚀 Server ON, rodando em ${HOST}:${PORT}...`);

			// Log de ambiente
			logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
		});

		// Tratamento de fechamento gracioso do servidor
		process.on('SIGTERM', gracefulShutdown);
		process.on('SIGINT', gracefulShutdown);
	} catch (error) {
		logger.error("Erro crítico ao iniciar o servidor:", error);
		process.exit(1);
	}
};

// Função de desligamento gracioso
const gracefulShutdown = () => {
	logger.info('Recebendo sinal de desligamento. Fechando servidor...');

	server.close(() => {
		logger.info('Servidor HTTP fechado.');

		// Fechar conexões do WebSocket
		const io = webSocketManager.getIO();
		if (io) {
			io.close(() => {
				logger.info('Conexões WebSocket fechadas.');
				process.exit(0);
			});
		} else {
			process.exit(0);
		}
	});

	setTimeout(() => {
		logger.error('Não foi possível fechar as conexões a tempo. Encerrando forcadamente.');
		process.exit(1);
	}, 10000);
};

// Iniciar o servidor
startServer();

// Exporta o servidor para possíveis importações em testes
export default server;
