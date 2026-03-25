import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Busca o ID da modelo baseada no slug na tabela 'models'
    // IMPORTANTE: Certifique-se que sua tabela no Supabase tem as colunas 'id' e 'slug'
    const { data: model, error } = await supabase
      .from('models')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !model) {
      console.error("Erro ao buscar modelo:", error);
      return NextResponse.json({ error: 'Modelo não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ id: model.id });

  } catch (error) {
    console.error("Erro interno na API:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
