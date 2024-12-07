// src/app/services/aulaService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listAulas(courseId) {
	try {
		return await prisma.aula.findMany({
			where: { courseId: Number.parseInt(courseId, 10) },
		});
	} catch (error) {
		console.error("Erro ao listar aulas:", error.message);
		throw new Error("Erro ao listar aulas");
	}
}

export async function listProximasAulas(courseId) {
	try {
		return await prisma.aula.findMany({
			where: { courseId: Number.parseInt(courseId, 10) },
			orderBy: { createdAt: "asc" },
			take: 5,
		});
	} catch (error) {
		console.error("Erro ao buscar próximas aulas:", error.message);
		throw new Error("Erro ao buscar próximas aulas");
	}
}

export async function getAula(courseId, id) {
	try {
		const aula = await prisma.aula.findUnique({
			where: { id: Number.parseInt(id, 10) },
		});

		if (!aula || aula.courseId !== Number.parseInt(courseId, 10)) {
			throw new Error("Aula não encontrada");
		}

		return aula;
	} catch (error) {
		console.error("Erro ao exibir aula:", error.message);
		throw new Error("Erro ao exibir aula");
	}
}

export async function createAula(data, filePath) {
	try {
		const { courseId, name, description, duration } = data;
		const path = filePath;

		return await prisma.aula.create({
			data: {
				name,
				description,
				duration: Number.parseInt(duration, 10),
				path,
				courseId: Number.parseInt(courseId, 10),
			},
		});
	} catch (error) {
		console.error("Erro ao criar aula:", error.message);
		throw new Error("Erro ao criar aula");
	}
}

export async function updateAula(courseId, id, data) {
	try {
		const aula = await prisma.aula.findUnique({
			where: { id: Number.parseInt(id, 10) },
		});

		if (!aula || aula.courseId !== Number.parseInt(courseId, 10)) {
			throw new Error("Aula não encontrada");
		}

		return await prisma.aula.update({
			where: { id: Number.parseInt(id, 10) },
			data,
		});
	} catch (error) {
		console.error("Erro ao atualizar aula:", error.message);
		throw new Error("Erro ao atualizar aula");
	}
}

export async function deleteAula(courseId, id) {
	try {
		const aula = await prisma.aula.findUnique({
			where: { id: Number.parseInt(id, 10) },
		});

		if (!aula || aula.courseId !== Number.parseInt(courseId, 10)) {
			throw new Error("Aula não encontrada");
		}

		await prisma.aula.delete({ where: { id: Number.parseInt(id, 10) } });
	} catch (error) {
		console.error("Erro ao excluir aula:", error.message);
		throw new Error("Erro ao excluir aula");
	}
}
