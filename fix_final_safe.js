const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// REMOVE QUALQUER BLOCO QUEBRADO DE save-tags
code = code.replace(/\/\/ 🔥 SALVAR TAGS AUTOMATICAMENTE[\s\S]*?console\.error\([^\)]*\);/g, '');

// GARANTE INSERÇÃO NO LUGAR CERTO (DENTRO DO TRY)
code = code.replace(
`setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);`,
`setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);

      // ✅ SALVAR TAGS EM BACKGROUND (SEGURO)
      fetch('/api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...newMessages, { role: 'assistant', content: data.text }],
          modelSlug: modelSlug 
        })
      }).catch(() => {});`
);

fs.writeFileSync(path, code);
console.log("✅ CORREÇÃO FINAL APLICADA COM SUCESSO");
