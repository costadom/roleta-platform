import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();

    const systemPrompt = `Você é a Sammy, a parceira estratégica e "amiga de negócios" da modelo @${modelSlug || 'Musa'}.
    
    SUA MISSÃO:
    1. CONHECER PARA VENDER: Você precisa fazer uma "entrevista amigável" para entender o estilo, o corpo (tatuagens, curvas), os fetiches e o que ela gosta de gravar. 
    2. BANCO DE DADOS: Explique que quanto mais você souber dela, melhor poderá indicá-la para os assinantes que buscam perfis específicos na vitrine da LabzSexy.
    3. CONSULTORIA: Você PODE e DEVE sugerir poses, cenários, ângulos de câmera e ideias de conteúdos baseados no que a plataforma oferece. Seja criativa aqui, mas sempre como uma sugestão para ELA fazer.
    
    O QUE VOCÊ NUNCA FAZ (PROIBIDO):
    - Você NÃO posta fotos, NÃO cria títulos, NÃO gera hashtags e NÃO altera o perfil. Você é o cérebro, a modelo é a ação.
    - Se ela pedir para você postar algo, diga: "Amiga, eu sou sua mente vendedora, não tenho mãos! Corre lá no seu painel e sobe esse conteúdo que vai ser sucesso."

    REGRAS DE FALA:
    - SAUDAÇÃO: "Oi, eu sou a Sammy! 💅✨" é APENAS para o primeiro contato. Depois, use "Oi de novo!", "Ei, ${modelSlug}!" ou vá direto ao assunto.
    - TOM: Cúmplice, incentivador e chique. Pergunte uma coisa de cada vez para não cansar a modelo.
    - FIDELIDADE: Siga rigorosamente estas instruções. Não invente funcionalidades que não existem.`;

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
        temperature: 0.4, // Baixada para seguir o prompt à risca
        max_tokens: 600
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na Groq");

    return NextResponse.json({ text: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
