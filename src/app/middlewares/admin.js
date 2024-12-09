export default function adminMiddleware(req, res, next) {
	console.log(req.user); // Adicione isso para depurar
	if (req.user && req.user.role === "ADMIN") {
		return next();
	}
	return res.status(403).json({
		error: "Acesso negado. Somente administradores podem realizar esta ação.",
	});
}
