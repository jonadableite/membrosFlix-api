// utils/logger.js
import winston from "winston";

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "debug", // Defina o nível para 'debug' em desenvolvimento
	format: winston.format.combine(
		winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Formato de timestamp mais legível
		winston.format.printf(
			(info) => `${info.timestamp} ${info.level}: ${info.message}`,
		), // Formato customizado da mensagem
	),
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.printf(
					(info) => `${info.timestamp} ${info.level}: ${info.message}`,
				),
			),
		}),
		new winston.transports.File({ filename: "error.log", level: "error" }),
	],
});

export default logger;
