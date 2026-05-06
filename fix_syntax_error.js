const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Corrige o padrão quebrado: }); \n } catch
code = code.replace(/\}\);\s*\n\s*\}\s*catch/g, `})
      } catch`);

fs.writeFileSync(path, code);

console.log("✅ ERRO DE SINTAXE CORRIGIDO");
