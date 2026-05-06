export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();
    const apiKey = process.env.GROQ_API_KEY || "";

    if (!apiKey) throw new Error("Chave da Groq (GROQ_API_KEY) não encontrada na Vercel.");

    const systemPrompt = `Você é a Sammy, a assistente de Inteligência Artificial exclusiva das modelos da plataforma LabzSexy. 
A modelo se chama: @${modelSlug || 'Musa'}.
Missão: Sempre comece dizendo: 'Oi, eu sou a Sammy! 💅✨'. 
Seja animada, chique, use emojis e foque em descobrir o estilo dela para ajudar a vender. Responda de forma natural e não muito longa.`;

    // Converte o histórico para o formato exato que a API da Groq (Llama 3) exige
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    // Comunicação Direta com a API gratuita e ultrarrápida da Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // Modelo ultrarrápido e gratuito
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Erro na API da Groq");
    }

    const text = data.choices[0].message.content;
    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("ERRO GROQ:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
