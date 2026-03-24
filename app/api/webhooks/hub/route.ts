import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const modelId = searchParams.get('modelId');
    const mediaId = searchParams.get('mediaId');
    const requestId = searchParams.get('requestId');

    let body: any = {};
    try { body = JSON.parse(rawText); } catch (e) { body = Object.fromEntries(new URLSearchParams(rawText).entries()); }

    if (body.status === 'paid' || body.status === 'PAID') {
        const amountPaid = Number(body.value) / 100;

        if (type === 'photo' && mediaId && userId) {
            // 1. Desbloqueia a foto para o cliente
            await supabase.from('UnlockedMedia').insert({
                player_id: userId,
                media_id: mediaId,
                unlocked_at: new Date().toISOString()
            });

            // 2. Busca dados da Modelo para o Repasse
            const { data: model } = await supabase.from('Models').select('balance, referred_by, created_at').eq('id', modelId).single();
            
            let modelCut = amountPaid * 0.70; // 70% pra Modelo (Fixo)
            let platformCut = amountPaid * 0.30; // 30% pra Savanah Labz (Padrão)
            let affiliateCut = 0;
            let madrinhaId = null;

            // 🔥 LÓGICA DE AFILIADO (5% POR 3 MESES) 🔥
            if (model?.referred_by) {
                const dataCadastro = new Date(model.created_at).getTime();
                const dataAtual = new Date().getTime();
                const diasDesdeCadastro = (dataAtual - dataCadastro) / (1000 * 3600 * 24);

                // Só paga se fizer menos de 90 dias (3 meses) que a modelo entrou no Labz
                if (diasDesdeCadastro <= 90) {
                    affiliateCut = amountPaid * 0.05; // 5% para a madrinha
                    platformCut = amountPaid * 0.25;  // Plataforma cede 5% da sua parte
                    madrinhaId = model.referred_by;

                    // Adiciona o saldo na conta da Madrinha
                    const { data: madrinhaData } = await supabase.from('Models').select('balance').eq('id', madrinhaId).single();
                    if (madrinhaData) {
                        await supabase.from('Models').update({ balance: (madrinhaData.balance || 0) + affiliateCut }).eq('id', madrinhaId);
                    }
                }
            }

            // Atualiza o cofre da modelo vendedora
            if (model) {
                await supabase.from('Models').update({ balance: (model.balance || 0) + modelCut }).eq('id', modelId);
            }

            // 3. Registra para o Super Admin
            await supabase.from('Transactions').insert({
                model_id: modelId,
                real_amount: amountPaid,
                model_cut: modelCut,
                platform_cut: platformCut,
                created_at: new Date().toISOString()
            });

        } else if (type === 'video' && requestId) {
            // Para vídeos, apenas muda o status para pago. 
            // O saldo só vai para a modelo quando ela entregar o link (regra da Dashboard que já está pronta).
            // NOTA: A comissão do afiliado do vídeo precisará ser processada na hora que a modelo entregar o vídeo lá no dashboard.
            await supabase.from('VideoRequests').update({ status: 'pago' }).eq('id', requestId);
        }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
