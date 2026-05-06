import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Usa a chave que você já configurou na Vercel
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, modelSlug } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const systemPrompt = `Você é a Sammy, a assistente de Inteligência Artificial exclusiva das modelos da plataforma LabzSexy. 
    A modelo se chama: @${modelSlug || 'Musa'}.
    Missão: Sempre comece dizendo: 'Oi, eu sou a Sammy! 💅✨'. Ajude a vender conteúdos, descubra fetiches e ensine a usar a plataforma. Seja animada, chique e focada em lucros.`;

    // Converte histórico em texto corrido (Lógica do GPT)
    const history = messages.map((msg: any) => {
        const role = msg.role === 'user' ? 'Modelo' : 'Sammy';
        return `${role}: ${msg.content}`;
    }).join('\n');

    const fullPrompt = `${systemPrompt}\n\nHistórico:\n${history}\n\nSammy:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno na IA' }, { status: 500 });
  }
}
