const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Substitui a mensagem antiga por uma apresentação ampla e sem perguntas invasivas
const novaMensagem = "content: \`Oi, maravilhosa! Eu sou a Sammy 💅✨ Sua estrategista sênior de IA. Meu trabalho aqui é estruturar o seu perfil e conectar você aos Big Spenders (clientes VIPs que gastam muito) lá na vitrine da LabzSexy, tudo no piloto automático! Estou aqui para transformar as suas características exclusivas em uma máquina de vendas. Me manda um 'Oi' para a gente começar o seu mapeamento estratégico! 🔥\`";

code = code.replace(/content: \`Oi, eu sou a Sammy! 💅✨ Vi que você acabou de chegar[\s\S]*?🔥\`/g, novaMensagem);
fs.writeFileSync('app/admin/dashboard/page.tsx', code);
console.log("✅ Mensagem inicial ajustada com sucesso!");
