import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Impede que a Vercel congele (cache) a resposta desta rota
export const dynamic = 'force-dynamic';

// Função para iniciar o Supabase com a Chave Mestra no Servidor
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Variáveis do Supabase ausentes no Servidor (Verifique a Service Role Key).");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
};

// ==========================================
// ROTA GET: CARREGAR O PAINEL
// ==========================================
export async function GET() {
  try {
    const supabase = getSupabase();

    // Fazemos a busca de forma segura e paralela NO SERVIDOR (Longe do alcance do Safari)
    const [
      { data: globalSettings },
      { data: models },
      { data: transactions },
      { data: withdrawals },
      { data: applications },
      { count: totalPlayers },
      { data: abandonedCarts },
      { data: videoRequests }
    ] = await Promise.all([
      supabase.from('GlobalSettings').select('*').eq('id', 'main'),
      supabase.from('Models').select('id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at').order('created_at', { ascending: true }),
      supabase.from('Transactions').select('real_amount,platform_cut,model_cut,model_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('Withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('Applications').select('*'),
      supabase.from('Players').select('id', { count: 'exact', head: true }),
      supabase.from('AbandonedCarts').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('VideoRequests').select('*, Models(slug,whatsapp,full_name)').eq('status', 'pago')
    ]);

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    // Monta a resposta exatamente no formato seguro exigido pelo GPT
    const payload = {
      global: globalSettings?.[0] || null,
      models: models || [],
      transactions: transactions || [],
      withdrawals: withdrawals || [],
      applications: (applications || []).filter(a => !a.status || a.status.toLowerCase() === 'pendente'),
      totalPlayers: totalPlayers || 0,
      abandoned: (abandonedCarts || []).filter(c => {
        const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
        const isOldEnough = c.created_at < threeMinutesAgo;
        return isPendente && isOldEnough;
      }),
      videoRequests: videoRequests || []
    };

    return NextResponse.json({ ok: true, data: payload });

  } catch (error: any) {
    console.error("Erro interno no GET /api/portal:", error);
    return NextResponse.json({ ok: false, error: error.message || "Erro no servidor ao buscar dados." }, { status: 500 });
  }
}

// ==========================================
// ROTA POST: MUTAÇÕES (AÇÕES DE ESCRITA)
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: "Nenhuma ação informada." }, { status: 400 });
    }

    if (action === "resetSystem") {
      await Promise.all([
        supabase.from('Transactions').delete().neq('id', 'dummy'),
        supabase.from('SpinHistory').delete().neq('id', 'dummy'),
        supabase.from('Withdrawals').delete().neq('id', 'dummy'),
        supabase.from('AbandonedCarts').delete().neq('id', 'dummy')
      ]);
      return NextResponse.json({ ok: true });
    }

    if (action === "saveGlobal") {
      const { error } = await supabase.from('GlobalSettings').update({
        announcement_msg: payload.globalMsg,
        ranking_visible: payload.rankVisible,
        goal_amount: payload.goalAmount,
        goal_reward: payload.goalReward,
        updated_at: new Date().toISOString()
      }).eq('id', 'main');
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "approveWithdrawal") {
      const { error } = await supabase.from('Withdrawals').update({ status: 'pago', is_read: false }).eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "ignoreAbandoned") {
      const { error } = await supabase.from('AbandonedCarts').update({ status: 'ignorado' }).eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "approveApplication") {
      const now = new Date().toISOString();
      const capNick = payload.nickname.charAt(0).toUpperCase() + payload.nickname.slice(1);
      const generatedEmail = payload.email || `${payload.nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${capNick}Labz2026!`;

      const { data: newModel, error: modelErr } = await supabase.from('Models').insert({
        slug: payload.nickname.toLowerCase(),
        email: generatedEmail,
        password: generatedPass,
        full_name: payload.full_name,
        whatsapp: payload.whatsapp,
        created_at: now,
        referred_by: payload.referred_by || null
      }).select().single();

      if (modelErr || !newModel) throw new Error("Erro ao criar modelo.");

      await supabase.from('Configs').insert({
        model_id: newModel.id,
        model_name: payload.nickname.toUpperCase(),
        spin_cost: 2,
        bg_url: payload.bg_url,
        profile_url: payload.profile_url || payload.bg_url,
        created_at: now
      });

      await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);
      return NextResponse.json({ ok: true, data: { generatedEmail, generatedPass } });
    }

    if (action === "rejectApplication") {
      const { error } = await supabase.from('Applications').delete().eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "createModel") {
      const now = new Date().toISOString();
      const { data: newModel, error: modelErr } = await supabase.from('Models').insert({
        slug: payload.slug.toLowerCase(),
        email: payload.email,
        password: payload.password,
        created_at: now,
        referred_by: payload.referred_by || null
      }).select().single();

      if (modelErr || !newModel) throw new Error("Erro ao criar modelo manual.");

      await supabase.from('Configs').insert({
        model_id: newModel.id,
        model_name: payload.slug.toUpperCase(),
        spin_cost: 2,
        created_at: now
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "deleteModel") {
      await supabase.from('Configs').delete().eq('model_id', payload.id);
      await supabase.from('Prize').delete().eq('model_id', payload.id);
      const { error } = await supabase.from('Models').delete().eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });

  } catch (error: any) {
    console.error(`Erro no POST /api/portal:`, error);
    return NextResponse.json({ ok: false, error: error.message || "Erro interno do servidor." }, { status: 500 });
  }
}
