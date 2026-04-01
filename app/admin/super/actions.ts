"use server";

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
};

// 🔥 LIMPEZA SÊNIOR (Dica do Claude): Remove undefined sem quebrar a estrutura de Objeto
const sanitizeForNext = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? null : value)));
};

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

    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    return sanitizeForNext({
      ok: true,
      data: {
        global: globRes || null,
        models: modelsRes || [],
        transactions: transRes || [],
        withdrawals: withsRes || [],
        applications: (appsRes || []).filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'),
        totalPlayers: pCount || 0,
        abandoned: (cartsRes || []).filter((c: any) => {
          const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
          return isPendente && c.created_at < threeMinsAgo;
        }),
        videoRequests: vidsRes || []
      }
    });
  } catch (e: any) { 
    console.error("Erro no Servidor:", e);
    return sanitizeForNext({ ok: false, error: e.message }); 
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
        recharge_packages: payload.rechargePackages,
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
      // 🔥 BURLA O LIMITE DE 1MB: Busca a ficha no banco em vez de receber pela rede 🔥
      const { data: appData } = await supabase.from('Applications').select('*').eq('id', payload.id).single();
      if (!appData) throw new Error("Candidatura não encontrada.");

      const safeNickname = appData.nickname ? appData.nickname.replace(/\s+/g, '') : `musa${Date.now().toString().slice(-4)}`;
      const generatedEmail = appData.email || `${safeNickname.toLowerCase()}@labzsexy.com`;
      
      // 🔥 SENHA DINÂMICA: Primeira letra maiúscula + Labz2026!
      const generatedPass = `${safeNickname.charAt(0).toUpperCase()}${safeNickname.slice(1).toLowerCase()}Labz2026!`;

      // 🔥 CORREÇÃO DA MADRINHA: Pega o UUID pelo slug
      let safeReferredBy = null;
      if (appData.referred_by && typeof appData.referred_by === 'string' && appData.referred_by.trim() !== '') {
          const { data: madrinha } = await supabase.from('Models').select('id').eq('slug', appData.referred_by.trim().toLowerCase()).single();
          if (madrinha && madrinha.id) safeReferredBy = madrinha.id;
      }

      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: safeNickname.toLowerCase(), 
        email: generatedEmail, 
        password: generatedPass,
        full_name: appData.full_name || 'Musa Labz', 
        whatsapp: appData.whatsapp ? String(appData.whatsapp).replace(/\D/g, '') : null, 
        cpf: appData.cpf ? String(appData.cpf).replace(/\D/g, '') : null,
        referred_by: safeReferredBy
      }).select().single();

      if (mErr || !m) throw new Error(`[ERRO MODELS]: ${mErr?.message}`);

      // 🔥 CORREÇÃO DO CREATED_AT: Adicionada a data forçada
      const { error: cErr } = await supabase.from('Configs').insert({ 
        model_id: m.id, 
        model_name: safeNickname.toUpperCase(), 
        spin_cost: 2, 
        bg_url: appData.bg_url || null, 
        profile_url: appData.profile_url || appData.bg_url || null,
        created_at: new Date().toISOString()
      });

      if (cErr) {
        await supabase.from('Models').delete().eq('id', m.id);
        throw new Error(`[ERRO CONFIGS]: ${cErr.message}`);
      }

      await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);
      
      return sanitizeForNext({ ok: true, data: { generatedEmail, generatedPass, full_name: appData.full_name, whatsapp: appData.whatsapp } });
    }

    if (action === "rejectApplication") {
      await supabase.from('Applications').delete().eq('id', payload.id);
    }

    if (action === "createModel") {
      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: payload.slug.toLowerCase(), email: payload.email, password: payload.password, referred_by: payload.referred_by || null
      }).select().single();
      
      if (mErr || !m) throw new Error(`Erro ao criar modelo: ${mErr?.message}`);
      
      await supabase.from('Configs').insert({ 
        model_id: m.id, 
        model_name: payload.slug.toUpperCase(), 
        spin_cost: 2,
        created_at: new Date().toISOString()
      });
    }

    if (action === "deleteModel") {
      await supabase.from('Configs').delete().eq('model_id', payload.id);
      await supabase.from('Prize').delete().eq('model_id', payload.id);
      await supabase.from('Models').delete().eq('id', payload.id);
    }

    return sanitizeForNext({ ok: true });
  } catch (e: any) { 
    return sanitizeForNext({ ok: false, error: e.message || String(e) }); 
  }
}
