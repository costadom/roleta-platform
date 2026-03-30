"use server";

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function getSuperData() {
  try {
    const supabase = getSupabase();
    
    // Busca tudo em paralelo no SERVIDOR (Isso não dá erro de CORS)
    const [
      { data: glob }, { data: mods }, { data: trans },
      { data: withs }, { data: apps }, { count: pCount },
      { data: carts }, { data: vids }
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

    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    return {
      ok: true,
      data: {
        global: glob || null,
        models: mods || [],
        transactions: trans || [],
        withdrawals: withs || [],
        applications: (apps || []).filter(a => !a.status || a.status.toLowerCase() === 'pendente'),
        totalPlayers: pCount || 0,
        abandoned: (carts || []).filter(c => (!c.status || c.status === 'pendente') && c.created_at < threeMinsAgo),
        videoRequests: vids || []
      }
    };
  } catch (e: any) { 
    console.error("Erro no Servidor:", e);
    return { ok: false, error: e.message }; 
  }
}

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
      await supabase.from('Withdrawals').update({ status: 'pago' }).eq('id', payload.id);
    }

    if (action === "ignoreAbandoned") {
      await supabase.from('AbandonedCarts').update({ status: 'ignorado' }).eq('id', payload.id);
    }

    if (action === "approveApplication") {
        const generatedEmail = payload.email || `${payload.nickname.toLowerCase()}@labzsexy.com`;
        const generatedPass = `${payload.nickname.charAt(0).toUpperCase()}${payload.nickname.slice(1)}Labz2026!`;
        const { data: m } = await supabase.from('Models').insert({
            slug: payload.nickname.toLowerCase(), email: generatedEmail, password: generatedPass,
            full_name: payload.full_name, whatsapp: payload.whatsapp, referred_by: payload.referred_by || null
        }).select().single();
        if (m) {
            await supabase.from('Configs').insert({ model_id: m.id, model_name: payload.nickname.toUpperCase(), spin_cost: 2, bg_url: payload.bg_url, profile_url: payload.profile_url || payload.bg_url });
            await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);
            return { ok: true, data: { generatedEmail, generatedPass } };
        }
    }

    if (action === "rejectApplication") { await supabase.from('Applications').delete().eq('id', payload.id); }
    if (action === "deleteModel") {
        await supabase.from('Configs').delete().eq('model_id', payload.id);
        await supabase.from('Prize').delete().eq('model_id', payload.id);
        await supabase.from('Models').delete().eq('id', payload.id);
    }

    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
