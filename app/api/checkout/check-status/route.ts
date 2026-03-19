import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Guardamos o saldo inicial na memória para saber quando ele aumentar
let saldoInicial: Record<string, number> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Falta o ID' }, { status: 400 });

  try {
    const { data } = await supabase
      .from('Players')
      .select('credits')
      .eq('id', userId)
      .single();

    const saldoAtual = data?.credits || 0;

    // Se é a primeira vez checando, salva o saldo que o cliente já tinha
    if (saldoInicial[userId] === undefined) {
      saldoInicial[userId] = saldoAtual;
      return NextResponse.json({ status: 'aguardando' });
    }

    // Se o saldo atual ficou maior que o inicial, o PIX caiu e o Webhook funcionou!
    if (saldoAtual > saldoInicial[userId]) {
      saldoInicial[userId] = saldoAtual; // Atualiza a memória
      return NextResponse.json({ status: 'pago' });
    }

    return NextResponse.json({ status: 'aguardando' });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao checar' }, { status: 500 });
  }
}
