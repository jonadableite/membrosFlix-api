// src/app/controllers/ReferralController.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createReferral(userId, referralCode) {
	try {
		const referrer = await prisma.user.findUnique({
			where: { referralCode },
		});

		if (!referrer) {
			throw new Error("Código de indicação inválido");
		}

		const referral = await prisma.referralProgram.create({
			data: {
				userId: referrer.id,
				indicadoId: userId,
				pontosGanhos: 10, // Exemplo de pontos ganhos
			},
		});

		// Atualiza os pontos de indicação do usuário que indicou
		await prisma.user.update({
			where: { id: referrer.id },
			data: { referralPoints: { increment: 10 } },
		});

		return referral;
	} catch (error) {
		console.error("Erro ao criar indicação:", error);
		throw error;
	}
}

export async function listReferrals(userId) {
	try {
		const referrals = await prisma.referralProgram.findMany({
			where: { userId },
			include: {
				indicado: true, // Inclui informações sobre o usuário indicado
			},
		});

		return referrals;
	} catch (error) {
		console.error("Erro ao listar indicações:", error);
		throw error;
	}
}
