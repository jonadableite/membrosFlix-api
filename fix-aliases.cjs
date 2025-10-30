const fs = require('fs');
const path = require('path');

// Mapa de aliases para caminhos relativos baseado na profundidade
const getRelativePath = (fromFile, alias) => {
  const fromDir = path.dirname(fromFile);
  const srcDir = path.join(__dirname, 'src');
  
  // Calcular níveis de profundidade
  const relativePath = path.relative(fromDir, srcDir);
  const levels = relativePath.split(path.sep).filter(p => p === '..').length;
  const prefix = levels > 0 ? '../'.repeat(levels) : './';
  
  // Remover @/ e adicionar prefixo correto
  return alias.replace('@/', prefix);
};

function fixAliases(dir, rootSrc = dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixAliases(fullPath, rootSrc);
    } else if (file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Substituir imports com @/
      const newContent = content.replace(/from ['"]@\/([^'"]+)['"]/g, (match, p1) => {
        modified = true;
        const relative = getRelativePath(fullPath, '@/' + p1);
        return `from '${relative}.js'`;
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`✅ Fixed: ${path.relative(rootSrc, fullPath)}`);
      }
    }
  }
}

console.log('🔧 Convertendo path aliases (@/) para caminhos relativos...\n');
const srcPath = path.join(__dirname, 'src');
fixAliases(srcPath, srcPath);
console.log('\n✅ Concluído!');

