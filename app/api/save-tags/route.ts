import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usando as variáveis de ambiente padrão do Supabase no Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { messages, modelSlug } = await req.json();

    // 1. PROMPT OCULTO PARA EXTRAÇÃO EM JSON
    const extractPrompt = `
    Você é um extrator de dados de perfis de modelos de conteúdo adulto.
    Leia o histórico da conversa entre a modelo e a IA.
    Extraia as informações cruciais e retorne EXATAMENTE um objeto JSON válido, sem texto adicional.
    
    O JSON deve seguir esta estrutura exata:
    {
      "atributos_fisicos": ["ruiva", "tatuada", "bunda grande"],
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

    // 2. CHAMA A GROQ FORÇANDO A SAÍDA EM JSON
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        temperature: 0.1, // Quase zero para evitar alucinação no JSON
        response_format: { type: "json_object" } // FORÇA O RETORNO EM JSON
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na Groq");

    const tagsJson = JSON.parse(data.choices[0].message.content);

    // 3. SALVA NO SUPABASE
    // ATENÇÃO: Ajuste 'profiles' para o nome exato da sua tabela, e 'slug' para o identificador correto.
    const { error: dbError } = await supabase
      .from('profiles') // <-- NOME DA SUA TABELA
      .update({ sammy_tags: tagsJson }) // <-- NOME DA SUA COLUNA JSONB
      .eq('slug', modelSlug);

    if (dbError) throw new Error(`Erro no Supabase: ${dbError.message}`);

    return NextResponse.json({ success: true, tags: tagsJson });

  } catch (error: any) {
    console.error("Erro no Extrator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
