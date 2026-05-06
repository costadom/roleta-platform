const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Procura onde os IDs estão sendo juntados com vírgula e aplica as aspas codificadas (%22)
// Troca de: .join(',') PARA: .map(id => '%22' + id + '%22').join(',')
const regexFix = /const mediaIdsStr = ([a-zA-Z0-9_]+)\.join\(\s*['"]\,['"]\s*\);/g;

if (regexFix.test(code)) {
    code = code.replace(regexFix, "const mediaIdsStr = $1.map(id => '%22' + id + '%22').join(',');");
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Erro 400 do Supabase corrigido (URL Encoding aplicado).");
} else {
    console.log("⚠️ Padrão de código não encontrado, mas pode já estar corrigido.");
}
