"use server";

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Chave mestra da Vercel
  return createClient(url, key, { auth: { persistSession: false } });
};

// 🔥 BUSCA COMPLETA DE DADOS (GET) 🔥
export async function getSuperAdminData() {
  try {
    const supabase = getSupabase();
    
    const [
      { data: globRes },
      { data: modelsRes },
      { data: transRes },
      { data: withsRes },
      { data: appsRes },
      { count: pCount },
      { data: cartsRes },
      { data: vidsRes }
    ] = await Promise.all([
      supabase.from('GlobalSettings').select('*').eq('id', 'main').single(),
      supabase.from('Models').select('*').order('created_at', { ascending: true }),
      supabase.from('Transactions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('Withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('Applications').select('*'),
      supabase.from('Players').select('id', { count: 'exact', head: true }),
      supabase.from('AbandonedCarts').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('VideoRequests').select('*, Models(slug,whatsapp,full_name)').eq('status', 'pago')
    ]);

    // O tempo exato de 3 minutos atrás em milissegundos (Blindado contra fuso horário)
    const threeMinsAgo = Date.now() - 3 * 60 * 1000;

    return {
      ok: true,
      data: {
        global: globRes || null,
        models: modelsRes || [],
        transactions: transRes || [],
        withdrawals: withsRes || [],
        applications: (appsRes || []).filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'),
        totalPlayers: pCount || 0,
        // 🔥 AQUI ESTÁ O FILTRO DE CARRINHOS ABANDONADOS 🔥
        abandoned: (cartsRes || []).filter((c: any) => {
          const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
          const isOldEnough = new Date(c.created_at).getTime() < threeMinsAgo;
          return isPendente && isOldEnough;
        }),
        videoRequests: vidsRes || []
      }
    };
  } catch (e: any) { 
    console.error("Erro no Servidor:", e);
    return { ok: false, error: e.message }; 
  }
}

// 🔥 CENTRAL DE AÇÕES (POST) 🔥
export async function runAdminAction(action: string, payload: any) {
  try {
    const supabase = getSupabase();

    if (action === "resetSystem") {
      await Promise.all([
        supabase.from('Transactions').delete().neq('id', '000'),
        supabase.from('SpinHistory').delete().neq('id', '000'),
        supabase.from('Withdrawals').delete().neq('id', '000'),
        supabase.from('AbandonedCarts').delete().neq('id', '000')
      ]);
    }

    if (action === "saveGlobal") {
      await supabase.from('GlobalSettings').update({
        announcement_msg: payload.globalMsg,
        ranking_visible: payload.rankVisible,
        goal_amount: payload.goalAmount,
        goal_reward: payload.goalReward,
        updated_at: new Date().toISOString()
      }).eq('id', 'main');
    }

    if (action === "approveWithdrawal") {
      await supabase.from('Withdrawals').update({ status: 'pago', is_read: false }).eq('id', payload.id);
    }

    if (action === "ignoreAbandoned") {
      await supabase.from('AbandonedCarts').update({ status: 'ignorado' }).eq('id', payload.id);
    }

    if (action === "approveApplication") {
      const generatedEmail = payload.email || `${payload.nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${payload.nickname.charAt(0).toUpperCase()}${payload.nickname.slice(1)}Labz2026!`;
      
      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: payload.nickname.toLowerCase(), email: generatedEmail, password: generatedPass,
        full_name: payload.full_name, whatsapp: payload.whatsapp, referred_by: payload.referred_by || null
      }).select().single();

      if (mErr || !m) throw new Error("Erro ao criar modelo.");

      await supabase.from('Configs').insert({ 
        model_id: m.id, model_name: payload.nickname.toUpperCase(), spin_cost: 2, 
        bg_url: payload.bg_url, profile_url: payload.profile_url || payload.bg_url 
      });

      await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);
      return { ok: true, data: { generatedEmail, generatedPass } };
    }

    if (action === "rejectApplication") {
      await supabase.from('Applications').delete().eq('id', payload.id);
    }

    if (action === "createModel") {
      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: payload.slug.toLowerCase(), email: payload.email, password: payload.password, referred_by: payload.referred_by || null
      }).select().single();
      if (mErr || !m) throw new Error("Erro ao criar modelo manual.");
      await supabase.from('Configs').insert({ model_id: m.id, model_name: payload.slug.toUpperCase(), spin_cost: 2 });
    }

    if (action === "deleteModel") {
      await supabase.from('Configs').delete().eq('model_id', payload.id);
      await supabase.from('Prize').delete().eq('model_id', payload.id);
      await supabase.from('Models').delete().eq('id', payload.id);
    }

    return { ok: true };
  } catch (e: any) { 
    return { ok: false, error: e.message }; 
  }
}
