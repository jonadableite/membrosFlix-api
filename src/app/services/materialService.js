// src/app/services/materialService.js

import prisma from "../../prismaClient";

export async function listMaterials(courseId, lessonId) {
	try {
		// Verifica se a aula existe
		const aulaExists = await prisma.aula.findUnique({
			where: { id: Number.parseInt(lessonId, 10) },
		});

		if (!aulaExists || aulaExists.courseId !== Number.parseInt(courseId, 10)) {
			throw new Error(
				"Aula não encontrada ou não pertence ao curso especificado",
			);
		}

		return await prisma.material.findMany({
			where: {
				aulaId: Number.parseInt(lessonId, 10),
			},
		});
	} catch (error) {
		console.error("Erro ao listar materiais:", error.message);
		throw new Error("Erro ao listar materiais");
	}
}

export async function createMaterial(courseId, lessonId, data) {
	try {
		const { title, url } = data;

		// Verifica se a aula existe
		const aulaExists = await prisma.aula.findUnique({
			where: { id: Number.parseInt(lessonId, 10) },
		});

		if (!aulaExists || aulaExists.courseId !== Number.parseInt(courseId, 10)) {
			throw new Error(
				"Aula não encontrada ou não pertence ao curso especificado",
			);
		}

		return await prisma.material.create({
			data: {
				title,
				url,
				aulaId: Number.parseInt(lessonId, 10),
			},
		});
	} catch (error) {
		console.error("Erro ao criar material:", error.message);
		throw new Error("Erro ao criar material");
	}
}
