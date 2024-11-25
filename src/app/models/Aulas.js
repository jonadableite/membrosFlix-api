import { DataTypes, Model } from "sequelize";

/**
 * Modelo representando uma aula.
 */
class Aula extends Model {
	/**
	 * Inicializa o modelo Aula.
	 * @param {Sequelize} sequelize - Instância do Sequelize.
	 * @returns {Model} O modelo Aula inicializado.
	 */
	static init(sequelize) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		super.init(
			{
				name: {
					type: DataTypes.STRING,
					allowNull: false, // Torna o nome obrigatório
				},
				description: DataTypes.TEXT,
				duration: {
					type: DataTypes.INTEGER,
					allowNull: false, // Torna a duração obrigatória
				},
				path: {
					type: DataTypes.STRING,
					allowNull: false, // Torna o caminho obrigatório
				},
				courseId: {
					type: DataTypes.INTEGER,
					field: "course_id", // Nome da coluna na tabela
					references: {
						model: "Cursos",
						key: "id",
					},
					onUpdate: "CASCADE",
					onDelete: "SET NULL",
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: "aulas", // Define explicitamente o nome da tabela
			},
		);

		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		return this;
	}

	/**
	 * Define o relacionamento com o modelo de Cursos.
	 * @param {Object} models - Objeto contendo todos os modelos.
	 */
	static associate(models) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.belongsTo(models.Curso, { foreignKey: "course_id", as: "curso" });
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.hasMany(models.UserProgress, { foreignKey: "aulaId", as: "progress" });
	}
}

export default Aula;
