// src/app/services/cursoService.js

import { PrismaClient } from "@prisma/client";
import minioClient from "../../config/minioClient";
import fs from "node:fs";

const prisma = new PrismaClient();

export async function listCursos() {
	try {
		return await prisma.curso.findMany();
	} catch (error) {
		console.error("Erro ao listar cursos:", error);
		throw error;
	}
}

export async function getCurso(id) {
	try {
		const parsedId = Number.parseInt(id);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const curso = await prisma.curso.findUnique({ where: { id: parsedId } });
		if (!curso) {
			throw new Error("Curso não encontrado");
		}

		return curso;
	} catch (error) {
		console.error("Erro ao exibir curso:", error);
		throw error;
	}
}

export async function createCurso(data, file) {
	try {
		const { title, description } = data;

		// Use findFirst para verificar a existência do curso pelo título
		const cursoExists = await prisma.curso.findFirst({ where: { title } });
		if (cursoExists) {
			throw new Error("Já existe um curso com este título");
		}

		// biome-ignore lint/style/useConst: <explanation>
		let cursoData = { title, description };

		if (file) {
			const { originalname: name, mimetype, filename, path } = file;
			const bucketName = "curso";

			const bucketExists = await minioClient.bucketExists(bucketName);
			if (!bucketExists) {
				await minioClient.makeBucket(bucketName, "eu-south");
			}

			await minioClient.fPutObject(bucketName, filename, path, {
				"Content-Type": mimetype,
			});

			await fs.promises.unlink(file.path);

			cursoData.path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
		}

		return await prisma.curso.create({ data: cursoData });
	} catch (error) {
		console.error("Erro ao criar curso:", error);
		throw error;
	}
}

export async function updateCurso(id, data, file) {
	try {
		const parsedId = Number.parseInt(id);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const curso = await prisma.curso.findUnique({ where: { id: parsedId } });
		if (!curso) {
			throw new Error("Curso não encontrado");
		}

		const { title, description } = data;

		if (title && title !== curso.title) {
			const cursoExists = await prisma.curso.findFirst({ where: { title } });
			if (cursoExists) {
				throw new Error("Já existe um curso com este título");
			}
		}

		// biome-ignore lint/style/useConst: <explanation>
		let cursoData = { title, description };

		if (file) {
			const { filename, path, mimetype } = file;
			const bucketName = "curso";

			const bucketExists = await minioClient.bucketExists(bucketName);
			if (!bucketExists) {
				await minioClient.makeBucket(bucketName, "eu-south");
			}

			await minioClient.fPutObject(bucketName, filename, path, {
				"Content-Type": mimetype,
			});

			await fs.promises.unlink(file.path);

			cursoData.path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
		}

		return await prisma.curso.update({
			where: { id: parsedId },
			data: cursoData,
		});
	} catch (error) {
		console.error("Erro ao atualizar curso:", error);
		throw error;
	}
}

export async function deleteCurso(id) {
	try {
		const parsedId = Number.parseInt(id);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const curso = await prisma.curso.findUnique({ where: { id: parsedId } });
		if (!curso) {
			throw new Error("Curso não encontrado");
		}

		await prisma.curso.delete({ where: { id: parsedId } });
	} catch (error) {
		console.error("Erro ao excluir curso:", error);
		throw error;
	}
}
