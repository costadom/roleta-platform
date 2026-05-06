import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

function safeParseJSON(text: string) {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.error("❌ Falha ao parsear JSON:", text);
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    const cleanMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content.replace(/git push|commit|[\u0000-\u001F\u007F-\u009F]/g, "")
    }));

    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        console.log("🧠 Tentativa:", attempt + 1);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "Retorne APENAS JSON puro. Sem explicações."
              },
              ...cleanMessages
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content;

        console.log("📦 Resposta IA:", raw);

        const parsed = safeParseJSON(raw);

        if (!parsed) throw new Error("JSON inválido");

        const { error } = await supabase
          .from("profiles")
          .upsert({
            slug: modelSlug || "default",
            sammy_tags: parsed,
            updated_at: new Date()
          }, { onConflict: "slug" });

        if (error) {
          console.error("❌ Supabase erro:", error);
          throw error;
        }

        console.log("✅ Salvo com sucesso!");
        return NextResponse.json({ success: true });

      } catch (err) {
        attempt++;
        console.error("❌ Tentativa falhou:", err);
      }
    }

    return NextResponse.json({
      success: false,
      fallback: true
    });

  } catch (err: any) {
    console.error("🔥 Erro geral:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
