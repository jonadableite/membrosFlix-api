// src/config/database.js
module.exports = {
	dialect: "postgres",
	host: "localhost",
	port: 5432,
	username: "postgres",
	password: "postgres",
	database: "membrosflix",
	define: {
		timestamps: true,
		underscored: true,
		underscoredAll: true,
	},
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	logging: console.log,
	timezone: "America/Sao_Paulo",
};
