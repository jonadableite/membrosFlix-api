// src/server.js
import "dotenv/config";
import http from "http";
import swaggerUi from "swagger-ui-express";
import logger from "../utils/logger";
import app from "./app";
import { setupWebSocket } from "./config/websocket";
import swaggerSpec from "./swagger";

const server = http.createServer(app);
setupWebSocket(server); // Configura o WebSocket com o servidor HTTP

const PORT = process.env.PORT || 3001;

// Configuração do Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

try {
	server.listen(PORT, () => {
		logger.info(`🚀 Server ON, rodando na porta: ${PORT}...`);
	});
} catch (error) {
	logger.error("Erro ao iniciar o servidor:", error);
	process.exit(1);
}
