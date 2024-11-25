// src/app/middlewares/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware de autenticação JWT.
 * Verifica se o token JWT é válido e define o ID do usuário na requisição.
 */
export default function authMiddleware(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({ error: "Token não fornecido" });
	}

	const parts = authHeader.split(" ");

	if (!(parts.length === 2)) {
		return res.status(401).json({ error: "Token error" }); // mensagem mais genérica para evitar dar dicas sobre o formato
	}

	const [scheme, token] = parts;

	if (!/^Bearer$/i.test(scheme)) {
		return res.status(401).json({ error: "Token mal formatado" });
	}

	jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).json({ error: "Token inválido" });
		}

		req.userId = decoded.id; // Define o ID do usuário na requisição
		req.userName = decoded.name;
		req.userEmail = decoded.email;
		req.userAdmin = decoded.admin;
		req.userStatus = decoded.status;

		return next();
	});
}
