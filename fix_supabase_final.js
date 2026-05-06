const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Localiza a linha errada que adicionava %22 e substitui pela junção limpa de UUIDs
const badLine = "const mediaIdsStr = validMediaIds.map(id => `%22${id}%22`).join(',');";
const goodLine = "const mediaIdsStr = validMediaIds.join(',');";

if (code.includes(badLine)) {
    code = code.replace(badLine, goodLine);
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Erro 400 Corrigido: Aspas removidas dos UUIDs no Supabase.");
} else {
    // Fallback caso a linha esteja ligeiramente diferente
    code = code.replace(/validMediaIds\.map\(id => [^)]+\)\.join\(\',\’\)/g, "validMediaIds.join(',')");
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Erro 400 Corrigido via Fallback.");
}
