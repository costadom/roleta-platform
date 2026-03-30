import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

function getSupabaseAdmin() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function errorResponse(error: unknown, fallback = "Erro interno no servidor") {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : fallback;

  console.error("[/api/sys-data]", message, error);
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
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
      supabase.from("GlobalSettings").select("*").eq("id", "main").limit(1),
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
      supabase.from("Withdrawals").select("*").order("created_at", { ascending: false }),
      supabase.from("Applications").select("*"),
      supabase.from("Players").select("id", { count: "exact", head: true }),
      supabase.from("AbandonedCarts").select("*").order("created_at", { ascending: false }).limit(500),
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
      throw new Error(errors.map((e: any) => e.message).join(" | "));
    }

    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;

    const applications =
      (applicationsRes.data || []).filter(
        (a: any) => !a.status || String(a.status).toLowerCase() === "pendente"
      ) || [];

    const abandoned =
      (abandonedRes.data || []).filter((c: any) => {
        const isPendente = !c.status || String(c.status).toLowerCase() === "pendente";
        const createdAt = new Date(c.created_at).getTime();
        return isPendente && createdAt < threeMinutesAgo;
      }) || [];

    return NextResponse.json({
      ok: true,
      data: {
        global: globalRes.data?.[0] || null,
        models: modelsRes.data || [],
        transactions: transactionsRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        applications,
        totalPlayers: playersRes.count || 0,
        abandoned,
        videoRequests: videoRequestsRes.data || [],
      },
    });
  } catch (error) {
    return errorResponse(error, "Erro ao carregar dados do painel");
  }
}

export async function POST(request: NextRequest) {
  let action = "";

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    action = body?.action || "";
    const payload = body?.payload || {};

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Nenhuma ação foi informada." },
        { status: 400 }
      );
    }

    if (action === "resetSystem") {
      const [transactionsDel, spinHistoryDel, withdrawalsDel, abandonedDel] =
        await Promise.all([
          supabase.from("Transactions").delete().not("id", "is", null),
          supabase.from("SpinHistory").delete().not("id", "is", null),
          supabase.from("Withdrawals").delete().not("id", "is", null),
          supabase.from("AbandonedCarts").delete().not("id", "is", null),
        ]);

      const errors = [
        transactionsDel.error,
        spinHistoryDel.error,
        withdrawalsDel.error,
        abandonedDel.error,
      ].filter(Boolean);

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
        .update({
          status: "pago",
          is_read: false,
        })
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
      const fullName = String(payload.full_name || "").trim();
      const whatsapp = String(payload.whatsapp || "").trim();

      if (!nickname || !fullName || !whatsapp) {
        return NextResponse.json(
          { ok: false, error: "Dados obrigatórios da candidatura estão incompletos." },
          { status: 400 }
        );
      }

      const capNick = nickname.charAt(0).toUpperCase() + nickname.slice(1);
      const generatedEmail = payload.email || `${nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${capNick}Labz2026!`;

      const { data: createdModel, error: modelError } = await supabase
        .from("Models")
        .insert({
          slug: nickname.toLowerCase(),
          email: generatedEmail,
          password: generatedPass,
          full_name: fullName,
          whatsapp,
          created_at: now,
          referred_by: payload.referred_by || null,
        })
        .select("*")
        .single();

      if (modelError || !createdModel) {
        throw new Error(modelError?.message || "Erro ao criar modelo.");
      }

      const { error: configError } = await supabase.from("Configs").insert({
        model_id: createdModel.id,
        model_name: nickname.toUpperCase(),
        spin_cost: 2,
        bg_url: payload.bg_url || null,
        profile_url: payload.profile_url || payload.bg_url || null,
        created_at: now,
      });

      if (configError) {
        await supabase.from("Models").delete().eq("id", createdModel.id);
        throw new Error(configError.message || "Erro ao criar configuração da modelo.");
      }

      const { error: applicationError } = await supabase
        .from("Applications")
        .update({ status: "aprovada" })
        .eq("id", payload.id);

      if (applicationError) {
        throw new Error(applicationError.message || "Erro ao atualizar candidatura.");
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

      const { error } = await supabase.from("Applications").delete().eq("id", id);

      if (error) throw error;

      return NextResponse.json({ ok: true });
    }

    if (action === "createModel") {
      const now = new Date().toISOString();
      const slug = String(payload.slug || "").trim();
      const email = String(payload.email || "").trim();
      const password = String(payload.password || "").trim();

      if (!slug || !email || !password) {
        return NextResponse.json(
          { ok: false, error: "Slug, email e senha são obrigatórios." },
          { status: 400 }
        );
      }

      const { data: createdModel, error: modelError } = await supabase
        .from("Models")
        .insert({
          slug: slug.toLowerCase(),
          email,
          password,
          created_at: now,
          referred_by: payload.referred_by || null,
        })
        .select("*")
        .single();

      if (modelError || !createdModel) {
        throw new Error(modelError?.message || "Erro ao criar modelo.");
      }

      const { error: configError } = await supabase.from("Configs").insert({
        model_id: createdModel.id,
        model_name: slug.toUpperCase(),
        spin_cost: 2,
        created_at: now,
      });

      if (configError) {
        await supabase.from("Models").delete().eq("id", createdModel.id);
        throw new Error(configError.message || "Erro ao criar configuração da modelo.");
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "deleteModel") {
      const { id } = payload;

      const [configsDel, prizeDel, modelDel] = await Promise.all([
        supabase.from("Configs").delete().eq("model_id", id),
        supabase.from("Prize").delete().eq("model_id", id),
        supabase.from("Models").delete().eq("id", id),
      ]);

      const errors = [configsDel.error, prizeDel.error, modelDel.error].filter(Boolean);

      if (errors.length) {
        throw new Error(errors.map((e: any) => e.message).join(" | "));
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: `Ação desconhecida: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("[/api/sys-data][POST]", { action, error });
    return errorResponse(error, "Erro ao executar ação do painel");
  }
}
