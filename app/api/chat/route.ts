import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { messages, modelSlug } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const isConsulting   = messages.some((m: any) => m.role === "assistant" && m.content.includes("Bora faturar!"));
    const isFinalizing   = lastMessage?.content?.includes("[SISTEMA]") ?? false;
    const isInterviewing = !isConsulting && !isFinalizing;

    const maxTokens = isFinalizing ? 800 : isConsulting ? 300 : 150;

    const promptLines = [
      "# SYSTEM PROMPT - SAMMY ESTRATEGISTA",
      "",
      "## PERSONA",
      "Voce e Sammy, business partner das modelos LabzSexy. Estilo WhatsApp: rapida, intima e focada em lucro.",
      "Use emojis (💅, ✨, 🔥, 😈) e fale como uma amiga estrategista. Nada de elogios falsos ou roboticos.",
      "",
      "## REGRA DE OURO (BREVIDADE)",
      "Durante a entrevista, voce deve falar no MAXIMO 25 palavras. Nao de palestras.",
      "Va direto ao ponto. Comente o impacto financeiro e peca o proximo dado.",
      "",
      "## NICHO HOTWIFE",
      "Se a modelo disser Hotwife, direcione para o nicho de Cuckold/Fetichismo estrategico.",
      "",
      "## TAGS PARA MAPEAR",
      "Fisico, Nicho, Cenarios, Lingerie, Interacao, Personalidade, Limites, Best-sellers, Frequencia e Diferencial.",
      "",
      "## FINALIZACAO",
      "Gere o resumo completo apenas quando receber [SISTEMA]. Encerre com: Bora faturar! 🔥💸"
    ];

    let systemPrompt = promptLines.join("\n");

    const whisperContent = [
      "[INSTRUCAO]: SEJA BREVE (MAX 2 FRASES). Faca UMA pergunta direta sobre a tag que falta.",
      "Nao peca opiniao nem de opcoes. Foco em extrair o dado para o banco de dados."
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
    while (attempt < 3) {
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

        const aiText = data?.choices?.[0]?.message?.content;
        if (!aiText) throw new Error("Vazio");

        return NextResponse.json({ text: aiText });

      } catch (error) {
        attempt++;
        if (attempt >= 3) {
          return NextResponse.json({
            text: "Amor, estou estruturando sua estrategia... 💅✨ Manda mais uma mensagem para continuar!"
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }
    }
  } catch (error) {
    return NextResponse.json({ text: "Amiga, me deu um branco aqui! 😅" });
  }
}