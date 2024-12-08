// src/config/redisClient.js

const redis = require("redis");
require("dotenv").config();

// URL de conexão ao Redis a partir do .env
const redisUrl = process.env.REDIS_URL;

// Cria um cliente Redis
const client = redis.createClient({
	url: redisUrl,
});

// Lida com eventos de conexão
client.on("connect", () => {
	console.log("Conectado ao Redis com sucesso!");
});

client.on("error", (err) => {
	console.error("Erro ao conectar ao Redis:", err);
});

// Conecta ao Redis
client.connect().catch(console.error);

module.exports = client;
