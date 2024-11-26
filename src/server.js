import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import logger from "../utils/logger";
import app from "./app";
import swaggerSpec from "./swagger";

const PORT = process.env.PORT || 3001;

// Configuração do Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

try {
	app.listen(PORT, () => {
		logger.info(`🚀 Server ON, rodando na porta: ${PORT}...`); // Log após o servidor iniciar
	});
} catch (error) {
	logger.error("Erro ao iniciar o servidor:", error); // Log de erro
	process.exit(1);
}
