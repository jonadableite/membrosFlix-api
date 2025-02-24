// src/app/controllers/InstructorController.js

import { PrismaClient } from "@prisma/client";
import logger from "../../../utils/logger.js";
import * as instructorService from "../services/instructorService.js";

// Inicializando o Prisma Client
const prisma = new PrismaClient();

class InstructorController {
	/**
	 * Cria um novo instrutor.
	 */
	async create(req, res) {
		try {
			const instructor = await instructorService.createInstructor(req.body);
			return res.status(201).json(instructor);
		} catch (error) {
			const instructorLogger = logger.setContext("InstructorController");
			instructorLogger.error("Erro ao criar instrutor:", error);
			return res.status(500).json({ error: "Erro ao criar instrutor" });
		}
	}

	/**
	 * Atualiza um instrutor existente.
	 */
	async update(req, res) {
		try {
			const { userId } = req.params;
			const instructor = await instructorService.updateInstructor(
				userId,
				req.body,
			);
			return res.json(instructor);
		} catch (error) {
			instructorLogger.error("Erro ao atualizar instrutor:", error);
			return res.status(500).json({ error: "Erro ao atualizar instrutor" });
		}
	}

	/**
	 * Obtém um instrutor pelo ID do usuário.
	 */
	async show(req, res) {
		try {
			const { userId } = req.params;
			const instructor = await instructorService.getInstructorByUserId(userId);
			return res.json(instructor);
		} catch (error) {
			instructorLogger.error("Erro ao obter instrutor:", error);
			return res.status(500).json({ error: "Erro ao obter instrutor" });
		}
	}

	/**
	 * Lista todos os instrutores.
	 */
	async index(req, res) {
		try {
			instructorLogger.log("Buscando instrutores...");
			const instructors = await prisma.user.findMany({
				where: {
					role: "INSTRUCTOR",
				},
				include: {
					instructor: true,
				},
			});

			instructorLogger.log("Instrutores encontrados:", instructors);

			const formattedInstructors = instructors.map((instructor) => ({
				id: instructor.id, // Mudamos para usar o ID do usuário
				name: instructor.name,
			}));

			instructorLogger.log("Instrutores formatados:", formattedInstructors);

			return res.json(formattedInstructors);
		} catch (error) {
			instructorLogger.error("Erro ao listar instrutores:", error);
			return res.status(500).json({ error: "Erro ao listar instrutores" });
		}
	}

	/**
	 * Deleta um instrutor pelo ID do usuário.
	 */
	async delete(req, res) {
		try {
			const { userId } = req.params;
			await instructorService.deleteInstructorByUserId(userId);
			return res.status(204).send();
		} catch (error) {
			instructorLogger.error("Erro ao excluir instrutor:", error);
			return res.status(500).json({ error: "Erro ao excluir instrutor" });
		}
	}
}

export default new InstructorController();
