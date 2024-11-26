import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import * as Yup from "yup";
import logger from "../../../utils/logger";

import User from "../models/User";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         admin:
 *           type: boolean
 *         status:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         admin:
 *           type: boolean
 *         status:
 *           type: boolean
 */
class UserController {
	/**
	 * @swagger
	 * /users:
	 *   post:
	 *     summary: Cria um novo usuário
	 *     tags: [Usuários]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UserInput'
	 *     responses:
	 *       201:
	 *         description: Usuário criado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/User'
	 *       400:
	 *         description: Erro de validação ou e-mail já em uso
	 *       500:
	 *         description: Erro interno do servidor
	 */
	async store(req, res) {
		// Definição do esquema de validação
		const schema = Yup.object().shape({
			name: Yup.string().required("Nome é obrigatório"),
			email: Yup.string()
				.email("E-mail inválido")
				.required("E-mail é obrigatório"),
			password: Yup.string()
				.min(6, "A senha deve ter pelo menos 6 caracteres")
				.required("Senha é obrigatória"),
			admin: Yup.boolean(),
			status: Yup.boolean(),
		});

		try {
			// Validação dos dados de entrada
			await schema.validate(req.body, { abortEarly: false });

			const { name, email, password, admin, status } = req.body;

			// Verifica se o email já está cadastrado
			const userExists = await User.findOne({ where: { email } });
			if (userExists) {
				return res.status(400).json({ message: "E-mail já está em uso." });
			}

			// Criação do usuário
			const user = await User.create({
				id: uuidv4(),
				name,
				email,
				password,
				admin,
				status,
			});

			console.log(`Usuário criado: ${user.name} (ID: ${user.id})`);

			return res.status(201).json({
				id: user.id,
				name: user.name,
				email: user.email,
				admin: user.admin,
			});
		} catch (error) {
			// Tratamento de erros de validação e outros
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({
					message: "Erro de validação",
					errors: error.errors,
				});
			}
			logger.error("Erro ao criar usuário:", error);
			return res.status(500).json({ message: "Erro interno do servidor" });
		}
	}

	/**
	 * @swagger
	 * /users:
	 *   get:
	 *     summary: Lista todos os usuários
	 *     tags: [Usuários]
	 *     responses:
	 *       200:
	 *         description: Lista de usuários
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/User'
	 *       500:
	 *         description: Erro ao listar usuários
	 */

	/**
	 * Lista todos os usuários.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @returns {Object} JSON com a lista de usuários ou um erro 500.
	 */
	async index(req, res) {
		try {
			const users = await User.findAll({
				attributes: [
					"id",
					"name",
					"email",
					"admin",
					"status",
					"created_at",
					"updated_at",
				], // Define os atributos a serem retornados
			});
			return res.json(users);
		} catch (error) {
			logger.error("Erro ao listar usuários:", error);
			return res.status(500).json({ error: "Erro ao listar usuários" });
		}
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *   get:
	 *     summary: Exibe um usuário específico
	 *     tags: [Usuários]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: string
	 *         required: true
	 *         description: ID do usuário
	 *     responses:
	 *       200:
	 *         description: Dados do usuário
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/User'
	 *       404:
	 *         description: Usuário não encontrado
	 *       500:
	 *         description: Erro ao exibir usuário
	 */

	/**
	 * Exibe um usuário específico.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {string} req.params.id - ID do usuário.
	 * @returns {Object} JSON com os dados do usuário ou um erro 404/500.
	 */
	async show(req, res) {
		try {
			const { id } = req.params;
			const user = await User.findByPk(id, {
				attributes: [
					"id",
					"name",
					"email",
					"admin",
					"status",
					"created_at",
					"updated_at",
				], // Define os atributos a serem retornados
			});

			if (!user) {
				return res.status(404).json({ error: "Usuário não encontrado" });
			}

			return res.json(user);
		} catch (error) {
			logger.error("Erro ao exibir usuário:", error);
			return res.status(500).json({ error: "Erro ao exibir usuário" });
		}
	}

	/**
	 * Exclui um usuário.
	 * @param {Object} req - Requisição HTTP.
	 * @param {Object} res - Resposta HTTP.
	 * @param {string} req.params.id - ID do usuário a ser excluído.
	 * @returns {Object} Resposta HTTP 204 No Content ou um erro 404/500.
	 */

	/**
	 * @swagger
	 * /users/{id}:
	 *   delete:
	 *     summary: Exclui um usuário
	 *     tags: [Usuários]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: string
	 *         required: true
	 *         description: ID do usuário a ser excluído
	 *     responses:
	 *       204:
	 *         description: Usuário excluído com sucesso
	 *       404:
	 *         description: Usuário não encontrado
	 *       500:
	 *         description: Erro ao excluir usuário
	 */

	async delete(req, res) {
		try {
			const { id } = req.params;
			const user = await User.findByPk(id);

			if (!user) {
				return res.status(404).json({ error: "Usuário não encontrado" });
			}

			await user.destroy();

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao excluir usuário:", error);
			return res.status(500).json({ error: "Erro ao excluir usuário" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				name: Yup.string(),
				email: Yup.string().email(),
				oldPassword: Yup.string().when("password", (password, field) =>
					password ? field.required() : field,
				),
				password: Yup.string().min(6),
				confirmPassword: Yup.string().when("password", (password, field) =>
					password ? field.required().oneOf([Yup.ref("password")]) : field,
				),
				admin: Yup.boolean(),
				status: Yup.boolean(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { id } = req.params;
			const { email, oldPassword } = req.body;

			const user = await User.findByPk(id);

			if (!user) {
				return res.status(404).json({ error: "Usuário não encontrado" }); // 404 Not Found
			}

			if (email && email !== user.email) {
				const userExists = await User.findOne({
					where: { email: { [Op.iLike]: email } }, // Case-insensitive search
				});

				if (userExists) {
					return res
						.status(400)
						.json({ error: "Já existe um usuário com este e-mail" });
				}
			}

			if (oldPassword && !(await user.checkPassword(oldPassword))) {
				return res.status(401).json({ error: "Senha antiga incorreta" });
			}

			const { name, password, admin, status } = req.body;

			await user.update({ name, email, password, admin, status }); // Atualiza os dados do usuário

			return res.json({ message: "Usuário atualizado com sucesso!" });
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}

			logger.error("Erro ao atualizar usuário:", error);
			return res.status(500).json({ error: "Erro ao atualizar usuário" });
		}
	}
}

export default new UserController();
