import jwt from "jsonwebtoken";
import * as Yup from "yup";
import User from "../models/User";
import logger from "../../../utils/logger";

/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *     SessionInput:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 */

class SessionController {
	/**
	 * @swagger
	 * /sessions:
	 *   post:
	 *     summary: Autentica um usuário
	 *     tags: [Sessões]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/SessionInput'
	 *     responses:
	 *       200:
	 *         description: Usuário autenticado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Session'
	 *       400:
	 *         description: Erro de validação
	 *       401:
	 *         description: Usuário não encontrado ou senha incorreta
	 *       500:
	 *         description: Erro interno do servidor
	 */
	async store(req, res) {
		const schema = Yup.object().shape({
			email: Yup.string().email().required(),
			password: Yup.string().required(),
		});

		try {
			await schema.validate(req.body, { abortEarly: false });

			const { email, password } = req.body;

			const user = await User.findOne({ where: { email } });

			if (!user) {
				return res.status(401).json({ error: "Usuário não encontrado" });
			}

			if (!(await user.checkPassword(password))) {
				// Usando o método correto para comparar senhas
				return res.status(401).json({ error: "Senha incorreta" });
			}

			const { id, name, admin, status } = user; // Desestrutura os atributos

			const token = jwt.sign(
				{ id, name, email, admin, status },
				process.env.APP_SECRET,
				{
					expiresIn: "30d",
				},
			);

			return res.json({
				user: {
					id,
					name,
					email,
					admin,
					status, // Retorna os dados do usuário
				},
				token,
			});
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro na autenticação:", error);
			return res.status(500).json({ error: "Erro interno do servidor" });
		}
	}
}

export default new SessionController();
