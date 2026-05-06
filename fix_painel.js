const { execSync } = require('child_process');
const fs = require('fs');

let correctCode = '';
console.log("⏳ Buscando backup intacto do painel no Git...");
for (let i = 1; i <= 10; i++) {
    try {
        let code = execSync(`git show HEAD~${i}:app/admin/dashboard/page.tsx`).toString();
        // Garante que é a versão que possui a função de carregamento intacta
        if (code.includes('const loadData = async () => {')) {
            correctCode = code;
            console.log(`✅ Backup seguro encontrado e restaurado!`);
            break;
        }
    } catch(e) {}
}

if (!correctCode) {
    console.error("❌ Erro: Não achei o backup do código.");
    process.exit(1);
}

// Limpa imports velhos e bugados da Vercel
correctCode = correctCode.replace(/import\s+\{\s*useChat\s*\}\s+from\s+["'][^"']+["'];?/g, '');

// Substitui com matemática exata (sem Regex destrutivo)
const startIndex = correctCode.indexOf('const { messages: sammyMessages');
const endIndex = correctCode.indexOf('useEffect(() => {', startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("❌ Erro: Posição do código não encontrada.");
    process.exit(1);
}

const newSammyCode = `
  const [sammyMessages, setSammyMessages] = useState([
    { id: 'msg-1', role: 'assistant', content: \`Oi, eu sou a Sammy! 💅✨ Vi que você acabou de chegar...\\n\\nEu sou a sua nova assistente de IA. Meu trabalho aqui é vender seus conteúdos no automático lá na vitrine principal da LabzSexy!\\n\\nPra eu conseguir os melhores clientes pra você, preciso te conhecer melhor. Me conta: como é o seu estilo, seu corpo e o que você mais gosta de gravar? 🔥\` }
  ]);
  const [sammyInput, setSammyInput] = useState("");
  const [isSammyLoading, setIsSammyLoading] = useState(false);

  const handleSammySubmit = async (e?: any) => {
      if(e) e.preventDefault();
      if (!sammyInput?.trim() || isSammyLoading) return;
      
      const userMsg = { id: Date.now().toString(), role: 'user', content: sammyInput };
      const newMessages = [...sammyMessages, userMsg];
      
      setSammyMessages(newMessages);
      setSammyInput("");
      setIsSammyLoading(true);

      try {
          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: newMessages, modelSlug: modelSlug })
          });
          const data = await res.json();
          
          if (!res.ok || data.error) throw new Error(data.error || "A Chave da IA falhou.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
          alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
      }
  };

  const handleFinishSammyTraining = async () => {
      if (isSammyLoading) return;
      setSavingHub(true);
      setIsSammyLoading(true);

      const userMsg = { id: Date.now().toString(), role: 'user', content: '[SISTEMA]: A modelo clicou no botão "Finalizar Treinamento". Por favor, confirme para ela que você absorveu as informações e que o perfil dela está otimizado.' };
      const newMessages = [...sammyMessages, userMsg];
      setSammyMessages(newMessages);
      
      try {
          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: newMessages, modelSlug: modelSlug })
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Erro de conexão.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
           alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
          setSavingHub(false);
      }
  };

`;

correctCode = correctCode.substring(0, startIndex) + newSammyCode + correctCode.substring(endIndex);

// Arruma as chamadas do botão no JSX para não travar com valores vazios
correctCode = correctCode.replace(/onChange=\{handleSammyInputChange\}/g, 'onChange={(e) => setSammyInput(e.target.value)}');
correctCode = correctCode.replace(/!sammyInput\.trim\(\)/g, '!sammyInput?.trim()');
correctCode = correctCode.replace(/!chatInput\.trim\(\)/g, '!chatInput?.trim()'); 

fs.writeFileSync('app/admin/dashboard/page.tsx', correctCode);
console.log("✅ Dashboard consertada com sucesso!");
