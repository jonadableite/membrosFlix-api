// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
	openapi: "3.0.0",
	info: {
		title: "API Documentation",
		version: "1.0.0",
		description: "Documentação da API",
	},
	servers: [
		{
			url: "http://localhost:3001", // Sua URL base
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
	apis: ["./src/routes.js", "./src/app/controllers/*.js"], // Caminhos para seus controllers
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
