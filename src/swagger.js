import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// src/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerDefinition = {
	openapi: "3.0.0",
	info: {
		title: "API Documentation",
		version: "1.0.0",
		description: "Documentação da API",
	},
	servers: [
		{
			url: "http://localhost:3007",
		},
	],
	components: {
		// Adicione a configuração de segurança aqui
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
	security: [{ bearerAuth: [] }], // Aplicar a segurança globalmente
	// ... (restante da sua configuração)
};

const options = {
	swaggerDefinition,
	apis: [
		resolve(__dirname, 'routes.js'),
		resolve(__dirname, 'app/controllers/*.js')
	], // Caminhos absolutos para seus controllers
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
