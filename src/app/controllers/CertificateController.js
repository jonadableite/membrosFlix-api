// src/app/controllers/ReferralController.js
import * as Yup from "yup";
import logger from "../../../utils/logger.js";
import * as certificateService from "../services/certificateService.js";

class CertificateController {
	async issue(req, res) {
		const schema = Yup.object().shape({
			userId: Yup.string().required("O ID do usuário é obrigatório"),
			courseId: Yup.number().required("O ID do curso é obrigatório"),
		});

		try {
			await schema.validate(req.body, { abortEarly: false });

			const { userId, courseId } = req.body;
			const certificate = await certificateService.issueCertificate(
				userId,
				courseId,
			);

			return res.status(201).json(certificate);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao emitir certificado:", error);
			return res.status(500).json({ error: "Erro interno do servidor" });
		}
	}

	async list(req, res) {
		try {
			const { userId } = req.params;
			const certificates = await certificateService.listCertificates(userId);

			return res.json(certificates);
		} catch (error) {
			logger.error("Erro ao listar certificados:", error);
			return res.status(500).json({ error: "Erro ao listar certificados" });
		}
	}
}

export default new CertificateController();
