// src/app/controllers/InstructorController.js

import * as instructorService from "../services/instructorService";

class InstructorController {
	/**
	 * Cria um novo instrutor.
	 */
	async create(req, res) {
		try {
			const instructor = await instructorService.createInstructor(req.body);
			return res.status(201).json(instructor);
		} catch (error) {
			console.error("Erro ao criar instrutor:", error);
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
			console.error("Erro ao atualizar instrutor:", error);
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
			console.error("Erro ao obter instrutor:", error);
			return res.status(500).json({ error: "Erro ao obter instrutor" });
		}
	}

	/**
	 * Lista todos os instrutores.
	 */
	async index(req, res) {
		try {
			const instructors = await instructorService.listInstructors();
			return res.json(instructors);
		} catch (error) {
			console.error("Erro ao listar instrutores:", error);
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
			console.error("Erro ao excluir instrutor:", error);
			return res.status(500).json({ error: "Erro ao excluir instrutor" });
		}
	}
}

export default new InstructorController();
