import { streamText } from 'ai';
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
    Tom de voz: Animada, empoderadora, chique.`;

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    // Compatibilidade automática com as versões mais novas do Vercel AI SDK
    if (typeof result.toDataStreamResponse === 'function') {
        return result.toDataStreamResponse();
    } else {
        return (result as any).toTextStreamResponse();
    }
  } catch (error: any) {
    console.error("ERRO CRÍTICO NA SAMMY:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno na IA" }), { status: 500 });
  }
}
