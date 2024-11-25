/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.removeColumn("aulas", "course_id");
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.addColumn("aulas", "course_id", {
			allowNull: true,
			type: Sequelize.INTEGER,
			references: {
				model: "cursos",
				key: "id",
			},
		});
	},
};
