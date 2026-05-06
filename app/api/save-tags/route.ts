import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

function safeParseJSON(text: string) {
  try {
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match);
    } catch (e) {}
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    // Limita as mensagens para não estourar o limite de tokens na Groq
    const cleanMessages = messages.slice(-14).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const extractPrompt = `Você é um robô de extração. Leia a conversa e retorne EXATAMENTE este JSON preenchido. Sem texto adicional. Se não houver, deixe vazio.
{
  "atributos_fisicos": [],
  "nicho_principal": "",
  "cenarios": [],
  "estilo_roupas": [],
  "hard_limits": [],
  "diferencial": ""
}`;

    let attempt = 0;
    let tagsJson = null;

    while (attempt < 3) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: extractPrompt },
              ...cleanMessages
            ],
            temperature: 0.1,
            max_tokens: 400, // Limite para evitar erro de Rate Limit
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        
        if (response.ok && data?.choices?.[0]?.message?.content) {
          tagsJson = safeParseJSON(data.choices[0].message.content);
          // Se gerou o JSON corretamente e não está vazio, quebra o loop
          if (tagsJson && Object.keys(tagsJson).length > 0) break;
        }
      } catch (err) {}
      
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 3500));
    }

    // 🔥 TRAVA DE SEGURANÇA: Se falhar ou for vazio, NÃO salva no banco
    if (!tagsJson || Object.keys(tagsJson).length === 0) {
       return NextResponse.json({ success: false, message: "IA retornou vazio, ignorando salvamento." });
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ slug: modelSlug || 'musa-padrao', sammy_tags: tagsJson }, { onConflict: 'slug' });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, tags: tagsJson });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
