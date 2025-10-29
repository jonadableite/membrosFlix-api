import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "@/config/env";
import { getCorrelationId } from "@/shared/middlewares/correlation.middleware";

// Cores ANSI aprimoradas para diferentes níveis
const colors = {
  // Cores principais
  error: "\x1b[38;5;196m", // Vermelho vibrante
  warn: "\x1b[38;5;214m", // Laranja vibrante
  info: "\x1b[38;5;51m", // Ciano brilhante
  http: "\x1b[38;5;201m", // Magenta vibrante
  debug: "\x1b[38;5;244m", // Cinza médio
  success: "\x1b[38;5;46m", // Verde brilhante

  // Cores customizadas
  start: "\x1b[38;5;46m", // Verde brilhante
  stop: "\x1b[38;5;196m", // Vermelho vibrante
  database: "\x1b[38;5;33m", // Azul
  redis: "\x1b[38;5;196m", // Vermelho
  auth: "\x1b[38;5;208m", // Laranja
  security: "\x1b[38;5;196m", // Vermelho
  performance: "\x1b[38;5;226m", // Amarelo brilhante
  notification: "\x1b[38;5;51m", // Ciano brilhante
  email: "\x1b[38;5;33m", // Azul
  websocket: "\x1b[38;5;201m", // Magenta

  // Cores de formatação
  reset: "\x1b[0m", // Reset
  bold: "\x1b[1m", // Negrito
  dim: "\x1b[2m", // Dim
  underline: "\x1b[4m", // Sublinhado
  italic: "\x1b[3m", // Itálico
  strikethrough: "\x1b[9m", // Riscado

  // Cores de fundo
  bgError: "\x1b[48;5;196m", // Fundo vermelho
  bgWarn: "\x1b[48;5;214m", // Fundo laranja
  bgInfo: "\x1b[48;5;51m", // Fundo ciano
  bgSuccess: "\x1b[48;5;46m", // Fundo verde

  // Cores especiais
  timestamp: "\x1b[38;5;244m", // Cinza para timestamp
  service: "\x1b[38;5;33m", // Azul para service
  correlation: "\x1b[38;5;208m", // Laranja para correlation ID
  tenant: "\x1b[38;5;201m", // Magenta para tenant
  user: "\x1b[38;5;46m", // Verde para user
  meta: "\x1b[38;5;244m", // Cinza para metadata
  separator: "\x1b[38;5;240m", // Cinza escuro para separadores
};

// Emojis aprimorados para diferentes níveis
const emojis = {
  error: "💥",
  warn: "⚠️ ",
  info: "ℹ️ ",
  http: "🌐",
  debug: "🔍",
  success: "✨",
  start: "🚀",
  stop: "🛑",
  database: "🗄️ ",
  redis: "🔴",
  auth: "🔐",
  security: "🛡️ ",
  performance: "⚡",
  notification: "📢",
  email: "📧",
  websocket: "🔌",
};

// Formato aprimorado para desenvolvimento com cores vibrantes
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const correlationId = getCorrelationId();
    const color = colors[level as keyof typeof colors] || colors.info;
    const emoji = emojis[level as keyof typeof emojis] || "📝";

    // Linha principal com cores vibrantes
    let log = `${colors.timestamp}${colors.bold}${timestamp}${colors.reset} `;

    // Nível com cor de fundo e emoji
    const bgColor =
      level === "error"
        ? colors.bgError
        : level === "warn"
          ? colors.bgWarn
          : level === "success"
            ? colors.bgSuccess
            : level === "info"
              ? colors.bgInfo
              : "";

    log += `${bgColor}${colors.bold} ${emoji} ${level.toUpperCase()} ${colors.reset} `;

    // Service name com cor especial
    if (service) {
      log += `${colors.separator}│${colors.reset} ${colors.service}${colors.bold}${service}${colors.reset}`;
    }

    // Correlation ID com destaque
    if (correlationId) {
      log += ` ${colors.separator}│${colors.reset} ${colors.correlation}${colors.underline}${correlationId}${colors.reset}`;
    }

    // Tenant ID com cor especial
    if (meta.tenantId) {
      log += ` ${colors.separator}│${colors.reset} ${colors.tenant}tenant:${meta.tenantId}${colors.reset}`;
    }

    // User ID com cor especial
    if (meta.userId) {
      log += ` ${colors.separator}│${colors.reset} ${colors.user}user:${meta.userId}${colors.reset}`;
    }

    // Message com cor baseada no nível
    log += `\n${color}${colors.bold}${message}${colors.reset}`;

    // Additional metadata com formatação aprimorada
    const filteredMeta = { ...meta };
    delete filteredMeta.tenantId;
    delete filteredMeta.userId;

    if (Object.keys(filteredMeta).length > 0) {
      log += `\n${colors.meta}${colors.dim}└─ ${JSON.stringify(filteredMeta, null, 2).replace(/\n/g, "\n    ")}${colors.reset}`;
    }

    // Separador visual entre logs
    log += `\n${colors.separator}${"─".repeat(80)}${colors.reset}`;

    return log;
  })
);

// Formato para produção (JSON estruturado)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Logger principal
const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  format: env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  defaultMeta: {
    service: "membrosflix-api",
    version: process.env.npm_package_version || "1.0.0",
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

// Adicionar logging de arquivo em produção
if (env.NODE_ENV === "production") {
  logger.add(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
      format: productionFormat,
    })
  );

  logger.add(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: productionFormat,
    })
  );
}

// Métodos customizados para diferentes tipos de log
export const coloredLogger = {
  // Herdar todos os métodos do Winston logger
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  silly: logger.silly.bind(logger),
  http: logger.http.bind(logger),

  // Log de sucesso
  success: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "success" });
  },

  // Log de início de aplicação
  start: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "start" });
  },

  // Log de parada de aplicação
  stop: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "stop" });
  },

  // Log de banco de dados
  database: (message: string, meta?: any) => {
    logger.debug(message, { ...meta, level: "database" });
  },

  // Log de Redis
  redis: (message: string, meta?: any) => {
    logger.debug(message, { ...meta, level: "redis" });
  },

  // Log de autenticação
  auth: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "auth" });
  },

  // Log de segurança
  security: (message: string, meta?: any) => {
    logger.warn(message, { ...meta, level: "security" });
  },

  // Log de performance
  performance: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "performance" });
  },

  // Log de notificação
  notification: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "notification" });
  },

  // Log de email
  email: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "email" });
  },

  // Log de WebSocket
  websocket: (message: string, meta?: any) => {
    logger.info(message, { ...meta, level: "websocket" });
  },

  // Log de performance com destaque especial
  logPerformance: (operation: string, duration: number, meta?: any) => {
    const durationColor =
      duration > 5000
        ? colors.error
        : duration > 2000
          ? colors.warn
          : duration > 1000
            ? colors.performance
            : colors.success;

    logger.info(
      `${colors.performance}⚡ PERFORMANCE${colors.reset} ${operation}`,
      {
        ...meta,
        level: "performance",
        duration: `${durationColor}${duration}ms${colors.reset}`,
        status:
          duration > 5000 ? "SLOW" : duration > 2000 ? "MODERATE" : "FAST",
      }
    );
  },

  // Log de database com cores especiais
  logDatabase: (operation: string, table: string, meta?: any) => {
    logger.debug(`${colors.database}🗄️  DATABASE${colors.reset} ${operation}`, {
      ...meta,
      level: "database",
      table: `${colors.database}${table}${colors.reset}`,
      operation: `${colors.bold}${operation}${colors.reset}`,
    });
  },

  // Log de cache com cores especiais
  logCache: (operation: string, key: string, meta?: any) => {
    logger.debug(`${colors.redis}🔴 CACHE${colors.reset} ${operation}`, {
      ...meta,
      level: "redis",
      key: `${colors.redis}${key}${colors.reset}`,
      operation: `${colors.bold}${operation}${colors.reset}`,
    });
  },

  // Log de segurança com destaque especial
  logSecurity: (
    event: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    meta?: any
  ) => {
    const severityColor =
      severity === "CRITICAL"
        ? colors.bgError
        : severity === "HIGH"
          ? colors.error
          : severity === "MEDIUM"
            ? colors.warn
            : colors.info;

    logger.warn(`${colors.security}🛡️  SECURITY${colors.reset} ${event}`, {
      ...meta,
      level: "security",
      severity: `${severityColor}${severity}${colors.reset}`,
      event: `${colors.bold}${event}${colors.reset}`,
    });
  },

  // Log de notificação com cores especiais
  logNotification: (type: string, recipient: string, meta?: any) => {
    logger.info(
      `${colors.notification}📢 NOTIFICATION${colors.reset} ${type}`,
      {
        ...meta,
        level: "notification",
        type: `${colors.notification}${type}${colors.reset}`,
        recipient: `${colors.user}${recipient}${colors.reset}`,
      }
    );
  },

  // Log de erro com stack trace colorido
  logError: (message: string, error: Error, meta?: any) => {
    logger.error(`${colors.error}💥 ERROR${colors.reset} ${message}`, {
      ...meta,
      level: "error",
      error: {
        name: `${colors.error}${error.name}${colors.reset}`,
        message: `${colors.error}${error.message}${colors.reset}`,
        stack: error.stack
          ? `${colors.meta}${error.stack}${colors.reset}`
          : undefined,
      },
    });
  },

  // Log de sucesso com destaque especial
  logSuccess: (message: string, meta?: any) => {
    logger.info(`${colors.success}✨ SUCCESS${colors.reset} ${message}`, {
      ...meta,
      level: "success",
    });
  },

  // Log de início de operação
  logStart: (operation: string, meta?: any) => {
    logger.info(`${colors.start}🚀 START${colors.reset} ${operation}`, {
      ...meta,
      level: "start",
    });
  },

  // Log de fim de operação
  logEnd: (operation: string, duration?: number, meta?: any) => {
    const durationText = duration ? ` (${duration}ms)` : "";
    logger.info(
      `${colors.stop}🛑 END${colors.reset} ${operation}${durationText}`,
      {
        ...meta,
        level: "stop",
        duration,
      }
    );
  },

  // Log HTTP especializado com cores vibrantes
  logHttp: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: any
  ) => {
    const statusColor =
      statusCode >= 200 && statusCode < 300
        ? colors.success
        : statusCode >= 300 && statusCode < 400
          ? colors.warn
          : statusCode >= 400
            ? colors.error
            : colors.info;

    const methodColor =
      method === "GET"
        ? colors.info
        : method === "POST"
          ? colors.success
          : method === "PUT"
            ? colors.warn
            : method === "DELETE"
              ? colors.error
              : colors.debug;

    const durationColor =
      duration > 5000
        ? colors.error
        : duration > 2000
          ? colors.warn
          : duration > 1000
            ? colors.performance
            : colors.success;

    logger.info(
      `${methodColor}${method}${colors.reset} ${url} ${statusColor}${statusCode}${colors.reset} ${durationColor}${duration}ms${colors.reset}`,
      {
        ...meta,
        level: "http",
        method,
        url,
        statusCode,
        duration,
        status:
          statusCode >= 200 && statusCode < 300
            ? "SUCCESS"
            : statusCode >= 300 && statusCode < 400
              ? "REDIRECT"
              : statusCode >= 400
                ? "ERROR"
                : "UNKNOWN",
      }
    );
  },
};

// Stream aprimorado para Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    // Parse da mensagem do Morgan para extrair informações
    const parts = message.trim().split(" ");
    if (parts.length >= 6) {
      const method = parts[0];
      const url = parts[1];
      const statusCode = parts[2];
      const responseTime = parts[3];
      const ip = parts[4];
      const userAgent = parts.slice(5).join(" ");

      // Verificar se statusCode existe antes de usar
      if (!statusCode) {
        return;
      }

      // Cores baseadas no status code
      const statusColor = statusCode.startsWith("2")
        ? colors.success
        : statusCode.startsWith("3")
          ? colors.warn
          : statusCode.startsWith("4")
            ? colors.error
            : statusCode.startsWith("5")
              ? colors.error
              : colors.info;

      const methodColor =
        method === "GET"
          ? colors.info
          : method === "POST"
            ? colors.success
            : method === "PUT"
              ? colors.warn
              : method === "DELETE"
                ? colors.error
                : colors.debug;

      coloredLogger.http(
        `${methodColor}${method}${colors.reset} ${url} ${statusColor}${statusCode}${colors.reset} ${responseTime}ms`,
        {
          method,
          url,
          statusCode: parseInt(statusCode || "0"),
          responseTime: parseInt(responseTime || "0"),
          ip,
          userAgent: userAgent.substring(1, userAgent.length - 1), // Remove aspas
          level: "http",
        }
      );
    } else {
      coloredLogger.http(message.trim());
    }
  },
};

// Middleware de logging HTTP personalizado com cores vibrantes
export const httpLoggerMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const correlationId = getCorrelationId();

  // Log da requisição com cores
  coloredLogger.logStart(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    correlationId,
    tenantId: req.tenantId,
    userId: req.user?.id,
  });

  // Interceptar o evento 'finish' da resposta
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    // Log HTTP com cores vibrantes usando o método especializado
    coloredLogger.logHttp(req.method, req.url, res.statusCode, duration, {
      contentLength: res.get("Content-Length"),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      correlationId,
      tenantId: req.tenantId,
      userId: req.user?.id,
    });

    // Log de performance se for lento
    if (duration > 1000) {
      coloredLogger.logPerformance(`${req.method} ${req.url}`, duration, {
        statusCode: res.statusCode,
        threshold: "SLOW",
        correlationId,
        tenantId: req.tenantId,
      });
    }
  });

  next();
};
