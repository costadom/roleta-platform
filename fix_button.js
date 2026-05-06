const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Adiciona a chamada oculta à nossa nova rota de salvar tags no evento de finalizar treinamento
const oldLogic = `// Aqui você pode adicionar lógica adicional ao finalizar`;
const newLogic = `
      // Extração Oculta para o Supabase
      try {
        await fetch('/api/save-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, modelSlug })
        });
        console.log("Tags salvas no Supabase com sucesso!");
      } catch (err) {
        console.error("Erro ao salvar tags no banco:", err);
      }
`;

if (code.includes('Finalizar Treinamento')) {
    // Procura uma área comum no handler do botão para inserir o fetch (Isso assume que você tem um handler pro botão)
    // Se o código for muito complexo, essa injeção bruta funciona se houver um bloco try/catch do envio da mensagem.
    code = code.replace(/setMessages\(\[...newMessages, \{ role: 'user', content: "\[SISTEMA\] Finalizar Treinamento" \}\]\);/g, 
    `setMessages([...newMessages, { role: 'user', content: "[SISTEMA] Finalizar Treinamento" }]);\n${newLogic}`);
    
    fs.writeFileSync('app/admin/dashboard/page.tsx', code);
    console.log("✅ Gatilho do Supabase injetado no botão!");
}
