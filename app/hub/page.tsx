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
    const mediaId = searchParams.get('mediaId'); // No chat, isso é o ID da Mensagem
    const requestId = searchParams.get('requestId');

    let body: any = {};
    try { 
      body = JSON.parse(rawText); 
    } catch (e) { 
      body = Object.fromEntries(new URLSearchParams(rawText).entries()); 
    }

    // Verifica se o status é pago (PushinPay manda 'paid')
    if (body.status === 'paid' || body.status === 'PAID') {
        const amountPaid = Number(body.value) / 100; // Converte centavos para Reais

        // --- LÓGICA DE DIVISÃO DE VALORES (70/30 + AFILIADO) ---
        const processFinance = async () => {
            const { data: model } = await supabase.from('Models').select('balance, referred_by, created_at').eq('id', modelId).single();
            if (!model) return null;

            let modelCut = amountPaid * 0.70;
            let platformCut = amountPaid * 0.30;
            let affiliateCut = 0;

            if (model.referred_by) {
                const dataCadastro = new Date(model.created_at).getTime();
                const dias = (new Date().getTime() - dataCadastro) / (1000 * 3600 * 24);
                if (dias <= 90) {
                    affiliateCut = amountPaid * 0.05;
                    platformCut = amountPaid * 0.25;
                    const { data: madrinha } = await supabase.from('Models').select('balance').eq('id', model.referred_by).single();
                    if (madrinha) {
                        await supabase.from('Models').update({ balance: (madrinha.balance || 0) + affiliateCut }).eq('id', model.referred_by);
                    }
                }
            }

            // Atualiza saldo da Musa
            await supabase.from('Models').update({ balance: (model.balance || 0) + modelCut }).eq('id', modelId);
            
            // Registra a Transação no histórico
            await supabase.from('Transactions').insert({ 
                model_id: modelId, 
                real_amount: amountPaid, 
                model_cut: modelCut, 
                platform_cut: platformCut, 
                created_at: new Date().toISOString() 
            });

            return true;
        };

        // 1. FOTO DA VITRINE
        if (type === 'photo' && mediaId && userId) {
            await supabase.from('UnlockedMedia').insert({ player_id: userId, media_id: mediaId, unlocked_at: new Date().toISOString() });
            await processFinance();
        } 
        
        // 2. ENCOMENDA DE VÍDEO
        else if (type === 'video' && requestId) {
            await supabase.from('VideoRequests').update({ status: 'pago' }).eq('id', requestId);
            // O financeiro do vídeo é processado na entrega (conforme seu código anterior)
        } 
        
        // 3. MÍDIA DO CHAT (PPV)
        else if (type === 'chat_media' && mediaId) {
            // No chat_media, o mediaId enviado pelo front é o ID da linha na tabela Messages
            await supabase.from('Messages').update({ is_unlocked: true }).eq('id', mediaId);
            await processFinance();
        } 
        
        // 4. PRESENTE VIP (GIFT)
        else if (type === 'gift') {
            await processFinance();
            // A mensagem do presente já é enviada pelo front-end após o polling detectar o pagamento
        }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error("ERRO WEBHOOK:", error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
