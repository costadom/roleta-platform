const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Localiza o evento onKeyDown e modifica a lógica
const oldHandler = `onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            handleSammySubmit(e);
                          }
                        }}`;

const newHandler = `onKeyDown={(e) => {
                          // Enter agora apenas pula linha. 
                          // O envio fica restrito ao clique no botão.
                          if (e.key === 'Enter' && !e.shiftKey) {
                            return; 
                          }
                        }}`;

if (code.includes(oldHandler)) {
    code = code.replace(oldHandler, newHandler);
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Tecla Enter configurada para quebra de linha.");
} else {
    console.log("⚠️ Handler de tecla não encontrado ou já alterado.");
}
