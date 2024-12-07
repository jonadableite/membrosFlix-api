// src/app/controllers/CursosController.js

import * as Yup from "yup";
import logger from "../../../utils/logger";
import * as cursoService from "../services/cursoService";

class CursoController {
	async index(req, res) {
		try {
			const cursos = await cursoService.listCursos();
			return res.json(cursos);
		} catch (error) {
			logger.error("Erro ao listar cursos:", error.message);
			return res.status(500).json({ error: "Erro ao listar cursos" });
		}
	}

	async show(req, res) {
		try {
			const { id } = req.params;
			const curso = await cursoService.getCurso(id);

			if (!curso) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			return res.json(curso);
		} catch (error) {
			logger.error("Erro ao exibir curso:", error.message);
			return res.status(500).json({ error: "Erro ao exibir curso" });
		}
	}

	async store(req, res) {
		try {
			const schema = Yup.object().shape({
				title: Yup.string().required("O título do curso é obrigatório"),
				description: Yup.string().nullable(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const curso = await cursoService.createCurso(req.body, req.file);
			return res.status(201).json(curso);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao criar curso:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao criar curso:", error.message);
			return res.status(500).json({ error: "Erro ao criar curso" });
		}
	}

	async update(req, res) {
		try {
			const schema = Yup.object().shape({
				title: Yup.string(),
				description: Yup.string().nullable(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const { id } = req.params;
			const updatedCurso = await cursoService.updateCurso(
				id,
				req.body,
				req.file,
			);

			if (!updatedCurso) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			return res.status(200).json(updatedCurso);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				logger.error("Erro de validação ao atualizar curso:", error.errors);
				return res.status(400).json({ errors: error.errors });
			}
			logger.error("Erro ao atualizar curso:", error.message);
			return res.status(500).json({ error: "Erro ao atualizar curso" });
		}
	}

	async delete(req, res) {
		try {
			const { id } = req.params;
			const deleted = await cursoService.deleteCurso(id);

			if (!deleted) {
				return res.status(404).json({ error: "Curso não encontrado" });
			}

			return res.status(204).send();
		} catch (error) {
			logger.error("Erro ao excluir curso:", error.message);
			return res.status(500).json({ error: "Erro ao excluir curso" });
		}
	}
}

export default new CursoController();
