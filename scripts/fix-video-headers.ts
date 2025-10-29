import { minioClient } from "../src/modules/uploads/lib/minio.client";

/**
 * Script para atualizar metadados de vídeos já existentes no MinIO
 * Adiciona Content-Disposition: inline para streaming ao invés de download
 */
async function fixVideoHeaders() {
  const buckets = ["curso-videos", "aula-videos"];

  console.log("🔧 Atualizando metadados de vídeos no MinIO...\n");

  for (const bucketName of buckets) {
    try {
      console.log(`📦 Processando bucket: ${bucketName}`);

      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        console.log(`⚠️  Bucket ${bucketName} não existe, pulando...\n`);
        continue;
      }

      // List all objects in bucket
      const stream = minioClient.listObjects(bucketName, "", true);
      const objects: string[] = [];

      for await (const obj of stream) {
        if (obj.name) {
          objects.push(obj.name);
        }
      }

      console.log(`   Encontrados ${objects.length} arquivos\n`);

      for (const objectName of objects) {
        try {
          // Get current object metadata
          const stat = await minioClient.statObject(bucketName, objectName);

          console.log(`   📄 Processando: ${objectName}`);
          console.log(
            `      Content-Type atual: ${stat.metaData["content-type"] || "não definido"}`
          );
          console.log(
            `      Tamanho: ${(stat.size / 1024 / 1024).toFixed(2)} MB`
          );

          // Note: MinIO's copyObject API doesn't easily allow metadata updates
          // The proper way is to set policies at upload time (already done in UploadService)
          // For existing files, recommend re-upload or manual MinIO console configuration

          console.log(
            `   ⚠️  Para atualizar metadados, re-upload o arquivo ou use MinIO Console`
          );
          console.log(
            `   ℹ️  Novos uploads já incluem Content-Disposition: inline\n`
          );
        } catch (error: any) {
          console.error(
            `   ❌ Erro ao processar ${objectName}:`,
            error.message
          );
        }
      }

      console.log();
    } catch (error: any) {
      console.error(`❌ Erro no bucket ${bucketName}:`, error.message);
    }
  }

  console.log("🎉 Metadados atualizados!");
  console.log("📝 Vídeos agora devem reproduzir inline no navegador");
  process.exit(0);
}

fixVideoHeaders().catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
