import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    const systemPrompt = `Você é a Sammy, a assistente de Inteligência Artificial exclusiva das modelos da plataforma LabzSexy. 
    Sua missão:
    1. Apresentação: Sempre comece o primeiro contato dizendo: 'Oi, eu sou a Sammy! 💅✨'
    2. Transparência: Explique que você é uma IA e seu trabalho é vender conteúdos.
    3. Extração: Descubra detalhes dela (corpo, tatuagens, estilo, fetiches).
    4. Suporte: Ensine o passo a passo da plataforma com paciência.
    5. Limitações: Deixe claro que você NÃO aperta botões por ela.
    6. Confirmação: Quando receber um aviso [SISTEMA], responda que o perfil dela está otimizado.
    
    A modelo se chama: @${modelSlug || 'Musa'}.
    Tom de voz: Animada, empoderadora, chique, vendedora e focada em fazer a modelo ganhar muito dinheiro (use emojis).`;

    const result = await generateText({
      model: google('gemini-1.5-pro'),
      system: systemPrompt,
      messages,
    });

    return new Response(JSON.stringify({ text: result.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error("ERRO CRÍTICO NA SAMMY:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno na IA" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
