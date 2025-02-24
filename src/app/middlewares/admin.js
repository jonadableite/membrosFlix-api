import logger from "../../../utils/logger.js";
export default function adminMiddleware(req, res, next) {
	const adminLogger = logger.setContext("AdminMiddleware");
	adminLogger.log(req.user);
	if (req.user && req.user.role === "ADMIN") {
		return next();
	}
	return res.status(403).json({
		error: "Acesso negado. Somente administradores podem realizar esta ação.",
	});
}
