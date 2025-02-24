import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

function prismaClientSingleton() {
	return new PrismaClient().$extends({
		query: {
			$allOperations({ operation, model, args, query }) {
				const start = Date.now();
				return query(args).finally(() => {
					const end = Date.now();
					logger.log(`${model}.${operation} took ${end - start}ms`);
				});
			},
		},
	});
}

const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
