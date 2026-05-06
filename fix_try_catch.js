const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// remove qualquer bloco quebrado de save-tags
code = code.replace(/fetch\('\/api\/save-tags'[\s\S]*?\)\s*;?/g, "");

// corrige o handleFinishSammyTraining inteiro
code = code.replace(
/const handleFinishSammyTraining = async \(\) => \{[\s\S]*?\};/,
`const handleFinishSammyTraining = async () => {
  if (isSammyLoading) return;
  setSavingHub(true);
  setIsSammyLoading(true);

  console.log("🔥 MODEL SLUG:", modelSlug);

  const userMsg = { 
    id: Date.now().toString(), 
    role: 'user', 
    content: '[SISTEMA]: A modelo clicou no botão "Finalizar Treinamento". Por favor, confirme.' 
  };

  const newMessages = [...sammyMessages, userMsg];
  setSammyMessages(newMessages);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, modelSlug })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Erro de conexão.");

    setSammyMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'assistant', content: data.text }
    ]);

    // ✅ SAVE TAGS (CORRETO)
    fetch('/api/save-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...newMessages, { role: 'assistant', content: data.text }],
        modelSlug: modelSlug
      })
    })
    .then(() => console.log("✅ TAGS SALVAS"))
    .catch(err => console.error("❌ ERRO AO SALVAR TAGS:", err));

  } catch (error) {
    alert("❌ ALERTA DA SAMMY: " + error.message);
  } finally {
    setIsSammyLoading(false);
    setSavingHub(false);
  }
};`
);

fs.writeFileSync(path, code);
console.log("✅ FUNÇÃO CORRIGIDA!");
