import * as Yup from "yup";
import Cursos from "../models/Cursos";

/**
 * @swagger
 * components:
 *   schemas:
 *     Curso:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CursoInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 */
class CursoController {
	/**
	 * @swagger
	 * /cursos/{id}:
	 *   put:
	 *     summary: Atualiza um curso
	 *     tags: [Cursos]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CursoInput'
	 *     responses:
	 *       200:
	 *         description: Curso atualizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Curso'
	 *       400:
	 *         description: Erro de validação ou curso com mesmo título já existente
	 *       404:
	 *         description: Curso não encontrado
	 *       500:
	 *         description: Erro ao atualizar curso
	 */
	async index(req, res) {
		try {
			const cursos = await Cursos.findAll();
			return res.json(cursos);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Erro ao listar cursos" });
		}
	}

	/**
	 * @swagger
	 * /cursos/{id}:
	 *   get:
	 *     summary: Exibe um curso específico
	 *     tags: [Cursos]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     responses:
	 *       200:
	 *         description: Dados do curso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Curso'
	 *       404:
	 *         description: Curso não encontrado
	 *       500:
	 *         description: Erro ao exibir curso
	 */

	async show(req, res) {
		try {
			const { id } = req.params;
			const cursos = await Cursos.findByPk(id); // Busca o curso pelo ID

			if (!cursos) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			return res.json(cursos);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Erro ao exibir curso" });
		}
	}

	/**
	 * @swagger
	 * /cursos:
	 *   post:
	 *     summary: Cria um novo curso
	 *     tags: [Cursos]
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CursoInput'
	 *     responses:
	 *       201:
	 *         description: Curso criado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Curso'
	 *       400:
	 *         description: Já existe um curso com este título
	 *       500:
	 *         description: Erro ao criar curso
	 */

	async store(req, res) {
		try {
			const schema = Yup.object().shape({
				title: Yup.string().required(),
				description: Yup.string(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { title, description } = req.body;

			const cursoExists = await Cursos.findOne({ where: { title } }); // Verifica se já existe um curso com o mesmo título

			if (cursoExists) {
				return res
					.status(400)
					.json({ error: "Já existe um curso com este título" });
			}

			const cursos = await Cursos.create({ title, description });

			return res.status(201).json(cursos);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			console.error(error);
			return res.status(500).json({ error: "Erro ao criar curso" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				title: Yup.string(),
				description: Yup.string(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { id } = req.params;
			const cursos = await Cursos.findByPk(id);

			if (!cursos) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			const { title, description } = req.body;

			// Verifica se o novo título já existe em outro curso
			if (title && title !== cursos.title) {
				const cursoExists = await Cursos.findOne({ where: { title } });
				if (cursoExists) {
					return res
						.status(400)
						.json({ error: "Já existe um curso com este título" });
				}
			}

			await cursos.update({ title, description });

			return res.status(200).json(cursos);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			console.error(error);
			return res.status(500).json({ error: "Erro ao atualizar curso" });
		}
	}

	/**
	 * @swagger
	 * /cursos/{id}:
	 *   delete:
	 *     summary: Exclui um curso
	 *     tags: [Cursos]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         schema:
	 *           type: integer
	 *         required: true
	 *         description: ID do curso
	 *     responses:
	 *       204:
	 *         description: Curso excluído com sucesso
	 *       404:
	 *         description: Curso não encontrado
	 *       500:
	 *         description: Erro ao excluir curso
	 */

	async delete(req, res) {
		try {
			const { id } = req.params;
			const cursos = await Cursos.findByPk(id);

			if (!cursos) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			await cursos.destroy();

			return res.status(204).send();
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Erro ao excluir curso" });
		}
	}
}

export default new CursoController();
