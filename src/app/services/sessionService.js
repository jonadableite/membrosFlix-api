import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function authenticateUser(email, password) {
	try {
		// Busca o usuário pelo email
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new Error("Usuário não encontrado");
		}

		// Verifique a senha usando bcrypt
		const passwordMatches = await bcrypt.compare(password, user.passwordHash);
		if (!passwordMatches) {
			throw new Error("Senha incorreta");
		}

		return user;
	} catch (error) {
		console.error("Erro na autenticação:", error);
		throw error;
	}
}

export function generateToken(user) {
	const { id, name, email, role, status } = user;

	return jwt.sign({ id, name, email, role, status }, process.env.APP_SECRET, {
		expiresIn: "30d",
	});
}
