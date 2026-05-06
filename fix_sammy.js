const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Remove importações antigas
code = code.replace(/import \{ useChat \} from "(@ai-sdk|ai)\/react";/g, '');

// Substitui a variável do Chat da Vercel pelo Chat Direto
const oldSammyStateRegex = /const \{ messages: sammyMessages[\s\S]*?\]\n\s*\}\);/;
const newSammyState = `
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
          
          if (!res.ok || data.error) throw new Error(data.error || "A Chave do Google (API_KEY) está inválida ou faltando na Vercel.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
          alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
      }
  };`;
code = code.replace(oldSammyStateRegex, newSammyState);

// Substitui o botão de finalizar treinamento
const oldFinishRegex = /const handleFinishSammyTraining = async \(\) => \{[\s\S]*?setSavingHub\(false\);\n\s*\};/;
const newFinish = `
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
          if (!res.ok || data.error) throw new Error(data.error || "Erro de conexão com o cérebro da IA.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
           alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
          setSavingHub(false);
      }
  };`;
code = code.replace(oldFinishRegex, newFinish);

// Ajusta os inputs no HTML
code = code.replace(/value=\{sammyInput\}\s*onChange=\{handleSammyInputChange\}/g, 'value={sammyInput} onChange={(e) => setSammyInput(e.target.value)}');
code = code.replace(/!sammyInput\.trim\(\)/g, '!sammyInput?.trim()');

fs.writeFileSync('app/admin/dashboard/page.tsx', code);
