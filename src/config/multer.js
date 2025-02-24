import multer from "multer";
import fs from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuidv4 } from "uuid";

// Obter o caminho do arquivo atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const uploadDirectory = resolve(__dirname, "..", "..", "uploads");

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
		const allowedTypes = /jpeg|jpg|png|mp4|avi|mkv/;
		const mimeType = allowedTypes.test(file.mimetype);
		const extName = allowedTypes.test(extname(file.originalname).toLowerCase());

		if (mimeType && extName) {
			return callback(null, true);
		}
		callback(new Error("Tipo de arquivo não suportado"));
	},
	fields: [
		{ name: "file", maxCount: 1 },
		{ name: "thumbnail", maxCount: 1 },
	],
};
