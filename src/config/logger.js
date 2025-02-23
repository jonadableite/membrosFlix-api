import chalk from 'chalk';
// src/config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getBrazilDateTime } from '../utils/date-utils';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

type LogLevel = keyof typeof logLevels;

const chalkColors: Record<LogLevel, (text: string) => string> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.green,
  http: chalk.magenta,
  verbose: chalk.cyan,
  debug: chalk.blue,
  silly: chalk.gray,
};

const logEmojis: Record<LogLevel, string> = {
  error: '❌',
  warn: '⚠️',
  info: '📢',
  http: '🌐',
  verbose: '🗣️',
  debug: '🤖',
  silly: '🃏',
};

const consoleFormat = winston.format.printf(({ level, message }) => {
  const color = chalkColors[level as LogLevel];
  const emoji = logEmojis[level as LogLevel];
  const brazilDateTime = getBrazilDateTime();
  return `${emoji} ${color(`[${level.toUpperCase()}]`)} ${chalk.gray(brazilDateTime)} ${message}`;
});

const fileFormat = winston.format.printf(({ level, message, timestamp }) => {
  const emoji = logEmojis[level as LogLevel];
  return `${emoji} [${level.toUpperCase()}] ${timestamp} ${message}`;
});

const logger = winston.createLogger({
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => getBrazilDateTime(),
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      level: 'silly',
      format: consoleFormat,
    }),
    new DailyRotateFile({
      level: 'info',
      filename: 'logs/bot-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
});

// Adicionar log de exceções não tratadas
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' }),
);

// Adicionar log de rejeições não tratadas
logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' }),
);

export { logger };
