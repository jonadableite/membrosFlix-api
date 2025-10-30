const fs = require('fs');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      addJsExtensions(fullPath);
    } else if (file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Adicionar .js a imports relativos que ainda não têm
      const newContent = content.replace(/from ['"](\.\.[\/][^'"]+)(?<!\.js)['"]/g, (match, p1) => {
        modified = true;
        return `from '${p1}.js'`;
      }).replace(/from ['"](\.[\/][^'"]+)(?<!\.js)['"]/g, (match, p1) => {
        modified = true;
        return `from '${p1}.js'`;
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`✅ Fixed: ${file.name}`);
      }
    }
  }
}

console.log('🔧 Adicionando extensões .js aos imports...\n');
addJsExtensions(path.join(__dirname, 'src'));
console.log('\n✅ Concluído!');

