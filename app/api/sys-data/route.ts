import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Inicializa o cliente do Supabase no Servidor usando a SERVICE ROLE KEY (Chave Mestra)
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Variáveis de ambiente do Supabase ausentes no servidor.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
};

// ==========================================
// ROTA GET: CARREGAR TODOS OS DADOS DO PAINEL
// ==========================================
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Executa todas as buscas simultaneamente no servidor
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

    // Formata o payload exatamente como o frontend espera
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
    console.error("Erro no GET /api/sys-data:", error);
    return NextResponse.json({ ok: false, error: error.message || "Erro interno ao carregar dados" }, { status: 500 });
  }
}

// ==========================================
// ROTA POST: CENTRAL DE AÇÕES (MUTAÇÕES)
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: "Nenhuma ação informada." }, { status: 400 });
    }

    // 1. ZERAR SISTEMA
    if (action === "resetSystem") {
      await Promise.all([
        supabase.from('Transactions').delete().neq('id', 'dummy'),
        supabase.from('SpinHistory').delete().neq('id', 'dummy'),
        supabase.from('Withdrawals').delete().neq('id', 'dummy'),
        supabase.from('AbandonedCarts').delete().neq('id', 'dummy')
      ]);
      return NextResponse.json({ ok: true });
    }

    // 2. SALVAR CONFIGURAÇÃO GLOBAL
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

    // 3. APROVAR SAQUE
    if (action === "approveWithdrawal") {
      const { error } = await supabase.from('Withdrawals')
        .update({ status: 'pago', is_read: false })
        .eq('id', payload.id);
        
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // 4. IGNORAR CARRINHO ABANDONADO
    if (action === "ignoreAbandoned") {
      const { error } = await supabase.from('AbandonedCarts')
        .update({ status: 'ignorado' })
        .eq('id', payload.id);
        
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // 5. APROVAR CANDIDATURA (E CRIAR A MUSA)
    if (action === "approveApplication") {
      const now = new Date().toISOString();
      const capNick = payload.nickname.charAt(0).toUpperCase() + payload.nickname.slice(1);
      const generatedEmail = payload.email || `${payload.nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${capNick}Labz2026!`;

      // Cria a Modelo
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

      // Cria as Configs da Modelo
      await supabase.from('Configs').insert({
        model_id: newModel.id,
        model_name: payload.nickname.toUpperCase(),
        spin_cost: 2,
        bg_url: payload.bg_url,
        profile_url: payload.profile_url || payload.bg_url,
        created_at: now
      });

      // Atualiza o status da candidatura
      await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);

      return NextResponse.json({ 
        ok: true, 
        data: { generatedEmail, generatedPass } 
      });
    }

    // 6. REJEITAR CANDIDATURA
    if (action === "rejectApplication") {
      const { error } = await supabase.from('Applications').delete().eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // 7. CRIAR MODELO MANUAL
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

    // 8. DELETAR MODELO
    if (action === "deleteModel") {
      // Deleta primeiro as dependências para evitar erro de chave estrangeira
      await supabase.from('Configs').delete().eq('model_id', payload.id);
      await supabase.from('Prize').delete().eq('model_id', payload.id);
      const { error } = await supabase.from('Models').delete().eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Ação desconhecida." }, { status: 400 });

  } catch (error: any) {
    console.error(`Erro no POST /api/sys-data [Ação: ${request.body}]:`, error);
    return NextResponse.json({ ok: false, error: error.message || "Erro na execução da ação" }, { status: 500 });
  }
}
