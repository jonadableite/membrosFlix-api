import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { promisify } from "node:util";
import authConfig from "../../config/auth";

const prisma = new PrismaClient();

/**
 * Middleware de autenticação JWT.
 * Verifica se o token JWT é válido e define o usuário na requisição.
 */
export default async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({ error: "Token não fornecido" });
	}

	const [, token] = authHeader.split(" ");

	try {
		const decoded = await promisify(jwt.verify)(token, authConfig.secret);
		req.userId = decoded.id;

		// Busque o usuário no banco de dados usando Prisma
		const user = await prisma.user.findUnique({
			where: { id: req.userId },
		});

		if (!user) {
			return res.status(401).json({ error: "Usuário não encontrado" });
		}

		req.user = user; // Defina req.user com o objeto do usuário

		return next();
	} catch (err) {
		return res.status(401).json({ error: "Token inválido" });
	}
};
