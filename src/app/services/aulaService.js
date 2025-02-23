// src/app/services/aulaService.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function listAulas(courseId) {
	try {
		return await prisma.aula.findMany({
			where: { courseId: Number.parseInt(courseId, 10) },
			include: {
				instructor: {
					select: { name: true },
				},
			},
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
			include: {
				instructor: {
					select: { id: true, user: { select: { name: true } } },
				},
			},
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
			include: {
				instructor: {
					select: { id: true, user: { select: { name: true } } },
				},
			},
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

// No serviço de criação de aula
export async function createAula(data, filePath) {
	try {
		const { courseId, name, description, duration, instructorId } = data;
		const path = filePath;

		return await prisma.aula.create({
			data: {
				name,
				description,
				duration: Number(duration),
				path,
				courseId: Number(courseId),
				instructorId,
			},
		});
	} catch (error) {
		console.error("Erro ao criar aula:", error);
		throw new Error("Erro ao criar aula");
	}
}

// No serviço de atualização de aula
export async function updateAula(courseId, id, data) {
	try {
		const aula = await prisma.aula.findUnique({
			where: { id: Number(id) },
		});

		if (!aula || aula.courseId !== Number(courseId)) {
			throw new Error("Aula não encontrada");
		}

		// Converta o campo duration e instructorId para número, se fornecidos
		if (data.duration) {
			data.duration = Number(data.duration);
		}
		if (data.instructorId) {
			data.instructorId = Number(data.instructorId);
		}

		return await prisma.aula.update({
			where: { id: Number(id) },
			data: {
				...data,
				duration: data.duration !== undefined ? data.duration : aula.duration,
				instructorId:
					data.instructorId !== undefined
						? data.instructorId
						: aula.instructorId,
			},
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
