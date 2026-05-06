const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Evita duplicar
if (code.includes("Tags enviadas para o Supabase")) {
  console.log("⚠️ Já parece corrigido. Abortando.");
  process.exit(0);
}

// Injeta o fetch logo após setSammyMessages no finalizar
code = code.replace(
  /setSammyMessages\(prev => \[\.\.\.prev, \{ id: Date\.now\(\)\.toString\(\), role: 'assistant', content: data\.text \}]\);/,
  `setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);

      // 🔥 Salvando tags no Supabase
      fetch('/api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...newMessages, { role: 'assistant', content: data.text }],
          modelSlug: modelSlug
        })
      }).then(() => {
        console.log("✅ Tags enviadas para o Supabase");
      }).catch(err => {
        console.error("❌ Erro ao salvar tags:", err);
      });`
);

fs.writeFileSync(path, code);
console.log("✅ Frontend corrigido com sucesso!");
