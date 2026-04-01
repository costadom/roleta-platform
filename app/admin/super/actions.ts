"use server";

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
};

// ESPIÃO: Transformamos as respostas em STRING para o Next.js nunca mais engasgar na tela
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

    const result = {
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
    };
    
    // Retorna stringificado para burlar o erro do Server Component
    return JSON.stringify(result);
  } catch (e: any) { 
    console.error("Erro no Servidor:", e);
    return JSON.stringify({ ok: false, error: e.message }); 
  }
}

// O payload agora é uma string para evitar o erro 500 do Next.js
export async function runAdminAction(action: string, payloadStr: string) {
  try {
    const supabase = getSupabase();
    // Transforma a string de volta em objeto de forma segura
    const payload = payloadStr ? JSON.parse(payloadStr) : {};

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
      // Criação segura de dados mesmo se a modelo não preencheu direito
      const safeNickname = payload.nickname ? payload.nickname.replace(/\s+/g, '') : `musa${Date.now().toString().slice(-4)}`;
      const generatedEmail = payload.email || `${safeNickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `BlackjadeLabz2026!`;
      
      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: safeNickname.toLowerCase(), 
        email: generatedEmail, 
        password: generatedPass,
        full_name: payload.full_name || 'Musa Labz', 
        whatsapp: payload.whatsapp || '', 
        referred_by: payload.referred_by || null
      }).select().single();

      // ESPIÃO LABZ: Se o banco de dados recusar, ele vai gritar o motivo exato
      if (mErr || !m) {
        throw new Error(`[ERRO TABELA MODELS]: ${mErr?.message || 'Falha ao inserir'} | Detalhes: ${mErr?.details || mErr?.hint || 'Nenhum'}`);
      }

      const { error: cErr } = await supabase.from('Configs').insert({ 
        model_id: m.id, 
        model_name: safeNickname.toUpperCase(), 
        spin_cost: 2, 
        bg_url: payload.bg_url || null, 
        profile_url: payload.profile_url || payload.bg_url || null 
      });

      // ESPIÃO LABZ: Se as configurações falharem, ele apaga a modelo pra não deixar "fantasma" e avisa
      if (cErr) {
        await supabase.from('Models').delete().eq('id', m.id);
        throw new Error(`[ERRO TABELA CONFIGS]: ${cErr.message}`);
      }

      await supabase.from('Applications').update({ status: 'aprovada' }).eq('id', payload.id);
      
      return JSON.stringify({ ok: true, data: { generatedEmail, generatedPass } });
    }

    if (action === "rejectApplication") {
      await supabase.from('Applications').delete().eq('id', payload.id);
    }

    if (action === "createModel") {
      const { data: m, error: mErr } = await supabase.from('Models').insert({
        slug: payload.slug.toLowerCase(), email: payload.email, password: payload.password, referred_by: payload.referred_by || null
      }).select().single();
      
      if (mErr || !m) throw new Error(`[ERRO CRIAR MANUAL]: ${mErr?.message}`);
      
      await supabase.from('Configs').insert({ model_id: m.id, model_name: payload.slug.toUpperCase(), spin_cost: 2 });
    }

    if (action === "deleteModel") {
      await supabase.from('Configs').delete().eq('model_id', payload.id);
      await supabase.from('Prize').delete().eq('model_id', payload.id);
      await supabase.from('Models').delete().eq('id', payload.id);
    }

    return JSON.stringify({ ok: true });
  } catch (e: any) { 
    // Retorna o erro exato como texto pro front-end ler
    return JSON.stringify({ ok: false, error: e.message || String(e) }); 
  }
}
