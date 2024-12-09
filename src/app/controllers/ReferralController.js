// src/app/controllers/ReferralController.js

import * as Yup from "yup";
import logger from "../../../utils/logger";
import * as referralService from "../services/referralService";

class ReferralController {
	async create(req, res) {
		const schema = Yup.object().shape({
			userId: Yup.string().required("O ID do usuário é obrigatório"),
			referralCode: Yup.string().required(
				"O código de indicação é obrigatório",
			),
		});

		try {
			await schema.validate(req.body, { abortEarly: false });

			const { userId, referralCode } = req.body;
			const referral = await referralService.createReferral(
				userId,
				referralCode,
			);

			return res.status(201).json(referral);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao criar indicação:", error);
			return res.status(500).json({ error: "Erro interno do servidor" });
		}
	}

	async list(req, res) {
		try {
			const { userId } = req.params;
			const referrals = await referralService.listReferrals(userId);

			return res.json(referrals);
		} catch (error) {
			logger.error("Erro ao listar indicações:", error);
			return res.status(500).json({ error: "Erro ao listar indicações" });
		}
	}
}

export default new ReferralController();
