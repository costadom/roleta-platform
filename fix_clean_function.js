const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// REMOVE COMPLETAMENTE A FUNÇÃO ANTIGA
code = code.replace(
/const handleFinishSammyTraining = async \(\) => \{[\s\S]*?\};/,
''
);

// INSERE FUNÇÃO NOVA LIMPA
const novaFuncao = `
const handleFinishSammyTraining = async () => {
  if (isSammyLoading) return;

  setSavingHub(true);
  setIsSammyLoading(true);

  console.log("🔥 MODEL SLUG:", modelSlug);

  const userMsg = {
    id: Date.now().toString(),
    role: 'user',
    content: '[SISTEMA]: Finalizar Treinamento'
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

    if (!res.ok || data.error) {
      throw new Error(data.error || "Erro na IA");
    }

    setSammyMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.text
      }
    ]);

    // ✅ SALVAR TAGS
    await fetch('/api/save-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...newMessages, { role: 'assistant', content: data.text }],
        modelSlug
      })
    });

    console.log("✅ TAGS SALVAS");

  } catch (error) {
    console.error(error);
    alert("Erro ao finalizar treinamento");
  } finally {
    setIsSammyLoading(false);
    setSavingHub(false);
  }
};
`;

// INSERE ANTES DO useEffect (posição segura)
code = code.replace(
'useEffect(() => {',
novaFuncao + '\nuseEffect(() => {'
);

fs.writeFileSync(path, code);
console.log("✅ FUNÇÃO RESETADA COM SUCESSO!");
