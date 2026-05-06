const fs = require('fs');

// A. Conserta o Cérebro da Sammy (route.ts)
let apiCode = fs.readFileSync('app/api/chat/route.ts', 'utf8');
apiCode = apiCode.replace(/gemini-1\.5-flash/g, 'gemini-1.5-pro');
fs.writeFileSync('app/api/chat/route.ts', apiCode);

// B. Conserta o Erro 400 no Banco de Dados (page.tsx)
let pageCode = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const oldMediaIds = /const mediaIds = allMediaItems\.map\(m => m\.id \|\| m\.photo_url\);/;
const newMediaIds = `const mediaIds = recentMedias.map(m => m.id).filter(Boolean);`;
pageCode = pageCode.replace(oldMediaIds, newMediaIds);

fs.writeFileSync('app/admin/dashboard/page.tsx', pageCode);
console.log("✅ Cérebro atualizado para PRO e Banco de Dados corrigido!");
