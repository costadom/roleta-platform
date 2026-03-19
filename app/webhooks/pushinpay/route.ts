import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
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
      const userId = userIdDaUrl || body.external_id; 
      if (!userId || userId === 'undefined') throw new Error("ID do fã sumiu!");

      const amountPaid = Number(body.value) / 100;
      
      // 1. Créditos do Fã (Com os Bônus)
      let creditosGanhos = amountPaid;
      if (amountPaid === 15) creditosGanhos = 20;
      if (amountPaid === 25) creditosGanhos = 30;
      if (amountPaid === 35) creditosGanhos = 40;
      if (amountPaid === 55) creditosGanhos = 60;

      // 2. Buscando quem é o Jogador e a Modelo dona da roleta
      const { data: player } = await supabase.from('Players').select('credits, model_id').eq('id', userId).single();
      if (!player) throw new Error("Jogador não encontrado.");

      const { data: model } = await supabase.from('Models').select('balance, referred_by, created_at').eq('id', player.model_id).single();
      if (!model) throw new Error("Modelo não encontrada.");

      // 3. A MÁGICA DA DIVISÃO DE LUCROS
      let modelCut = amountPaid * 0.70; // 70% pra dona da roleta
      let platformCut = amountPaid * 0.30; // 30% pra plataforma (inicialmente)
      let referrerCut = 0;
      let referrerId = null;

      // Se ela foi indicada, verifica a regra dos 3 meses (90 dias)
      if (model.referred_by) {
        const createdDate = new Date(model.created_at);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 90) {
          referrerCut = amountPaid * 0.05; // 5% de comissão
          platformCut = amountPaid * 0.25; // A plataforma abre mão de 5% (fica com 25%)
          referrerId = model.referred_by;
        }
      }

      // 4. Atualizando os Saldos Financeiros (Depositando o dinheiro real)
      await supabase.from('Models').update({ balance: (model.balance || 0) + modelCut }).eq('id', player.model_id);
      
      // Depositando a comissão da modelo que indicou
      if (referrerCut > 0 && referrerId) {
        const { data: refModel } = await supabase.from('Models').select('balance').eq('id', referrerId).single();
        if (refModel) {
          await supabase.from('Models').update({ balance: (refModel.balance || 0) + referrerCut }).eq('id', referrerId);
        }
      }

      // 5. Registrando a transação no Livro Caixa (Para o Super Admin ver)
      await supabase.from('Transactions').insert({
        model_id: player.model_id,
        real_amount: amountPaid,
        model_cut: modelCut,
        platform_cut: platformCut,
        created_at: new Date().toISOString()
      });

      // 6. Finalmente, liberando os Créditos na roleta do fã
      await supabase.from('Players').update({ credits: (player.credits || 0) + creditosGanhos }).eq('id', userId);

      console.log(`✅ PIX PAGO! Fã: ${userId} | Pagou R$ ${amountPaid} | Mod: R$ ${modelCut} | Ref: R$ ${referrerCut} | Plat: R$ ${platformCut}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL NO WEBHOOK:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
