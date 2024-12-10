import { v4 as uuidv4 } from "uuid"; // Importe a biblioteca uuid
// controllers/sessionController.js
import * as Yup from "yup";
import logger from "../../../utils/logger";
import { notifyUser } from "../../config/websocket";
import * as sessionService from "../services/sessionService";

class SessionController {
	async store(req, res) {
		const schema = Yup.object().shape({
			email: Yup.string().email().required("E-mail é obrigatório"),
			password: Yup.string().required("Senha é obrigatória"),
		});

		try {
			// Validação dos dados de entrada
			await schema.validate(req.body, { abortEarly: false });

			const { email, password } = req.body;

			// Autentica o usuário usando o serviço
			const user = await sessionService.authenticateUser(email, password);

			if (!user) {
				return res.status(401).json({ error: "Usuário não encontrado" });
			}

			// Gera o token JWT
			const token = sessionService.generateToken(user);

			const { id, name, role, status } = user;

			// Gerar um ID único para a notificação
			const notificationId = uuidv4();

			// Emitir notificação de boas-vindas com ID
			const notification = {
				id: notificationId,
				type: "WELCOME",
				message: `Bem-vindo novamente, ${name}! Bons estudos!`,
			};
			notifyUser(id, notification);

			// Retorna a resposta de sucesso
			return res.json({
				user: {
					id,
					name,
					email,
					role,
					status,
				},
				token,
			});
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			if (
				error.message === "Usuário não encontrado" ||
				error.message === "Senha incorreta"
			) {
				return res.status(401).json({ error: error.message });
			}
			logger.error("Erro na autenticação:", error);
			return res.status(500).json({ error: "Erro interno do servidor" });
		}
	}
}

export default new SessionController();
