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
      const userId = userIdDaUrl || body.external_id; 
      
      if (!userId || userId === 'undefined') {
         throw new Error("O ID do fã sumiu completamente!");
      }

      // 1. Pega o valor real pago em REAIS
      const amountPaid = Number(body.value) / 100;
      console.log(`✅ PIX PAGO! Fã: ${userId} | Valor: R$ ${amountPaid}`);

      // 2. Mapeia os pacotes (Valor em R$ -> Créditos)
      let creditosGanhos = amountPaid; // Fallback
      if (amountPaid === 15) creditosGanhos = 20;
      else if (amountPaid === 25) creditosGanhos = 30;
      else if (amountPaid === 35) creditosGanhos = 40;
      else if (amountPaid === 55) creditosGanhos = 60;

      // 3. Busca o jogador para saber de qual modelo ele é
      const { data: userData, error: fetchError } = await supabase
        .from('Players')
        .select('credits, model_id')
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        throw new Error("Erro ao buscar jogador no banco.");
      }

      const modelId = userData.model_id;
      const novoSaldo = (userData.credits || 0) + creditosGanhos;

      // 4. Atualiza os créditos do Jogador
      await supabase
        .from('Players')
        .update({ credits: novoSaldo })
        .eq('id', userId);

      // --- A MÁGICA FINANCEIRA QUE FALTAVA --- //
      if (modelId) {
        const modelCut = amountPaid * 0.70; // 70% pra Rapha
        const platformCut = amountPaid * 0.30; // 30% pra Savanah Labz

        // 5. Registra a venda no Painel Super Admin (Tabela Transactions)
        await supabase.from('Transactions').insert({
          model_id: modelId,
          player_id: userId,
          amount: creditosGanhos,
          real_amount: amountPaid,
          model_cut: modelCut,
          platform_cut: platformCut,
          status: 'aprovado'
        });

        // 6. Busca o saldo atual da Modelo para somar a comissão dela
        const { data: modelData } = await supabase
          .from('Models')
          .select('balance')
          .eq('id', modelId)
          .single();

        const currentBalance = Number(modelData?.balance) || 0;

        // 7. Atualiza o cofre da modelo!
        await supabase
          .from('Models')
          .update({ balance: currentBalance + modelCut })
          .eq('id', modelId);
      }

      console.log(`💰 SUCESSO ABSOLUTO! Saldo atualizado e comissão da modelo gerada!`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
