import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    
    // PEGANDO O ID DIRETO DO ENDEREÇO DA URL (O Truque)
    const { searchParams } = new URL(req.url);
    const userIdDaUrl = searchParams.get('userId');

    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (e) {
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    }

    if (body.status === 'paid' || body.status === 'PAID') {
      // Usa o ID da URL se a PushinPay não mandar no corpo
      const userId = userIdDaUrl || body.external_id; 
      
      if (!userId || userId === 'undefined') {
         throw new Error("O ID do fã sumiu completamente!");
      }

      const amountPaid = Number(body.value) / 100;
      console.log(`✅ PIX PAGO! Fã: ${userId} | Valor: ${amountPaid}`);

      const { data: userData, error: fetchError } = await supabase
        .from('Players')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error("Erro ao buscar jogador.");
      }

      const novoSaldo = (userData?.credits || 0) + amountPaid;

      const { error: updateError } = await supabase
        .from('Players')
        .update({ credits: novoSaldo })
        .eq('id', userId);

      if (updateError) {
        throw new Error("Erro ao salvar créditos no banco.");
      }

      console.log(`💰 SUCESSO! Saldo atualizado para: ${novoSaldo}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
