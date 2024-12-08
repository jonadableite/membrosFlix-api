import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createComment(data) {
	try {
		const {
			content,
			userId,
			aulaId,
			cursoId,
			parentId,
			isAnonymous = false,
		} = data;

		// Verifica se o conteúdo do comentário é válido
		if (!content || content.trim() === "") {
			throw new Error("O conteúdo do comentário não pode estar vazio.");
		}

		// Verifica se o usuário existe
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!userExists) {
			throw new Error("Usuário não encontrado");
		}

		// Verifica se a aula ou curso existe
		if (aulaId) {
			const aulaExists = await prisma.aula.findUnique({
				where: { id: Number(aulaId) },
			});
			if (!aulaExists) {
				throw new Error("Aula não encontrada");
			}
		}

		if (cursoId) {
			const cursoExists = await prisma.curso.findUnique({
				where: { id: Number(cursoId) },
			});
			if (!cursoExists) {
				throw new Error("Curso não encontrado");
			}
		}

		// Verifica se o comentário pai existe, se fornecido
		if (parentId) {
			const parentCommentExists = await prisma.comment.findUnique({
				where: { id: parentId },
			});
			if (!parentCommentExists) {
				throw new Error("Comentário pai não encontrado");
			}
		}

		const comment = await prisma.comment.create({
			data: {
				content,
				userId,
				aulaId: aulaId ? Number(aulaId) : null,
				cursoId: cursoId ? Number(cursoId) : null,
				parentId,
				isAnonymous,
				// Se for uma resposta, incrementa o contador de respostas do comentário pai
				...(parentId && {
					parent: {
						update: {
							repliesCount: { increment: 1 },
						},
					},
				}),
			},
			include: {
				user: true,
				_count: {
					select: { likes: true },
				},
			},
		});

		return {
			...comment,
			likesCount: comment._count.likes,
			user: isAnonymous ? { name: "Anônimo" } : comment.user,
		};
	} catch (error) {
		console.error("Erro ao criar comentário:", error.message);
		throw new Error("Erro ao criar comentário");
	}
}

export async function listComments(courseId, lessonId) {
	try {
		const comments = await prisma.comment.findMany({
			where: {
				aulaId: Number(lessonId),
				cursoId: Number(courseId),
				parentId: null,
			},
			include: {
				user: true,
				replies: {
					include: {
						user: true,
						_count: {
							select: { likes: true },
						},
					},
					orderBy: {
						createdAt: "asc",
					},
				},
				_count: {
					select: {
						likes: true,
						replies: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Transformar para incluir likesCount e repliesCount
		return comments.map((comment) => ({
			...comment,
			likesCount: comment._count.likes,
			repliesCount: comment._count.replies,
			user: comment.isAnonymous ? { name: "Anônimo" } : comment.user,
			replies: comment.replies.map((reply) => ({
				...reply,
				likesCount: reply._count?.likes || 0,
				user: reply.isAnonymous ? { name: "Anônimo" } : reply.user,
			})),
		}));
	} catch (error) {
		console.error("Erro ao listar comentários:", error.message);
		throw new Error("Erro ao listar comentários");
	}
}

export async function updateComment(commentId, content, userId) {
	try {
		// Verificar se o comentário existe e pertence ao usuário
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			throw new Error("Comentário não encontrado");
		}

		if (comment.userId !== userId) {
			throw new Error("Você não tem permissão para editar este comentário");
		}

		return await prisma.comment.update({
			where: { id: commentId },
			data: { content },
			include: {
				user: true,
			},
		});
	} catch (error) {
		console.error("Erro ao atualizar comentário:", error.message);
		throw new Error(error.message);
	}
}

export async function deleteComment(commentId, userId) {
	try {
		// Verificar se o comentário existe e pertence ao usuário
		const comment = await prisma.comment.findUnique({
			where: { id: commentId },
		});

		if (!comment) {
			throw new Error("Comentário não encontrado");
		}

		if (comment.userId !== userId) {
			throw new Error("Você não tem permissão para excluir este comentário");
		}

		// Se for uma resposta, decrementa o contador de respostas do comentário pai
		if (comment.parentId) {
			await prisma.comment.update({
				where: { id: comment.parentId },
				data: {
					repliesCount: { decrement: 1 },
				},
			});
		}

		await prisma.comment.delete({
			where: { id: commentId },
		});
	} catch (error) {
		console.error("Erro ao excluir comentário:", error.message);
		throw new Error(error.message);
	}
}

export async function getCommentById(commentId) {
	try {
		return await prisma.comment.findUnique({
			where: { id: commentId },
			include: {
				user: true,
			},
		});
	} catch (error) {
		console.error("Erro ao buscar comentário:", error.message);
		throw new Error("Erro ao buscar comentário");
	}
}

export async function listReplies(commentId) {
	try {
		return await prisma.comment.findMany({
			where: { parentId: commentId },
			include: {
				user: true,
				_count: {
					select: { likes: true },
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});
	} catch (error) {
		console.error("Erro ao listar respostas:", error.message);
		throw new Error("Erro ao listar respostas");
	}
}
