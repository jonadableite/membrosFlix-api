# Script para remover arquivo NUL no Windows
# Execute: powershell -ExecutionPolicy Bypass -File fix-nul.ps1

Write-Host "🔧 Removendo arquivo NUL..."

# Tentar remover usando cmd do Windows
cmd /c "del NUL 2>nul" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Não foi possível remover NUL (pode ser um device file do Windows)"
}

# Tentar através do Git
git rm --cached NUL 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ NUL removido do índice do Git"
} else {
    Write-Host "ℹ️ NUL não estava no índice do Git"
}

# Adicionar .gitignore e .gitattributes
git add .gitignore .gitattributes

Write-Host "✅ Arquivos de configuração adicionados"
Write-Host ""
Write-Host "📝 Próximos passos:"
Write-Host "1. Execute: git add ."
Write-Host "2. Execute: git commit -m 'fix: remover arquivo NUL e configurar line endings'"
Write-Host "3. Execute: git push"

