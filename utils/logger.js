// src/utils/logger.js
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');

// Função para ler o package.json de forma segura
const getPackageVersion = () => {
	try {
		const packageJsonPath = path.resolve(__dirname, "../package.json");
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		return packageJson.version || "0.0.0";
	} catch (error) {
		console.error("Erro ao ler package.json:", error);
		return "0.0.0";
	}
};

// Definição de cores ANSI
const Color = {
	RESET: "\x1b[0m",
	BRIGHT: "\x1b[1m",

	// Cores de texto
	LOG_TEXT: "\x1b[32m",
	INFO_TEXT: "\x1b[34m",
	WARN_TEXT: "\x1b[33m",
	ERROR_TEXT: "\x1b[31m",
	DEBUG_TEXT: "\x1b[36m",
	VERBOSE_TEXT: "\x1b[37m",
	GOLD_TEXT: "\x1b[33m",
	SUCCESS_TEXT: "\x1b[32m",

	// Cores de fundo
	LOG_BG: "\x1b[42m",
	INFO_BG: "\x1b[44m",
	WARN_BG: "\x1b[43m",
	ERROR_BG: "\x1b[41m",
	DEBUG_BG: "\x1b[46m",
	VERBOSE_BG: "\x1b[47m",
	SUCCESS_BG: "\x1b[42m",
};

const LogEmoji = {
	LOG: "📝",
	INFO: "ℹ️",
	WARN: "⚠️",
	ERROR: "❌",
	DEBUG: "🔍",
	VERBOSE: "📢",
	SUCCESS: "✅",
};

const Type = {
	LOG: "LOG",
	WARN: "WARN",
	INFO: "INFO",
	ERROR: "ERROR",
	DEBUG: "DEBUG",
	VERBOSE: "VERBOSE",
	SUCCESS: "SUCCESS",
};

class Logger {
	constructor(context = "Logger", options = {}) {
		this.context = context;
		this.version = getPackageVersion();
		this.isDebugEnabled = process.env.DEBUG === "true";
	}

	setContext(value) {
		return new Logger(value);
	}

	sanitizeLogData(data) {
		if (typeof data !== "object" || data === null) return data;

		const sensitiveKeys = [
			"password", "token", "secret", "apiKey",
			"credentials", "Authorization", "accessToken", "refreshToken"
		];

		const sanitizedData = { ...data };

		sensitiveKeys.forEach((key) => {
			if (sanitizedData.hasOwnProperty(key)) {
				sanitizedData[key] = "***REDACTED***";
			}
		});

		return sanitizedData;
	}

	getColorConfig(type) {
		const colorMap = {
			[Type.LOG]: {
				text: Color.LOG_TEXT,
				bg: Color.LOG_BG,
				bright: Color.BRIGHT,
			},
			[Type.INFO]: {
				text: Color.INFO_TEXT,
				bg: Color.INFO_BG,
				bright: Color.BRIGHT,
			},
			[Type.WARN]: {
				text: Color.WARN_TEXT,
				bg: Color.WARN_BG,
				bright: Color.BRIGHT,
			},
			[Type.ERROR]: {
				text: Color.ERROR_TEXT,
				bg: Color.ERROR_BG,
				bright: Color.BRIGHT,
			},
			[Type.DEBUG]: {
				text: Color.DEBUG_TEXT,
				bg: Color.DEBUG_BG,
				bright: Color.BRIGHT,
			},
			[Type.VERBOSE]: {
				text: Color.VERBOSE_TEXT,
				bg: Color.VERBOSE_BG,
				bright: Color.BRIGHT,
			},
			[Type.SUCCESS]: {
				text: Color.SUCCESS_TEXT,
				bg: Color.SUCCESS_BG,
				bright: Color.BRIGHT,
			},
		};

		return colorMap[type] || colorMap[Type.LOG];
	}

	formatMessage(type, message, typeValue, additionalContext = {}) {
		const timestamp = dayjs().format("ddd MMM DD YYYY HH:mm:ss");
		const pid = process.pid.toString();
		const colors = this.getColorConfig(type);
		const emoji = LogEmoji[type];

		const getCallerInfo = () => {
			const originalPrepareStackTrace = Error.prepareStackTrace;
			Error.prepareStackTrace = (_, stack) => stack;

			const error = new Error();
			const stack = error.stack;
			Error.prepareStackTrace = originalPrepareStackTrace;

			for (let i = 0; i < stack.length; i++) {
				const filename = stack[i].getFileName();
				if (filename && !filename.includes('logger.js')) {
					const fullPath = filename;
					const pathParts = fullPath.split(/[/\\]/);
					const fileName = pathParts[pathParts.length - 1];
					const lineNumber = stack[i].getLineNumber();
					return `${fileName}:${lineNumber}`;
				}
			}

			return "[unknown]";
		};

		const typeValuePart = typeValue || getCallerInfo();
		const messageStr = this.serializeMessage(message);

		// Adiciona contexto adicional se fornecido
		const contextStr = additionalContext.context
			? `[${additionalContext.context}]`
			: '';

		return [
			colors.text + Color.BRIGHT,
			`[MembrosFelix API]`,
			`v${this.version}`,
			pid,
			`-`,
			timestamp,
			` ${colors.bg}${colors.bright} ${emoji} ${type} ${Color.RESET}`,
			Color.GOLD_TEXT + Color.BRIGHT,
			`[${this.context}]`,
			Color.RESET,
			`${colors.text}`,
			`[${typeValuePart}]`,
			contextStr,
			Color.RESET,
			`${colors.text}${messageStr}${Color.RESET}`,
		].join(" ");
	}


	serializeMessage(message) {
		if (message === null || message === undefined) return "null";

		if (typeof message === "object") {
			try {
				const sanitizedMessage = this.sanitizeLogData(message);
				return JSON.stringify(sanitizedMessage, null, 2);
			} catch (error) {
				return `Erro ao serializar: ${String(error)}`;
			}
		}

		return String(message);
	}

	addTraceContext(message) {
		const traceId = process.env.TRACE_ID;
		return traceId ? `[TraceID: ${traceId}] ${message}` : message;
	}

	logMessage(type, message, typeValue, additionalContext = {}) {
		if (type === Type.DEBUG && !this.isDebugEnabled) return;

		const tracedMessage = this.addTraceContext(message);
		const formattedMessage = this.formatMessage(
			type,
			tracedMessage,
			typeValue,
			additionalContext
		);

		if (process.env.ENABLECOLOREDLOGS === "true") {
			const colors = this.getColorConfig(type);
			console.log(`${colors.text}${formattedMessage}${Color.RESET}`);
		} else {
			console.log(formattedMessage);
		}
	}

	success(message, context) {
		let logContext;

		if (typeof context === "string") {
			logContext = { value: context };
		} else if (context !== undefined) {
			logContext = Object.entries(context)
				.filter(([_, value]) => value !== undefined)
				.reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: this.sanitizeLogData(value),
					}),
					{}
				);
		}

		const fullMessage = logContext
			? `${message} - ${JSON.stringify(logContext, null, 2)}`
			: message;

		this.logMessage(Type.SUCCESS, fullMessage);
	}

	log(message, context, additionalContext = {}) {
		let logContext;

		if (typeof context === "string") {
			logContext = { value: context };
		} else if (context !== undefined) {
			logContext = Object.entries(context)
				.filter(([_, value]) => value !== undefined)
				.reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: this.sanitizeLogData(value),
					}),
					{}
				);
		}

		const fullMessage = logContext
			? `${message} - ${JSON.stringify(logContext, null, 2)}`
			: message;

		this.logMessage(Type.LOG, fullMessage, undefined, additionalContext);
	}

	info(message, context) {
		let logContext;

		if (typeof context === "string") {
			logContext = { value: context };
		} else if (context !== undefined) {
			logContext = Object.entries(context)
				.filter(([_, value]) => value !== undefined)
				.reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: this.sanitizeLogData(value),
					}),
					{}
				);
		}

		const fullMessage = logContext
			? `${message} - ${JSON.stringify(logContext, null, 2)}`
			: message;

		this.logMessage(Type.INFO, fullMessage);
	}

	warn(message, context) {
		let logContext;

		if (typeof context === "string") {
			logContext = { value: context };
		} else if (context !== undefined) {
			logContext = Object.entries(context)
				.filter(([_, value]) => value !== undefined)
				.reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: this.sanitizeLogData(value),
					}),
					{}
				);
		}

		const fullMessage = logContext
			? `${message} - ${JSON.stringify(logContext, null, 2)}`
			: message;

		this.logMessage(Type.WARN, fullMessage);
	}

	error(message, error, additionalContext) {
		const errorContext =
			error instanceof Error
				? {
					message: error.message,
					name: error.name,
					stack: error.stack,
				}
				: error;

		const fullMessage = errorContext
			? `${message} - ${this.serializeMessage(errorContext)}`
			: message;

		this.logMessage(Type.ERROR, fullMessage);

		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}

		if (additionalContext) {
			console.error("Additional Context:", additionalContext);
		}
	}

	verbose(message) {
		this.logMessage(Type.VERBOSE, message);
	}

	debug(message) {
		this.logMessage(Type.DEBUG, message);
	}

	createLogger(context) {
		return new Logger(context);
	}
}

// Exportar uma instância padrão
const logger = new Logger();
module.exports = logger;
