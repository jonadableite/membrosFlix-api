// src/app/services/instructorService.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cria um novo instrutor.
 * @param {Object} data - Dados do instrutor.
 * @returns {Promise<Object>} - Instrutor criado.
 */
export async function createInstructor(data) {
	try {
		const instructor = await prisma.instructor.create({
			data: {
				userId: data.userId,
				bio: data.bio,
				expertise: data.expertise,
			},
		});
		return instructor;
	} catch (error) {
		console.error("Erro ao criar instrutor:", error);
		throw error;
	}
}

/**
 * Atualiza um instrutor existente.
 * @param {String} userId - ID do usuário.
 * @param {Object} data - Dados para atualização.
 * @returns {Promise<Object>} - Instrutor atualizado.
 */
export async function updateInstructor(userId, data) {
	try {
		const instructor = await prisma.instructor.update({
			where: { userId },
			data,
		});
		return instructor;
	} catch (error) {
		console.error("Erro ao atualizar instrutor:", error);
		throw error;
	}
}

/**
 * Obtém um instrutor pelo ID do usuário.
 * @param {String} userId - ID do usuário.
 * @returns {Promise<Object>} - Instrutor encontrado.
 */
export async function getInstructorByUserId(userId) {
	try {
		const instructor = await prisma.instructor.findUnique({
			where: { userId },
			include: { courses: true },
		});
		return instructor;
	} catch (error) {
		console.error("Erro ao obter instrutor:", error);
		throw error;
	}
}

/**
 * Lista todos os instrutores.
 * @returns {Promise<Array>} - Lista de instrutores.
 */
export async function listInstructors() {
	try {
		const instructors = await prisma.instructor.findMany({
			include: { courses: true },
		});
		return instructors;
	} catch (error) {
		console.error("Erro ao listar instrutores:", error);
		throw error;
	}
}

/**
 * Exclui um instrutor pelo ID do usuário.
 * @param {String} userId - ID do usuário.
 * @returns {Promise<Object>} - Instrutor excluído.
 */
export async function deleteInstructorByUserId(userId) {
	try {
		const instructor = await prisma.instructor.delete({
			where: { userId },
		});
		return instructor;
	} catch (error) {
		console.error("Erro ao excluir instrutor:", error);
		throw error;
	}
}
