// src/config/multer.js
import { extname, resolve } from "node:path";

import multer from "multer";
import { v4 } from "uuid";

/**
 * Configurações do Multer para upload de arquivos.
 */
export default {
	storage: multer.diskStorage({
		destination: resolve(__dirname, "..", "..", "uploads"),
		filename: (request, file, callback) => {
			callback(null, v4() + extname(file.originalname));
		},
	}),
};
