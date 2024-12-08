// src/config/minioClient.js
import { Client } from "minio";

const minioClient = new Client({
	endPoint: process.env.MINIO_SERVER_URL.replace("https://", "").replace(
		":443",
		"",
	),
	useSSL: true,
	accessKey: process.env.MINIO_ROOT_USER,
	secretKey: process.env.MINIO_ROOT_PASSWORD,
	region: process.env.MINIO_REGION,
});

export default minioClient;
