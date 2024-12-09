// src/app/controllers/ReferralController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function issueCertificate(userId, courseId) {
	try {
		const certificate = await prisma.certificate.create({
			data: {
				userId,
				courseId,
				issuedAt: new Date(),
			},
		});

		return certificate;
	} catch (error) {
		console.error("Erro ao emitir certificado:", error);
		throw error;
	}
}

export async function listCertificates(userId) {
	try {
		const certificates = await prisma.certificate.findMany({
			where: { userId },
			include: {
				course: true, // Inclui informações sobre o curso
			},
		});

		return certificates;
	} catch (error) {
		console.error("Erro ao listar certificados:", error);
		throw error;
	}
}
