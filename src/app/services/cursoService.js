// src/app/services/cursoService.js
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import minioClient from "../../config/minioClient";

const prisma = new PrismaClient();

export async function listCursos() {
	try {
		return await prisma.curso.findMany({
			include: {
				instructor: true,
				aulas: true,
				comments: true,
				likes: true,
			},
		});
	} catch (error) {
		console.error("Erro ao listar cursos:", error.message);
		throw new Error("Erro ao listar cursos");
	}
}

export async function getCurso(id) {
	try {
		const parsedId = Number.parseInt(id, 10);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const curso = await prisma.curso.findUnique({
			where: { id: parsedId },
			include: {
				instructor: true,
				aulas: true,
				comments: true,
				likes: true,
			},
		});
		if (!curso) {
			throw new Error("Curso não encontrado");
		}

		return curso;
	} catch (error) {
		console.error("Erro ao exibir curso:", error.message);
		throw new Error("Erro ao exibir curso");
	}
}

export async function createCurso(data, file, thumbnail) {
	try {
		const { title, description, status, duracaoTotal } = data;

		const cursoExists = await prisma.curso.findFirst({ where: { title } });
		if (cursoExists) {
			throw new Error("Já existe um curso com este título");
		}

		const cursoData = {
			title,
			description,
			status: status || "DRAFT",
			duracaoTotal: duracaoTotal ? Number(duracaoTotal) : null,
		};

		// Upload de thumbnail
		if (thumbnail) {
			try {
				const { filename, path, mimetype } = thumbnail;
				const bucketName = "curso-thumbnails";

				const bucketExists = await minioClient.bucketExists(bucketName);
				if (!bucketExists) {
					await minioClient.makeBucket(bucketName, "eu-south");
				}

				await minioClient.fPutObject(bucketName, filename, path, {
					"Content-Type": mimetype,
				});

				await fs.promises.unlink(path);

				cursoData.thumbnail = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
			} catch (uploadError) {
				console.error("Erro no upload da thumbnail:", uploadError);
			}
		}

		// Upload de arquivo do curso
		if (file) {
			try {
				const { filename, path, mimetype } = file;
				const bucketName = "curso";

				const bucketExists = await minioClient.bucketExists(bucketName);
				if (!bucketExists) {
					await minioClient.makeBucket(bucketName, "eu-south");
				}

				await minioClient.fPutObject(bucketName, filename, path, {
					"Content-Type": mimetype,
				});

				await fs.promises.unlink(path);

				cursoData.path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
			} catch (uploadError) {
				console.error("Erro no upload do arquivo:", uploadError);
			}
		}

		return await prisma.curso.create({ data: cursoData });
	} catch (error) {
		console.error("Erro ao criar curso:", error.message);
		throw new Error(error.message || "Erro ao criar curso");
	}
}

export async function updateCurso(id, data, file, thumbnail) {
	try {
		const parsedId = Number.parseInt(id, 10);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const { title, description, status, duracaoTotal } = data;

		const existingCurso = await prisma.curso.findUnique({
			where: { id: parsedId },
		});

		if (!existingCurso) {
			throw new Error("Curso não encontrado");
		}

		// Prepare os dados para atualização
		const cursoData = {};

		// Adicione apenas os campos que foram modificados
		if (title) cursoData.title = title;
		if (description) cursoData.description = description;
		if (status) cursoData.status = status;
		if (duracaoTotal) cursoData.duracaoTotal = Number(duracaoTotal);

		// Upload de thumbnail
		if (thumbnail) {
			try {
				const { filename, path, mimetype } = thumbnail;
				const bucketName = "curso-thumbnails";

				const bucketExists = await minioClient.bucketExists(bucketName);
				if (!bucketExists) {
					await minioClient.makeBucket(bucketName, "eu-south");
				}

				await minioClient.fPutObject(bucketName, filename, path, {
					"Content-Type": mimetype,
				});

				await fs.promises.unlink(path);

				cursoData.thumbnail = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
			} catch (uploadError) {
				console.error("Erro no upload da thumbnail:", uploadError);
			}
		}

		// Upload de arquivo do curso
		if (file) {
			try {
				const { filename, path, mimetype } = file;
				const bucketName = "curso";

				const bucketExists = await minioClient.bucketExists(bucketName);
				if (!bucketExists) {
					await minioClient.makeBucket(bucketName, "eu-south");
				}

				await minioClient.fPutObject(bucketName, filename, path, {
					"Content-Type": mimetype,
				});

				await fs.promises.unlink(path);

				cursoData.path = `${process.env.MINIO_SERVER_URL}/${bucketName}/${filename}`;
			} catch (uploadError) {
				console.error("Erro no upload do arquivo:", uploadError);
			}
		}

		return await prisma.curso.update({
			where: { id: parsedId },
			data: cursoData,
		});
	} catch (error) {
		console.error("Erro ao atualizar curso:", error.message);
		throw new Error(error.message || "Erro ao atualizar curso");
	}
}

export async function deleteCurso(id) {
	try {
		const parsedId = Number.parseInt(id, 10);
		if (Number.isNaN(parsedId)) {
			throw new Error("ID do curso inválido");
		}

		const curso = await prisma.curso.findUnique({ where: { id: parsedId } });
		if (!curso) {
			throw new Error("Curso não encontrado");
		}

		await prisma.curso.delete({ where: { id: parsedId } });
		return true;
	} catch (error) {
		console.error("Erro ao excluir curso:", error.message);
		throw new Error("Erro ao excluir curso");
	}
}
