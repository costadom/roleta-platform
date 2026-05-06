const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// encontra o ponto EXATO depois da resposta da IA
const target = `setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);`;

if (!code.includes(target)) {
  console.log("❌ Ponto não encontrado. Nada alterado.");
  process.exit(1);
}

// evita duplicar
if (code.includes('/api/save-tags')) {
  console.log("⚠️ Já existe save-tags. Abortando.");
  process.exit(0);
}

// adiciona logo abaixo (posição segura dentro do try)
const patched = target + `

      // ✅ salvar tags automático (background)
      fetch('/api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...newMessages, { role: 'assistant', content: data.text }],
          modelSlug: modelSlug
        })
      }).catch(() => {});`;

code = code.replace(target, patched);

fs.writeFileSync(path, code);

console.log("✅ PATCH SEGURO APLICADO");
