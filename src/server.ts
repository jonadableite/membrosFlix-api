import "dotenv/config";
import http from "http";
import swaggerUi from "swagger-ui-express";
import app from "./app.js";
import swaggerSpec from "./swagger.js";
import { coloredLogger } from "./shared/logger/colored.logger.js";
import { SocketService } from "./shared/websocket/socket.service.js";
import { initializeMinIOBuckets } from "./modules/uploads/lib/minio.client.js";

// Configuration for handling uncaught errors
process.on("uncaughtException", (error: Error) => {
  coloredLogger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  coloredLogger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
// let socketService: SocketService;

const PORT = process.env.PORT || 3007;
const HOST = process.env.HOST || "0.0.0.0";

// Swagger UI configuration
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Function to start the server
const startServer = async (): Promise<void> => {
  try {
    // Initialize MinIO buckets
    try {
      await initializeMinIOBuckets();
      coloredLogger.info("📦 MinIO buckets initialized");
    } catch (error) {
      coloredLogger.warn(
        "⚠️ MinIO initialization failed - continuing without it",
        { error }
      );
    }

    server.listen(Number(PORT), HOST, () => {
      // Initialize Socket.io after server starts
      const socketService = new SocketService(server);

      coloredLogger.start(`Server ON, running on ${HOST}:${PORT}...`);
      coloredLogger.info(
        `📚 API Documentation available at http://${HOST}:${PORT}/api-docs`
      );
      coloredLogger.info(
        `🏥 Health check available at http://${HOST}:${PORT}/health`
      );
      coloredLogger.info(
        `🔌 WebSocket available at http://${HOST}:${PORT}/socket.io/`
      );

      // Environment log
      coloredLogger.info(
        `Environment: ${process.env.NODE_ENV || "development"}`
      );
    });

    // Graceful shutdown handling
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    coloredLogger.error("Critical error starting server:", error);
    process.exit(1);
  }
};

// Graceful shutdown function
const gracefulShutdown = (): void => {
  coloredLogger.info("Received shutdown signal, closing server gracefully...");

  server.close((err) => {
    if (err) {
      coloredLogger.error("Error during server shutdown:", err);
      process.exit(1);
    }

    coloredLogger.info("Server closed successfully");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    coloredLogger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Start the server
startServer();

export default server;
