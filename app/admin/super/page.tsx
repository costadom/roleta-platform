// app/admin/super/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// OTIMIZAÇÕES APLICADAS:
//
// fetchData() — já tinha dois estágios; foram mantidos e refinados:
//
//  BATCH A (crítico, bloqueia tela):
//    • GlobalSettings + Models em Promise.all (2 requests simultâneos)
//    • setInitialLoading(false) logo após → UI aparece imediatamente
//
//  BATCH B (não crítico, fire-and-forget):
//    • Transactions, Withdrawals, Applications, Players count,
//      AbandonedCarts e VideoRequests — todos em Promise.all (6 simultâneos)
//    • Antes: 6 requests sequenciais → agora: 1 round-trip paralelo
//
// handleApproveApplication():
//    • Após criar o Model, o INSERT em Configs e o PATCH em Applications
//      são disparados em Promise.all (eram sequenciais).
//
// handleResetSystem():
//    • Os 4 DELETEs já estavam em Promise.all — mantido.
//
// handleApproveWithdrawal():
//    • Sem mudança (apenas 1 PATCH + 1 abertura de janela).
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2, Video } from "lucide-react";

export default function SuperAdmin() {
  const router = useRouter();
  const [isLogged, setIsLogged] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [models, setModels] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [abandoned, setAbandoned] = useState<any[]>([]);
  const [videoRequests, setVideoRequests] = useState<any[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newModel, setNewModel] = useState({ slug: "", email: "", password: "", referred_by: "" });

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [globalMsg, setGlobalMsg] = useState("");
  const [rankVisible, setRankVisible] = useState(false);
  const [goalAmount, setGoalAmount] = useState(1000);
  const [goalReward, setGoalReward] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseHeaders = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

  const fetchData = async () => {
    try {
      // ── BATCH A: essencial — libera a tela em ~1 round-trip ──
      const [resGlob, resMod] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc`, { headers: baseHeaders }),
      ]);

      if (resGlob.ok) {
        const dataGlob = await resGlob.json();
        if (dataGlob[0]) {
          setGlobalMsg(dataGlob[0].announcement_msg);
          setRankVisible(dataGlob[0].ranking_visible);
          setGoalAmount(dataGlob[0].goal_amount);
          setGoalReward(dataGlob[0].goal_reward);
        }
      }

      if (resMod.ok) setModels(await resMod.json());

      // ── UI liberada ──
      setInitialLoading(false);

      // ── BATCH B: dados pesados em paralelo, sem bloquear ──
      Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/Applications?select=*`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/Players?select=id`, { headers: { ...baseHeaders, "Prefer": "count=exact" } }).catch(() => ({ ok: false, headers: new Headers() })),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?select=*&order=created_at.desc&limit=500`, { headers: baseHeaders }),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?status=eq.pago&select=*,Models(slug,whatsapp,full_name)`, { headers: baseHeaders }),
      ]).then(async ([resTrans, resWith, resApp, resPlayers, resAbandon, resVideos]) => {
        if (resTrans.ok) setTransactions(await resTrans.json());
        if (resWith.ok) setWithdrawals(await resWith.json());
        if (resVideos.ok) setVideoRequests(await resVideos.json());

        if (resApp.ok) {
          const apps = await resApp.json();
          setApplications(apps.filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'));
        }

        if (resAbandon.ok) {
          const carts = await resAbandon.json();
          const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).getTime();
          setAbandoned(carts.filter((c: any) => {
            const isPendente = !c.status || c.status.toLowerCase() === 'pendente';
            const isOldEnough = new Date(c.created_at).getTime() < threeMinutesAgo;
            return isPendente && isOldEnough;
          }));
        }

        if (resPlayers && (resPlayers as any).headers) {
          const range = (resPlayers as any).headers.get("content-range");
          if (range) setTotalPlayers(parseInt(range.split("/")[1]));
        }
      });

    } catch (err) {
      console.error("Erro no fetch", err);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") {
      setIsLogged(true);
      fetchData();
    } else {
      setInitialLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true");
      setIsLogged(true); setInitialLoading(true); fetchData();
    } else { alert("Acesso negado!"); }
  };

  const handleResetSystem = async () => {
    const confirmText = prompt("ATENÇÃO: ZERAR SISTEMA?\nDigite ZERARTUDO:");
    if (confirmText !== "ZERARTUDO") return;
    setInitialLoading(true);
    try {
      const h = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      // Já estava em Promise.all — mantido
      await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Transactions?id=not.is.null`, { method: 'DELETE', headers: h }),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=not.is.null`, { method: 'DELETE', headers: h }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=not.is.null`, { method: 'DELETE', headers: h }),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=not.is.null`, { method: 'DELETE', headers: h }),
      ]);
      fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_msg: globalMsg, ranking_visible: rankVisible, goal_amount: goalAmount, goal_reward: goalReward, updated_at: new Date().toISOString() })
      });
    } catch (err) {} finally { setSavingGlobal(false); }
  };

  const handleApproveWithdrawal = async (id: string, amount: number, modelId: string, modelName: string, modelPhone: string) => {
    if (!confirm(`Pagar R$ ${amount.toFixed(2)}?`)) return;
    try {
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${id}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'pago', is_read: false })
      });
      if (modelPhone) window.open(`https://wa.me/${modelPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${amount.toFixed(2)} foi enviado!`)}`, '_blank');
      fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Aprovar ${app.nickname}?`)) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const capNick = app.nickname.charAt(0).toUpperCase() + app.nickname.slice(1);
      const generatedEmail = app.email || `${app.nickname.toLowerCase()}@labzsexy.com`;
      const generatedPass = `${capNick}Labz2026!`;

      const payloadModel = {
        slug: app.nickname.toLowerCase(),
        email: generatedEmail,
        password: generatedPass,
        full_name: app.full_name,
        whatsapp: app.whatsapp,
        created_at: now,
        referred_by: app.referred_by || null
      };

      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payloadModel),
      });
      const dataMod = await resMod.json();

      if (dataMod && dataMod[0]) {
        const mId = dataMod[0].id;

        // INSERT em Configs + PATCH em Applications em paralelo
        await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Configs`, {
            method: "POST",
            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model_id: mId, model_name: app.nickname.toUpperCase(), spin_cost: 2, bg_url: app.bg_url, profile_url: app.profile_url || app.bg_url, created_at: now }),
          }),
          fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${app.id}`, {
            method: "PATCH",
            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ status: 'aprovada' }),
          }),
        ]);

        setSelectedApp(null);
        fetchData();

        const msg = `Oii, ${app.full_name.split(' ')[0]}! Que alegria ter você com a gente!\n\nA sua Plataforma LabzSexy exclusiva já está 100% configurada e pronta pra você faturar muito!\n\nLink do seu Painel: https://labzsexyroll.vercel.app/admin\n\nLogin: ${generatedEmail}\nSenha: ${generatedPass}\n\nQualquer dúvida, é só me chamar aqui. Bora fazer muito dinheiro!`;
        window.location.href = `https://wa.me/${app.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
      }
    } catch (err) { alert("Erro ao aprovar."); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const now = new Date().toISOString();
      const payloadModel = {
        slug: newModel.slug.toLowerCase(),
        email: newModel.email,
        password: newModel.password,
        created_at: now,
        referred_by: newModel.referred_by || null
      };

      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payloadModel),
      });
      const dataMod = await resMod.json();

      if (dataMod && dataMod[0]) {
        const mId = dataMod[0].id;
        await fetch(`${supabaseUrl}/rest/v1/Configs`, {
          method: "POST",
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model_id: mId, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }),
        });
      }
      setShowModal(false); fetchData();
    } catch (err) {} finally { setLoading(false); }
  };

  const financialData = useMemo(() => {
    let totalSales = 0, totalPlatform = 0, totalModels = 0;
    const byModel: Record<string, number> = {};
    transactions.forEach(t => {
      totalSales += Number(t.real_amount) || 0;
      totalPlatform += Number(t.platform_cut) || 0;
      totalModels += Number(t.model_cut) || 0;
      byModel[t.model_id] = (byModel[t.model_id] || 0) + (Number(t.real_amount) || 0);
    });
    return { totalSales, totalPlatform, totalModels, byModel };
  }, [transactions]);

  // ── O JSX é 100% idêntico ao original — não foi alterado ──
  // Cole aqui o return completo do seu arquivo original.
  // Apenas as funções de dados acima foram otimizadas.

  if (initialLoading) return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="animate-spin text-[#FF1493]" size={40}/></div>;

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center">
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/>
        <h1 className="text-xl font-black text-white mb-8">PAINEL MASTER</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
          <div className="relative">
            <input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>
          <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Acessar</button>
        </form>
      </div>
    </div>
  );

  // Cole o return principal do seu arquivo original aqui.
  // Nenhuma linha do JSX foi alterada — apenas as funções de fetch.
  return <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">{/* JSX original aqui */}</div>;
}
