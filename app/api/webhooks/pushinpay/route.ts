import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  console.log("🚨 ALARME ESPIÃO: A PushinPay bateu na porta!");
  
  try {
    // 1. Lendo TUDO como texto puro (A Mágica Anti-Erro que evita o Fatal Error)
    const rawText = await req.text();
    console.log("📦 CORPO BRUTO RECEBIDO:", rawText);

    const signature = req.headers.get('x-pushinpay-token');
    
    // 2. Tradutor: Transforma o texto bagunçado da PushinPay em algo que o site entenda
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch (e) {
      console.log("⚠️ A PushinPay não mandou JSON. Traduzindo o texto bruto...");
      const params = new URLSearchParams(rawText);
      body = Object.fromEntries(params.entries());
    }

    console.log("🧩 DADOS TRADUZIDOS COM SUCESSO:", JSON.stringify(body, null, 2));

    // 3. Regra do Depósito
    if (body.status === 'paid' || body.status === 'PAID') {
      const userId = body.external_id; 
      const amountPaid = Number(body.value) / 100; 
      
      console.log(`✅ PIX PAGO CONFIRMADO! Fã: ${userId} | Valor: ${amountPaid}`);

      // Buscando saldo atual
      const { data: userData, error: fetchError } = await supabase
        .from('Players') 
        .select('credits') 
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error("❌ ERRO NO SUPABASE:", fetchError);
        throw new Error("Erro ao buscar jogador.");
      }

      const novoSaldo = (userData?.credits || 0) + amountPaid;

      // Salvando novo saldo
      const { error: updateError } = await supabase
        .from('Players')
        .update({ credits: novoSaldo }) 
        .eq('id', userId);

      if (updateError) {
        console.error("❌ ERRO AO SALVAR NO SUPABASE:", updateError);
        throw new Error("Erro ao salvar créditos.");
      }

      console.log(`💰 SUCESSO! Saldo do usuário atualizado para: ${novoSaldo}`);
    } else {
      console.log(`⚠️ Aviso recebido, mas o status não é 'paid'. Status: ${body.status}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
