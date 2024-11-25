import { DataTypes, Model } from "sequelize";
import Aula from "./Aulas";
import UserProgress from "./UserProgress";

class Curso extends Model {
	static init(sequelize) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		super.init(
			{
				title: DataTypes.STRING,
				description: DataTypes.TEXT,
				path: DataTypes.STRING,
			},
			{
				sequelize,
			},
		);

		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		return this;
	}

	static associate(models) {
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.hasMany(models.UserProgress, {
			foreignKey: "courseId",
			as: "progress",
			targetKey: "id", // Adicionado targetKey explicitamente
		});
		// biome-ignore lint/complexity/noThisInStatic: <explanation>
		this.hasMany(models.Aula, { foreignKey: "course_id", as: "aulas" });
	}
}

export default Curso;
