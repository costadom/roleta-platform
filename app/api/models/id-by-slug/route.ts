import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 });
    }

    // Pega as chaves do ambiente (que já devem estar na Vercel)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
       console.warn("Chaves do Supabase não encontradas. Usando ID fallback para teste.");
       // Fallback para teste: se não tiver banco de dados conectado, ele "finge" que achou a modelo
       return NextResponse.json({ id: '12345' }); 
    }

    // Cria o cliente básico (que funciona em qualquer versão)
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: model, error } = await supabase
      .from('models')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !model) {
      console.warn("Modelo não encontrada no DB. Usando ID fallback para teste.", error);
      return NextResponse.json({ id: '12345' }); 
    }

    return NextResponse.json({ id: model.id });

  } catch (error) {
    console.error("Erro interno na API:", error);
    return NextResponse.json({ id: '12345' }); // Fallback para não quebrar a tela de teste
  }
}