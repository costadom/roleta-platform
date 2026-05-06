import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    // UTILIZANDO O MODELO UNIVERSAL: Não dá erro 404 em contas novas/gratuitas
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `Você é a Sammy, assistente IA exclusiva da modelo @${modelSlug || 'Musa'}. 
Missão: Sempre comece dizendo: 'Oi, eu sou a Sammy! 💅✨'. 
Seja animada, chique, use emojis e foque em ajudar a modelo a vender mais na plataforma LabzSexy.`;

    const history = messages.map((m: any) => `${m.role === 'user' ? 'Modelo' : 'Sammy'}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHistórico:\n${history}\n\nSammy:`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error("ERRO NATIVO GEMINI:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
