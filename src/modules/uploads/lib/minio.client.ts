import { Client } from "minio";

// Create and export a shared MinIO client instance
const endPoint = process.env.MINIO_ENDPOINT || "minioapi.whatlead.com.br";
const port = Number.parseInt(process.env.MINIO_PORT || "443", 10);
const useSSL = (process.env.MINIO_USE_SSL || "true").toLowerCase() === "true";
const accessKey = process.env.MINIO_ACCESS_KEY || "";
const secretKey = process.env.MINIO_SECRET_KEY || "";

export const minioClient = new Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey,
});

// Default buckets used across the application
const defaultBuckets = [
  "curso-videos",
  "curso-thumbnails",
  "aula-videos",
  "aula-thumbnails",
  "materials",
];

/**
 * Ensure MinIO buckets exist and apply a public read policy for object access.
 * Safely continues if operations fail; logs errors for observability.
 */
export async function initializeMinIOBuckets(
  buckets: string[] = defaultBuckets
): Promise<void> {
  try {
    for (const bucketName of buckets) {
      try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
          await minioClient.makeBucket(bucketName, "us-east-1");
        }

        // Apply public read-only policy (GetObject)
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };

        try {
          await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        } catch (policyError) {
          // Not all MinIO setups allow setting policy via client; log and continue
          console.warn(
            `MinIO: failed to set bucket policy for ${bucketName}. Continuing...`,
            policyError
          );
        }
      } catch (bucketError) {
        console.warn(
          `MinIO: bucket initialization failed for ${bucketName}.`,
          bucketError
        );
      }
    }
  } catch (error) {
    // Bubble up to caller; server startup will catch and log
    throw error;
  }
}

export default minioClient;
