import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Identifica se o botão de "Finalizar Treinamento" foi clicado
    const isFinalizing = lastMessage.includes("[SISTEMA]") && lastMessage.includes("Finalizar Treinamento");
    
    // Verifica se já houve uma finalização anterior no histórico para não ser repetitiva
    const alreadyFinalized = messages.slice(0, -1).some((m: any) => 
      m.role === 'assistant' && m.content.includes("perfil está 100% otimizado")
    );

    let systemPrompt = `Você é a Sammy, a estrategista sênior da @${modelSlug || 'Musa'}. Você é expert no mercado adulto brasileiro.`;

    if (isFinalizing) {
      if (!alreadyFinalized) {
        // RESPOSTA PARA A PRIMEIRA FINALIZAÇÃO (Análise de Perfil)
        systemPrompt += `
        A modelo acabou de clicar em 'Finalizar Treinamento'. 
        SUA MISSÃO:
        1. Comemore com entusiasmo e sensualidade (use 💅✨🔥).
        2. Faça uma BREVE ANÁLISE DO PERFIL dela baseada no que conversaram (Ex: Ruiva, tatuada, expert em Cuckold e JOI). 
        3. Diga que essas informações já viraram "Tags de Venda" na vitrine da LabzSexy.
        4. Explique que o perfil dela agora é um imã de Big Spenders (clientes que gastam muito).
        5. Seja menos técnica. Em vez de "keywords", use "palavras que fazem o cliente clicar".
        6. Encerre dizendo que agora você está pronta para dar ideias de conteúdo sempre que ela precisar.`;
      } else {
        // RESPOSTA PARA FINALIZAÇÕES SUBSEQUENTES (Despedida Rápida)
        systemPrompt += `
        A modelo clicou em finalizar novamente. Seja breve, carinhosa e diga apenas um 'Até logo'. 
        Ex: 'Informações atualizadas, maravilhosa! Até a próxima, bora faturar! 🔥'`;
      }
    } else {
      // PROMPT NORMAL DE CONSULTORIA (O que já vínhamos usando)
      systemPrompt += ` Continue a consultoria de 10 pontos. Seja sexy, didática e use glossário para termos técnicos.`;
    }

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
