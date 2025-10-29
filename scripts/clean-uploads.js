#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "..", "uploads");

console.log("🧹 Limpando pasta uploads...");

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    fs.unlinkSync(filePath);
    console.log(`  ❌ Removido: ${file}`);
  }

  console.log(`✅ ${files.length} arquivo(s) removido(s)`);
} else {
  console.log("⚠️ Pasta uploads não encontrada");
}

console.log("✅ Limpeza concluída!");
