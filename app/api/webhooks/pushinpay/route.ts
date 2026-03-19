import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  console.log("🚨 ALARME ESPIÃO: A PushinPay bateu na porta!");
  
  try {
    const body = await req.json();
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(body, null, 2));

    const signature = req.headers.get('x-pushinpay-token');
    console.log("🔑 CHAVE RECEBIDA:", signature);
    console.log("🔑 CHAVE DA VERCEL:", process.env.PUSHINPAY_WEBHOOK_SECRET);

    // Tirei a trava de segurança temporariamente para ver se era ela bloqueando
    
    if (body.status === 'paid') {
      const userId = body.external_id; 
      const amountPaid = body.value / 100; 
      
      console.log(`✅ PIX PAGO CONFIRMADO! Iniciando depósito de ${amountPaid} créditos para o ID: ${userId}`);

      // 1. Buscando no Supabase
      const { data: userData, error: fetchError } = await supabase
        .from('Players') 
        .select('credits') 
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error("❌ ERRO NO SUPABASE AO BUSCAR:", fetchError);
        throw new Error("Erro ao buscar jogador.");
      }

      console.log(`📊 Saldo antigo do usuário: ${userData?.credits || 0}`);
      const novoSaldo = (userData?.credits || 0) + amountPaid;

      // 2. Salvando no Supabase
      const { error: updateError } = await supabase
        .from('Players')
        .update({ credits: novoSaldo }) 
        .eq('id', userId);

      if (updateError) {
        console.error("❌ ERRO NO SUPABASE AO SALVAR:", updateError);
        throw new Error("Erro ao salvar créditos.");
      }

      console.log(`💰 DEU TUDO CERTO! O saldo atualizado agora é: ${novoSaldo}`);
    } else {
      console.log(`⚠️ O PIX não constava como pago. Status: ${body.status}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL NO WEBHOK:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
