module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("aulas", {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			duration: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			path: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			course_id: {
				type: Sequelize.INTEGER,
				references: {
					model: "cursos",
					key: "id",
				},
				onUpdate: "CASCADE",
				onDelete: "SET NULL",
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
		});
	},

	async down(queryInterface) {
		await queryInterface.removeConstraint("aulas", "aulas_course_id_fkey"); // Remova a restrição explicitamente
		await queryInterface.dropTable("aulas");
	},
};
