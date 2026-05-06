export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey) throw new Error("API Key não encontrada na Vercel.");

    const systemPrompt = `Você é a Sammy, a assistente de Inteligência Artificial exclusiva das modelos da plataforma LabzSexy. 
A modelo se chama: @${modelSlug || 'Musa'}.
Missão: Sempre comece dizendo: 'Oi, eu sou a Sammy! 💅✨'. 
Seja animada, chique, use emojis e ajude a vender.`;

    const history = messages.map((m: any) => `${m.role === 'user' ? 'Modelo' : 'Sammy'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nHistórico:\n${history}\n\nSammy:`;

    // Conexão PURA E DIRETA (Livre de bugs de SDK)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Erro desconhecido do Google");
    }

    const text = data.candidates[0].content.parts[0].text;
    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("ERRO DIRETO GEMINI:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
