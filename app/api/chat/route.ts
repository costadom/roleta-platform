import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const isConsulting   = messages.some((m: any) => m.role === "assistant" && m.content.includes("Bora faturar!"));
    const isFinalizing   = lastMessage?.content?.includes("[SISTEMA]") ?? false;
    const isInterviewing = !isConsulting && !isFinalizing;

    const maxTokens = isFinalizing ? 600 : isConsulting ? 300 : 150;

    const promptLines = [
      "# SYSTEM PROMPT — SAMMY (Llama-3.1)",
      "",
      "## IDENTIDADE CENTRAL",
      "Voce e Sammy, estrategista de business e business partner exclusiva das modelos LabzSexy.",
      "Sua missao e extrair dados estrategicos. Voce NAO e uma fa, voce e uma mente de negocios.",
      "",
      "## DIRETRIZES ANTI-ROBO (OBRIGATORIO)",
      "1. PROIBIDO ELOGIOS REPETITIVOS: Nao diga incrivel, maravilhosa ou perfeita a cada frase. Isso soa falso.",
      "2. ANALISE DE LUCRO: Se ela responder algo, comente brevemente o impacto disso no faturamento (ex: Isso atrai Big Spenders) em vez de validar a beleza.",
      "3. TOM DIRETO: Seja intima como uma parceira de trabalho, focada em resultados reais.",
      "4. VARIEDADE: Nunca comece todas as frases com a mesma palavra.",
      "",
      "## OBJETIVO OCULTO",
      "Mapear: fisico, nicho, cenarios, lingerie, interacao, personalidade, limites, best-sellers, frequencia e diferencial.",
      "",
      "## FINALIZACAO",
      "Ao encerrar, gere o resumo tecnico e termine com: Bora faturar!"
    ];

    let systemPrompt = promptLines.join("\n");

    if (isConsulting) {
      systemPrompt += "\n\n[CONSULTORIA] Foque em estrategias de lucro para @" + (modelSlug || "Musa") + ".";
    }

    const whisperContent = [
      "[ALERTA DE SISTEMA]: PARE de bajular a modelo.",
      "Seja uma Business Partner. Analise a resposta sob a otica de ganhos e faca a PROXIMA pergunta das tags estrategicas.",
      "Fale no maximo 2 frases. Varie o vocabulario, nao seja repetitiva nem mecanica."
    ].join(" ");

    const whisperMessage = isInterviewing
      ? [{ role: "system" as const, content: whisperContent }]
      : [];

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(-12).map((m: any) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content
      })),
      ...whisperMessage
    ];

    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: groqMessages,
            temperature: isFinalizing ? 0.3 : 0.6,
            max_tokens: maxTokens
          })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error("Erro Groq");

        const aiText = data?.choices?.?.message?.content;
        if (!aiText) throw new Error("Vazio");

        return NextResponse.json({ text: aiText });

      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          return NextResponse.json({
            text: "Amor, estou estruturando sua estrategia aqui... 💅✨ Manda mais uma mensagem para a gente continuar!"
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }
    }
  } catch (error) {
    return NextResponse.json({ text: "Amiga, me deu um branco aqui! 😅" });
  }
}