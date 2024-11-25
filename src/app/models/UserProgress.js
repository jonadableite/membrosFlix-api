// src/app/models/UserProgress.js
import Sequelize, { Model } from "sequelize";

class UserProgress extends Model {
	static init(sequelize) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		super.init(
			{
				userId: Sequelize.UUID, // ID do usuário
				courseId: Sequelize.INTEGER, // ID do curso
				aulaId: Sequelize.INTEGER, // ID da aula (opcional)
				progressoAula: Sequelize.INTEGER, // Progresso da aula em porcentagem (0-100) - opcional
				progressoCurso: Sequelize.INTEGER, // Progresso do curso em porcentagem (0-100)
				concluido: Sequelize.BOOLEAN, // Indica se o curso/aula foi concluído(a)
			},
			{
				sequelize,
				tableName: "users_progress", // Nome da tabela no banco de dados
			},
		);

		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		return this;
	}

	static associate(models) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.belongsTo(models.User, { foreignKey: "userId", as: "user" });
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.belongsTo(models.Curso, { foreignKey: "courseId", as: "curso" });
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.belongsTo(models.Aula, { foreignKey: "aulaId", as: "aula" });
	}
}

export default UserProgress;
