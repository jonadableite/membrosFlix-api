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
      
      // Adicionar .js a imports relativos (../ ou ./)
      content = content.replace(/from ['"](\.\.[\/][^'"]+)['"]/g, "from '$1.js'");
      content = content.replace(/from ['"](\.[\/][^'"]+)['"]/g, "from '$1.js'");
      
      // Remover .js.js duplicado
      content = content.replace(/\.js\.js/g, '.js');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${fullPath}`);
    }
  }
}

console.log('🔧 Adicionando extensões .js aos imports...\n');
addJsExtensions(path.join(__dirname, 'src'));
console.log('\n✅ Concluído!');

