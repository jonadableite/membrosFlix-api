// src/app/services/userService.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function createUser(data) {
	try {
		const { name, email, password, admin, status } = data;

		// Verifique se o e-mail já está em uso
		const userExists = await prisma.user.findUnique({ where: { email } });
		if (userExists) {
			throw new Error("E-mail já está em uso.");
		}

		// Gere o hash da senha
		const passwordHash = await bcrypt.hash(password, 8);

		// Crie o usuário com o hash da senha
		const user = await prisma.user.create({
			data: {
				id: uuidv4(),
				name,
				email,
				passwordHash, // Use o hash da senha
				admin,
				status,
			},
		});

		return user;
	} catch (error) {
		console.error("Erro ao criar usuário:", error);
		throw error;
	}
}

export async function listUsers() {
	try {
		return await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				admin: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	} catch (error) {
		console.error("Erro ao listar usuários:", error);
		throw error;
	}
}

export async function getUser(id) {
	try {
		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				admin: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new Error("Usuário não encontrado");
		}

		return user;
	} catch (error) {
		console.error("Erro ao exibir usuário:", error);
		throw error;
	}
}

export async function updateUser(id, data) {
	try {
		const { email, oldPassword } = data;

		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw new Error("Usuário não encontrado");
		}

		if (email && email !== user.email) {
			const userExists = await prisma.user.findUnique({
				where: { email },
			});

			if (userExists) {
				throw new Error("Já existe um usuário com este e-mail");
			}
		}

		if (
			oldPassword &&
			!(await bcrypt.compare(oldPassword, user.passwordHash))
		) {
			throw new Error("Senha antiga incorreta");
		}

		const { name, password, admin, status } = data;
		const updateData = { name, email, admin, status };

		if (password) {
			updateData.passwordHash = await bcrypt.hash(password, 8);
		}

		await prisma.user.update({
			where: { id },
			data: updateData,
		});

		return { message: "Usuário atualizado com sucesso!" };
	} catch (error) {
		console.error("Erro ao atualizar usuário:", error);
		throw error;
	}
}

export async function deleteUser(id) {
	try {
		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw new Error("Usuário não encontrado");
		}

		await prisma.user.delete({ where: { id } });
	} catch (error) {
		console.error("Erro ao excluir usuário:", error);
		throw error;
	}
}
