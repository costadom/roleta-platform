import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    const extractPrompt = `
    Você é um extrator de dados de perfis de modelos de conteúdo adulto.
    Leia o histórico da conversa entre a modelo e a IA.
    Extraia as informações cruciais e retorne EXATAMENTE um objeto JSON válido, sem texto adicional.
    
    O JSON deve seguir esta estrutura exata:
    {
      "atributos_fisicos": ["exemplo"],
      "nicho_principal": "exemplo",
      "cenarios": ["exemplo"],
      "estilo_roupas": ["exemplo"],
      "hard_limits": ["exemplo"],
      "diferencial": "exemplo"
    }
    Se uma informação não foi dita, retorne um array vazio ou string vazia.
    `;

    const groqMessages = [
      { role: "system", content: extractPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        temperature: 0.1, 
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na Groq");

    const tagsJson = JSON.parse(data.choices[0].message.content);
    const safeSlug = modelSlug || 'musa-padrao';

    // A MÁGICA ACONTECE AQUI: UPSERT! Cria se não existe, atualiza se existe.
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(
        { slug: safeSlug, sammy_tags: tagsJson }, 
        { onConflict: 'slug' }
      );

    if (dbError) throw new Error(`Erro no Supabase: ${dbError.message}`);

    return NextResponse.json({ success: true, tags: tagsJson });

  } catch (error: any) {
    console.error("Erro no Extrator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
