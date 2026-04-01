"use server";

import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
};

// Sanitiza o objeto para não explodir o Next.js com undefined ou datas esquisitas
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] === undefined) {
      newObj[key] = null;
    } else {
      newObj[key] = sanitize(obj[key]);
    }
  }
  return newObj;
}

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
    
    return JSON.stringify(sanitize(result));
  } catch (e: any) { 
    console.error("Erro no Servidor:", e);
    return JSON.stringify({ ok: false, error: e.message }); 
  }
}

export async function runAdminAction(action: string, payloadStr: string) {
  try {
    const supabase = getSupabase();
    const payload = sanitize(payloadStr ? JSON.parse(payloadStr) : {});

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
      const safeNickname = payload.nickname ? payload.nickname.replace(/\s+/g, '') : `musa${Date.now().toString().slice(-4)}`;
      const generatedEmail = payload.email || `${safeNickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `BlackjadeLabz2026!`;
      
      // 🔥 CORREÇÃO DA CAUSA RAIZ: Tratamento do referred_by (Madrinha) 🔥
      // O banco de dados exige um UUID válido na coluna referred_by ou nulo.
      // A ficha envia o slug (ex: "raphasavanah"). Vamos buscar o UUID real!
      let safeReferredBy = null;
      if (payload.referred_by && typeof payload.referred_by === 'string' && payload.referred_by.trim() !== '') {
          // Busca o ID real da madrinha usando o slug dela
          const { data: madrinha } = await supabase.from('Models').select('id').eq('slug', payload.referred_by.trim().toLowerCase()).single();
          if (madrinha && madrinha.id) {
              safeReferredBy = madrinha.id;
          }
      }
      
      // Limpeza pesada de todos os dados antes de jogar pro Supabase
      const insertData = {
        slug: safeNickname.toLowerCase(), 
        email: generatedEmail, 
        password: generatedPass,
        full_name: payload.full_name || 'Musa Labz', 
        whatsapp: payload.whatsapp ? String(payload.whatsapp).replace(/\D/g, '') : null, 
        cpf: payload.cpf ? String(payload.cpf).replace(/\D/g, '') : null,
        referred_by: safeReferredBy // Agora é null ou um UUID válido!
      };

      const { data: m, error: mErr } = await supabase.from('Models').insert(insertData).select().single();

      if (mErr || !m) {
        throw new Error(`[ERRO BANCO DE DADOS MODELS]: ${mErr?.message} | Dica: O slug ${safeNickname} ou e-mail ${generatedEmail} já existem?`);
      }

      const { error: cErr } = await supabase.from('Configs').insert({ 
        model_id: m.id, 
        model_name: safeNickname.toUpperCase(), 
        spin_cost: 2, 
        bg_url: payload.bg_url || null, 
        profile_url: payload.profile_url || payload.bg_url || null 
      });

      if (cErr) {
        await supabase.from('Models').delete().eq('id', m.id);
        throw new Error(`[ERRO BANCO DE DADOS CONFIGS]: ${cErr.message}`);
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
    return JSON.stringify({ ok: false, error: e.message || String(e) }); 
  }
}
