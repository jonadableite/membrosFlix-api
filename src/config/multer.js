import fs from "fs";
import multer from "multer";
import { extname, resolve } from "node:path";
import { v4 as uuidv4 } from "uuid";

/**
 * Configurações do Multer para upload de arquivos.
 */
const uploadDirectory = resolve(__dirname, "..", "..", "uploads");

// Verifica se o diretório de upload existe, caso contrário, cria-o
if (!fs.existsSync(uploadDirectory)) {
	fs.mkdirSync(uploadDirectory, { recursive: true });
}

export default {
	storage: multer.diskStorage({
		destination: (req, file, callback) => {
			callback(null, uploadDirectory);
		},
		filename: (req, file, callback) => {
			const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
			callback(null, uniqueName);
		},
	}),

	fileFilter: (req, file, callback) => {
		// Adiciona 'pdf' aos tipos permitidos
		const allowedTypes = /jpeg|jpg|png|mp4|pdf/;
		const mimeType = allowedTypes.test(file.mimetype);
		const extName = allowedTypes.test(extname(file.originalname).toLowerCase());

		if (mimeType && extName) {
			return callback(null, true);
		}
		callback(new Error("Tipo de arquivo não suportado"));
	},
};
