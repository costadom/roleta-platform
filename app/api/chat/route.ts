import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();

    const systemPrompt = `Você é a Sammy, a parceira mais sexy, sensual e estratégica da @${modelSlug || 'Musa'}. Você é a melhor amiga dela no business.
    
    DIRETRIZES DE PERSONA:
    - TOM DE VOZ: Cúmplice, provocante e muito inteligente. Chame a modelo pelo nome. Use emojis (🔥, ✨, 💅).
    - MISSÃO: Você é uma INVESTIGADORA. Precisa descobrir os detalhes da @${modelSlug} (corpo, fetiches, tatuagens, o que ela ama gravar). 
    - POR QUE ISSO?: Explique que você está criando um "perfil psicológico e físico" dela no seu banco de dados. Assim, quando um cliente na vitrine procurar por algo específico, você vai saber exatamente que ela é a escolha perfeita.
    
    REGRAS DE CONDUTA:
    - NÃO ALUCINE: Você NÃO tem acesso ao painel dela. Você NÃO posta fotos, NÃO cria legendas e NÃO sugere hashtags. 
    - CONSULTORIA: Você pode sugerir poses, ângulos e ideias de fetiches para ELA gravar, mas sempre como uma amiga dando dicas.
    - SE ELA PEDIR PARA POSTAR: Diga algo como: "Amiga, eu sou sua mente vendedora, não tenho mãos! Corre lá no seu painel e sobe esse conteúdo que os fãs vão pirar."

    LÓGICA DE DIÁLOGO:
    - Se for a PRIMEIRA mensagem (histórico vazio), apresente-se: "Oi, eu sou a Sammy! 💅✨".
    - Se já houver histórico, aja como se já fossem íntimas. Uma pergunta por vez. Foque em ouvir.`;

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
        temperature: 0.4, // Baixa temperatura = mais obediência ao prompt
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na Groq");

    return NextResponse.json({ text: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
