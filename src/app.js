// src/app.js
import cors from "cors";
import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import swaggerSpec from "./swagger";

class App {
	constructor() {
		this.app = express();

		this.middlewares();
		this.swaggerConfig();
		this.routes();
	}

	middlewares() {
		this.app.use(
			cors({
				origin: "*",
				methods: ["GET", "POST", "PUT", "DELETE"],
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		);
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	swaggerConfig() {
		this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	}

	routes() {
		this.app.use(routes);
	}
}

export default new App().app;
