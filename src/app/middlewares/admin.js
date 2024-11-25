// src/app/middlewares/admin.js
export default function adminMiddleware(req, res, next) {
	if (!req.user.admin) {
		return res.status(403).json({
			error: "Acesso negado. Somente administradores podem realizar esta ação.",
		});
	}
	next();
}
