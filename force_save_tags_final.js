const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// remove qualquer tentativa antiga quebrada
code = code.replace(/fetch\('\/api\/save-tags'[\s\S]*?\);/g, "");

// injeta dentro do handleFinishSammyTraining
code = code.replace(
  'setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: \'assistant\', content: data.text }]);',
  `setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);

      // 🔥 SALVAR TAGS AUTOMATICAMENTE
      fetch('/api/save-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...newMessages, { role: 'assistant', content: data.text }],
          modelSlug: modelSlug 
        })
      })
      .then(() => console.log("✅ TAGS SALVAS"))
      .catch(err => console.error("❌ ERRO AO SALVAR TAGS:", err));`
);

fs.writeFileSync(path, code);
console.log("✅ SAVE-TAGS FORÇADO COM SUCESSO!");
