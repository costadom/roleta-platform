import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não encontrada no servidor.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      globalRes,
      modelsRes,
      transactionsRes,
      withdrawalsRes,
      applicationsRes,
      playersRes,
      abandonedRes,
      videoRequestsRes,
    ] = await Promise.all([
      supabase
        .from("GlobalSettings")
        .select("*")
        .eq("id", "main")
        .maybeSingle(),

      supabase
        .from("Models")
        .select(
          "id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at,full_name"
        )
        .order("created_at", { ascending: true }),

      supabase
        .from("Transactions")
        .select("real_amount,platform_cut,model_cut,model_id,created_at")
        .order("created_at", { ascending: false })
        .limit(100),

      supabase
        .from("Withdrawals")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("Applications")
        .select("*"),

      supabase
        .from("Players")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("AbandonedCarts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),

      supabase
        .from("VideoRequests")
        .select("*, Models(slug,whatsapp,full_name)")
        .eq("status", "pago"),
    ]);

    const errors = [
      globalRes.error,
      modelsRes.error,
      transactionsRes.error,
      withdrawalsRes.error,
      applicationsRes.error,
      playersRes.error,
      abandonedRes.error,
      videoRequestsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      const message = errors.map((e: any) => e.message).join(" | ");
      console.error("Erro no GET /api/sys-data:", message);
      return jsonError(message, 500);
    }

    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;

    const applications =
      (applicationsRes.data || []).filter(
        (a: any) => !a.status || String(a.status).toLowerCase() === "pendente"
      );

    const abandoned =
      (abandonedRes.data || []).filter((c: any) => {
        const isPendente =
          !c.status || String(c.status).toLowerCase() === "pendente";
        const isOldEnough = new Date(c.created_at).getTime() < threeMinutesAgo;
        return isPendente && isOldEnough;
      });

    return NextResponse.json({
      ok: true,
      data: {
        global: globalRes.data || null,
        models: modelsRes.data || [],
        transactions: transactionsRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        applications,
        totalPlayers: playersRes.count || 0,
        abandoned,
        videoRequests: videoRequestsRes.data || [],
      },
    });
  } catch (error: any) {
    console.error("Erro fatal no GET /api/sys-data:", error);
    return jsonError(error?.message || "Erro interno ao carregar dados.", 500);
  }
}

export async function POST(request: Request) {
  let action = "desconhecida";

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    action = body?.action;
    const payload = body?.payload ?? {};

    if (!action) {
      return jsonError("Nenhuma ação informada.", 400);
    }

    if (action === "resetSystem") {
      const [t1, t2, t3, t4] = await Promise.all([
        supabase.from("Transactions").delete().not("id", "is", null),
        supabase.from("SpinHistory").delete().not("id", "is", null),
        supabase.from("Withdrawals").delete().not("id", "is", null),
        supabase.from("AbandonedCarts").delete().not("id", "is", null),
      ]);

      const errors = [t1.error, t2.error, t3.error, t4.error].filter(Boolean);
      if (errors.length) {
        throw new Error(errors.map((e: any) => e.message).join(" | "));
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "saveGlobal") {
      const { globalMsg, rankVisible, goalAmount, goalReward } = payload;

      const { error } = await supabase
        .from("GlobalSettings")
        .update({
          announcement_msg: globalMsg,
          ranking_visible: rankVisible,
          goal_amount: goalAmount,
          goal_reward: goalReward,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "main");

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "approveWithdrawal") {
      const { id } = payload;

      const { error } = await supabase
        .from("Withdrawals")
        .update({ status: "pago", is_read: false })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "ignoreAbandoned") {
      const { id } = payload;

      const { error } = await supabase
        .from("AbandonedCarts")
        .update({ status: "ignorado" })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "approveApplication") {
      const now = new Date().toISOString();
      const nickname = String(payload.nickname || "").trim();

      if (!nickname) {
        return jsonError("Nickname da candidatura não informado.", 400);
      }

      const capNick = nickname.charAt(0).toUpperCase() + nickname.slice(1);
      const generatedEmail =
        payload.email || `${nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${capNick}Labz2026!`;

      const { data: newModel, error: modelError } = await supabase
        .from("Models")
        .insert({
          slug: nickname.toLowerCase(),
          email: generatedEmail,
          password: generatedPass,
          full_name: payload.full_name,
          whatsapp: payload.whatsapp,
          created_at: now,
          referred_by: payload.referred_by || null,
        })
        .select("*")
        .single();

      if (modelError || !newModel) {
        throw new Error(modelError?.message || "Erro ao criar modelo.");
      }

      const { error: cfgError } = await supabase
        .from("Configs")
        .insert({
          model_id: newModel.id,
          model_name: nickname.toUpperCase(),
          spin_cost: 2,
          bg_url: payload.bg_url,
          profile_url: payload.profile_url || payload.bg_url,
          created_at: now,
        });

      if (cfgError) {
        await supabase.from("Models").delete().eq("id", newModel.id);
        throw new Error(cfgError.message || "Erro ao criar config da modelo.");
      }

      const { error: appError } = await supabase
        .from("Applications")
        .update({ status: "aprovada" })
        .eq("id", payload.id);

      if (appError) {
        throw new Error(appError.message || "Erro ao atualizar candidatura.");
      }

      return NextResponse.json({
        ok: true,
        data: {
          generatedEmail,
          generatedPass,
        },
      });
    }

    if (action === "rejectApplication") {
      const { id } = payload;

      const { error } = await supabase
        .from("Applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "createModel") {
      const now = new Date().toISOString();

      const { data: newModel, error: modelError } = await supabase
        .from("Models")
        .insert({
          slug: String(payload.slug || "").toLowerCase(),
          email: payload.email,
          password: payload.password,
          created_at: now,
          referred_by: payload.referred_by || null,
        })
        .select("*")
        .single();

      if (modelError || !newModel) {
        throw new Error(modelError?.message || "Erro ao criar modelo manual.");
      }

      const { error: cfgError } = await supabase
        .from("Configs")
        .insert({
          model_id: newModel.id,
          model_name: String(payload.slug || "").toUpperCase(),
          spin_cost: 2,
          created_at: now,
        });

      if (cfgError) {
        await supabase.from("Models").delete().eq("id", newModel.id);
        throw new Error(cfgError.message || "Erro ao criar config da modelo.");
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "deleteModel") {
      const { id } = payload;

      const [cfgRes, prizeRes, modelRes] = await Promise.all([
        supabase.from("Configs").delete().eq("model_id", id),
        supabase.from("Prize").delete().eq("model_id", id),
        supabase.from("Models").delete().eq("id", id),
      ]);

      const errors = [cfgRes.error, prizeRes.error, modelRes.error].filter(Boolean);
      if (errors.length) {
        throw new Error(errors.map((e: any) => e.message).join(" | "));
      }

      return NextResponse.json({ ok: true });
    }

    return jsonError("Ação desconhecida.", 400);
  } catch (error: any) {
    console.error(`Erro no POST /api/sys-data [${action}]:`, error);
    return jsonError(error?.message || "Erro na execução da ação.", 500);
  }
}
