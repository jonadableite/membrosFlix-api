import { minioClient } from "../src/modules/uploads/lib/minio.client";

/**
 * Script para atualizar políticas de acesso dos buckets MinIO
 * Torna todos os buckets públicos para leitura (GetObject)
 */
async function fixMinioPolicies() {
  const buckets = [
    "curso-thumbnails",
    "curso-videos",
    "aula-videos",
    "aula-thumbnails",
    "materials",
  ];

  console.log("🔧 Atualizando políticas dos buckets MinIO...\n");

  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        console.log(`⚠️  Bucket ${bucketName} não existe, pulando...`);
        continue;
      }

      // Set public read-only policy
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

      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ Política pública aplicada: ${bucketName}`);
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar ${bucketName}:`, error.message);
    }
  }

  console.log("\n🎉 Políticas atualizadas com sucesso!");
  console.log("📝 Todos os buckets agora permitem leitura pública (GetObject)");
  process.exit(0);
}

fixMinioPolicies().catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
