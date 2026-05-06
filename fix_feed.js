const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Tira as aspas da junção dos IDs
code = code.replace(/const mediaIdsStr = mediaIds\.join\('","'\);/g, "const mediaIdsStr = mediaIds.join(',');");
// Tira as aspas da chamada do banco de dados
code = code.replace(/in\.\("\\\$\{mediaIdsStr\}\"\)/g, "in.(${mediaIdsStr})");

fs.writeFileSync('app/admin/dashboard/page.tsx', code);
