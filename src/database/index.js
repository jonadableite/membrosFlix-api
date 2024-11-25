import { Sequelize } from "sequelize";
import configDatabase from "../config/database";

import Aula from "../app/models/Aulas"; // Nome corrigido (singular)
import Curso from "../app/models/Cursos"; // Nome corrigido (singular)
import User from "../app/models/User";
import UserProgress from "../app/models/UserProgress"; // Importar o modelo UserProgress

const models = [User, Curso, Aula, UserProgress]; // Adicionar UserProgress aos modelos

class Database {
	constructor() {
		this.init();
	}

	init() {
		this.connection = new Sequelize(configDatabase);

		models
			.map((model) => model.init(this.connection))
			.map(
				// biome-ignore lint/complexity/useOptionalChain: <explanation>
				(model) => model.associate && model.associate(this.connection.models),
			); // Chamar o método associate
	}
}

export default new Database();
