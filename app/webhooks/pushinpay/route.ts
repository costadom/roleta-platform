import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    
    // PEGANDO O ID DIRETO DO ENDEREÇO DA URL
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

      // --- A MATEMÁTICA FINANCEIRA (COM SISTEMA DE AFILIADOS) --- //
      if (modelId) {
        // Busca os dados da Modelo que está vendendo para checar se ela tem madrinha
        const { data: modelData } = await supabase
          .from('Models')
          .select('balance, referred_by, created_at')
          .eq('id', modelId)
          .single();

        let modelCut = amountPaid * 0.70; // 70% pra Modelo (Fixo)
        let platformCut = amountPaid * 0.30; // 30% pra Savanah Labz (Padrão)
        let affiliateCut = 0;
        let madrinhaId = null;

        // 🔥 LÓGICA DE AFILIADO (5% POR 3 MESES) 🔥
        if (modelData?.referred_by) {
            const dataCadastro = new Date(modelData.created_at).getTime();
            const dataAtual = new Date().getTime();
            const diasDesdeCadastro = (dataAtual - dataCadastro) / (1000 * 3600 * 24);

            // Só paga se fizer menos de 90 dias (3 meses) que a modelo entrou no Labz
            if (diasDesdeCadastro <= 90) {
                affiliateCut = amountPaid * 0.05; // 5% para a madrinha
                platformCut = amountPaid * 0.25;  // Plataforma cede 5% da sua parte
                madrinhaId = modelData.referred_by;

                // Adiciona o saldo na conta da Madrinha
                const { data: madrinhaData } = await supabase.from('Models').select('balance').eq('id', madrinhaId).single();
                if (madrinhaData) {
                    await supabase.from('Models').update({ balance: (madrinhaData.balance || 0) + affiliateCut }).eq('id', madrinhaId);
                }
            }
        }

        // 5. Registra a venda na tabela (Agora com informações de comissão)
        await supabase.from('Transactions').insert({
          model_id: modelId,
          player_phone: userId, // Salva quem pagou
          amount: creditosGanhos,
          real_amount: amountPaid,
          model_cut: modelCut,
          platform_cut: platformCut,
          status: 'aprovado'
        });

        // 7. Atualiza o cofre da modelo vendedora
        const currentBalance = Number(modelData?.balance) || 0;
        await supabase
          .from('Models')
          .update({ balance: currentBalance + modelCut })
          .eq('id', modelId);
      }

      console.log(`💰 SUCESSO ABSOLUTO! Saldo da modelo e da plataforma atualizados!`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("💥 ERRO FATAL:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
