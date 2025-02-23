//src/hooks/useCourseProgress.js
import { useEffect, useState } from "react";
import io from "socket.io-client";
import logger from "../../utils/logger";
import api from "../services/api";

function useCourseProgress(courseId, aulaId, userId) {
	const [progress, setProgress] = useState(0);
	const [notifications, setNotifications] = useState([]);
	const [socket, setSocket] = useState(null);

	useEffect(() => {
		// Conectar ao WebSocket
		const newSocket = io("http://localhost:3001", {
			query: { userId },
		});

		setSocket(newSocket);

		// Eventos de socket
		newSocket.on("connect", () => {
			const hooksLogger = logger.setContext("hooks");
			hooksLogger.log("Conectado ao WebSocket");
			newSocket.emit("authenticate", userId);
		});

		newSocket.on("progressUpdated", (data) => {
			if (data.userId === userId && data.courseId === courseId) {
				setProgress(data.progress);

				// Adicionar notificação
				setNotifications((prev) => [
					...prev,
					{
						type: "PROGRESS",
						message: `Progresso atualizado para ${data.progress}%`,
					},
				]);
			}
		});

		// Limpar conexão
		return () => {
			newSocket.disconnect();
		};
	}, [userId, courseId]);

	const updateProgress = async (newProgress) => {
		try {
			// Emitir evento de progresso via socket
			socket.emit("updateProgress", {
				userId,
				courseId,
				aulaId,
				progress: newProgress,
			});

			// Opcional: chamada de API para persistência
			await api.post("/progress", {
				courseId,
				aulaId,
				progress: newProgress,
			});

			setProgress(newProgress);
		} catch (error) {
			hooksLogger.error("Erro ao atualizar progresso", error);
		}
	};

	return {
		progress,
		updateProgress,
		notifications,
		socket,
	};
}

export default useCourseProgress;
