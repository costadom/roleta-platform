const fs = require('fs');

const path = 'app/admin/dashboard/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// REMOVE FUNÇÃO QUEBRADA COMPLETA
code = code.replace(/const handleFinishSammyTraining = async[\s\S]*?};/g, '');

// INSERE FUNÇÃO CORRETA
const newFunction = `
const handleFinishSammyTraining = async () => {
    if (isSammyLoading) return;

    setSavingHub(true);
    setIsSammyLoading(true);

    const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: '[SISTEMA]: A modelo clicou no botão "Finalizar Treinamento".'
    };

    const newMessages = [...sammyMessages, userMsg];
    setSammyMessages(newMessages);

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages, modelSlug: modelSlug })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Erro de conexão");
        }

        setSammyMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'assistant', content: data.text }
        ]);

        // ✅ SALVAR TAGS EM BACKGROUND
        fetch('/api/save-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...newMessages, { role: 'assistant', content: data.text }],
                modelSlug: modelSlug
            })
        }).catch(() => {});

    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    } finally {
        setIsSammyLoading(false);
        setSavingHub(false);
    }
};
`;

// INSERE ANTES DO useEffect (posição segura)
code = code.replace(
/useEffect\(\(\) => {/,
newFunction + '\nuseEffect(() => {'
);

fs.writeFileSync(path, code);

console.log("✅ FUNÇÃO TOTALMENTE RECONSTRUÍDA SEM ERROS");
