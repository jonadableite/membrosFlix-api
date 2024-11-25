import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import app from "./app";
import swaggerSpec from "./swagger";
require("dotenv").config();

// Configuração do Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(3001, () => console.log("🚀 Server ON, rodando na porta: 3001..."));
