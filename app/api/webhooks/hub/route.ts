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
            await supabase.from('UnlockedMedia').insert({ player_id: userId, media_id: mediaId, unlocked_at: new Date().toISOString() });
            const { data: model } = await supabase.from('Models').select('balance, referred_by, created_at').eq('id', modelId).single();
            let modelCut = amountPaid * 0.70;
            let platformCut = amountPaid * 0.30;

            if (model?.referred_by) {
                const dataCadastro = new Date(model.created_at).getTime();
                const dias = (new Date().getTime() - dataCadastro) / (1000 * 3600 * 24);
                if (dias <= 90) {
                    let affiliateCut = amountPaid * 0.05;
                    platformCut = amountPaid * 0.25;
                    const { data: madrinhaData } = await supabase.from('Models').select('balance').eq('id', model.referred_by).single();
                    if (madrinhaData) await supabase.from('Models').update({ balance: (madrinhaData.balance || 0) + affiliateCut }).eq('id', model.referred_by);
                }
            }
            if (model) await supabase.from('Models').update({ balance: (model.balance || 0) + modelCut }).eq('id', modelId);
            await supabase.from('Transactions').insert({ model_id: modelId, real_amount: amountPaid, model_cut: modelCut, platform_cut: platformCut, created_at: new Date().toISOString() });

        } else if (type === 'video' && requestId) {
            // Apenas marca como pago. O Super Admin vai ler isso em tempo real.
            await supabase.from('VideoRequests').update({ status: 'pago' }).eq('id', requestId);
        }
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
