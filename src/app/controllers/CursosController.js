// src/app/controllers/CursosController.js

import * as cursoService from "../services/cursoService";
import * as Yup from "yup";
import logger from "../../../utils/logger";

class CursoController {
	async index(req, res) {
		try {
			const cursos = await cursoService.listCursos();
			return res.json(cursos);
		} catch (error) {
			logger.error(error);
			return res.status(500).json({ error: "Erro ao listar cursos" });
		}
	}

	async show(req, res) {
		try {
			const { id } = req.params;
			const curso = await cursoService.getCurso(id);
			return res.json(curso);
		} catch (error) {
			logger.error(error);
			return res.status(500).json({ error: "Erro ao exibir curso" });
		}
	}

	async store(req, res) {
		try {
			const schema = Yup.object().shape({
				title: Yup.string().required(),
				description: Yup.string(),
			});

			await schema.validate(req.body, { abortEarly: false });

			const curso = await cursoService.createCurso(req.body, req.file);
			return res.status(201).json(curso);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			logger.error(error);
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
			const updatedCurso = await cursoService.updateCurso(
				id,
				req.body,
				req.file,
			);
			return res.status(200).json(updatedCurso);
		} catch (error) {
			if (error instanceof Yup.ValidationError) {
				return res.status(400).json({ errors: error.errors });
			}
			logger.error(error);
			return res.status(500).json({ error: "Erro ao atualizar curso" });
		}
	}

	async delete(req, res) {
		try {
			const { id } = req.params;
			await cursoService.deleteCurso(id);
			return res.status(204).send();
		} catch (error) {
			logger.error(error);
			return res.status(500).json({ error: "Erro ao excluir curso" });
		}
	}
}

export default new CursoController();
