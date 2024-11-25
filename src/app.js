import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import "./database";
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
		this.app.use(cors());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	swaggerConfig() {
		this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	}

	routes() {
		this.app.use(routes); // Remove o authMiddleware daqui
	}
}

export default new App().app;
