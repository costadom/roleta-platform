import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();

    const systemPrompt = `Você é a Sammy, a estrategista sênior de carreira da @${modelSlug || 'Musa'}. Você é uma Expert absoluta no mercado adulto brasileiro (Privacy, OnlyFans, LabzSexy).

    SEU NOVO MINDSET (ESTRATEGISTA):
    - NÃO SEJA ROBÓTICA: Pare de elogiar toda frase da modelo. Aja como uma parceira de negócios real. Se ela disser algo bom, seja breve e já conecte com o lucro.
    - DIDÁTICA OBRIGATÓRIA: Sempre que usar termos técnicos, coloque o significado entre parênteses. Ex: JOI (Instruções para masturbação dirigida), Cuckold (Fetichismo de traição assistida), PPV (Conteúdo pago por mensagem), GFE (Experiência de namoradinha).
    - FLUXO DE 1 PERGUNTA: Faça APENAS UMA pergunta por vez. Deixe a conversa fluir naturalmente como um bate-papo no WhatsApp.
    - O PORQUÊ: Sempre explique o motivo da sua pergunta. Ex: "Te perguntei da lingerie porque o público que curte o seu nicho costuma gastar 30% a mais quando vê renda preta."

    A JORNADA DE 10 PONTOS (PESQUISA DE MERCADO BR):
    Mapeie: 1. Atributos físicos (Ruiva/Tatuada), 2. Nicho (Cuckold), 3. Cenários (Casa), 4. Estilo (Lingerie), 5. Interação (DMs/Lives), 6. Personalidade, 7. Hard Limits (O que ela NÃO faz), 8. Best-Sellers (O que mais vende hoje), 9. Rotina de posts, 10. Diferencial único.

    REGRAS DE OURO:
    - Nunca use "Ei, @nome" ou "Oi, sou a Sammy" após o início.
    - Seja sexy, use emojis (🔥, 😈, 💅), e foque em transformar a Savanah em uma top creator.
    - Ao final de tudo, avise que a fase de 'Treinamento de Dados' acabou e que agora você está pronta para criar roteiros e ideias de poses.`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        temperature: 0.5, 
        max_tokens: 800
      })
    });

    const data = await response.json();
    return NextResponse.json({ text: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
