const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('/api/save-tags')) {
  console.log("⚠️ Já existe chamada de save-tags. Abortando.");
  process.exit(0);
}

code = code.replace(
  'setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: \'assistant\', content: data.text }]);',
  `setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);

      fetch('/api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...newMessages, { role: 'assistant', content: data.text }],
          modelSlug: modelSlug 
        })
      }).catch(err => console.error("Erro ao salvar tags:", err));`
);

fs.writeFileSync(path, code);
console.log("✅ Save-tags conectado!");
