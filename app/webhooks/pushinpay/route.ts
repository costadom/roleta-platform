import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-pushinpay-token');

    if (signature !== process.env.PUSHINPAY_WEBHOOK_SECRET) {
      console.error("❌ Token inválido.");
      return new NextResponse('Não autorizado', { status: 401 });
    }

    if (body.status === 'paid') {
      const userId = body.external_id; 
      const amountPaid = body.value / 100; 
      
      console.log(`✅ PIX Recebido! Valor: R$ ${amountPaid}`);

      // Aqui definimos que 1 real = 1 crédito nesse teste
      const creditosGanhos = amountPaid; 

      // 1. Buscando o saldo atual na tabela 'Players'
      const { data: userData, error: fetchError } = await supabase
        .from('Players') 
        .select('credits') 
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error("Erro ao buscar jogador.");
      }

      const saldoAtual = userData?.credits || 0; 
      const novoSaldo = saldoAtual + creditosGanhos;

      // 2. Depositando o novo saldo na tabela 'Players'
      const { error: updateError } = await supabase
        .from('Players')
        .update({ credits: novoSaldo }) 
        .eq('id', userId);

      if (updateError) {
        throw new Error("Erro ao adicionar créditos.");
      }

      console.log(`💰 Sucesso! Saldo atualizado para ${novoSaldo}.`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("🚨 Erro no Webhook:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
