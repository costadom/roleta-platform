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

            // 2. Repassa 70% para a Modelo NA HORA
            const modelCut = amountPaid * 0.70;
            const platformCut = amountPaid * 0.30;
            
            const { data: model } = await supabase.from('Models').select('balance').eq('id', modelId).single();
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
            await supabase.from('VideoRequests').update({ status: 'pago' }).eq('id', requestId);
        }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
