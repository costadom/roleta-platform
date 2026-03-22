"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2 } from "lucide-react";

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

  const fetchData = async () => {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      
      const [resMod, resHist, resGlob, resTrans, resWith, resApp, resPlayers, resAbandon] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?select=*&order=created_at.asc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=*&order=created_at.desc&limit=100`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Transactions?select=*&order=created_at.desc&limit=100`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Applications?status=eq.pendente&select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Players?select=id`, { headers }).catch(() => ({ ok: false, json: () => [] })),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?status=eq.pendente&order=created_at.desc&limit=50`, { headers })
      ]);

      const dataHist = resHist.ok ? await resHist.json() : [];

      if (resMod.ok) setModels(await resMod.json());
      setHistory(dataHist);
      if (resTrans.ok) setTransactions(await resTrans.json());
      if (resWith.ok) setWithdrawals(await resWith.json());
      if (resApp.ok) setApplications(await resApp.json());
      if (resAbandon.ok) setAbandoned(await resAbandon.json());

      if (resGlob.ok) {
        const dataGlob = await resGlob.json();
        if (dataGlob[0]) {
          setGlobalMsg(dataGlob[0].announcement_msg);
          setRankVisible(dataGlob[0].ranking_visible);
          setGoalAmount(dataGlob[0].goal_amount);
          setGoalReward(dataGlob[0].goal_reward);
        }
      }

      if (resPlayers && resPlayers.ok) {
        const pData = await resPlayers.json();
        setTotalPlayers(pData.length);
      } else {
        const uniquePlayers = new Set(dataHist.map((h: any) => h.player_phone).filter(Boolean)).size;
        setTotalPlayers(uniquePlayers);
      }

    } catch (err) { console.error("Erro no fetch", err); } finally { setInitialLoading(false); }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") { setIsLogged(true); fetchData(); } else { setInitialLoading(false); }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true");
      setIsLogged(true); setInitialLoading(true); fetchData();
    } else { alert("Acesso negado!"); }
  };

  const handleResetSystem = async () => {
    const confirmText = prompt("ATENÇÃO: ZERAR SISTEMA?\n\nDigite ZERARTUDO para confirmar:");
    if (confirmText !== "ZERARTUDO") return;
    setInitialLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      await fetch(`${supabaseUrl}/rest/v1/Transactions?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/Models?id=not.is.null`, { method: 'PATCH', headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, terms_accepted: false }) });
      alert("Limpeza concluída!"); fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleSaveGlobal = async (valRanking?: boolean) => {
    setSavingGlobal(true);
    const isVisible = typeof valRanking === 'boolean' ? valRanking : rankVisible;
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_msg: globalMsg, ranking_visible: isVisible, goal_amount: goalAmount, goal_reward: goalReward, updated_at: new Date().toISOString() })
      });
    } catch (err) {} finally { setSavingGlobal(false); }
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

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pendente');

  if (initialLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FF1493]" size={40}/></div>;

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
      <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black uppercase text-white mb-8 italic">PAINEL MASTER</h1>
      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <input type="email" placeholder="EMAIL MASTER" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
        <div className="relative"><input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" value={adminPass} onChange={e => setAdminPass(e.target.value)} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
        <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase">Acessar</button>
      </form>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter">SAVANAH <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">MASTER DASHBOARD</p></div>
          <div className="flex flex-wrap items-center gap-3"><button onClick={handleResetSystem} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase">ZERAR TUDO</button><button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16}/> Criar Manual</button><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30"><Lock size={18}/></button></div>
        </div>

        {/* CARDS FINANCEIROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Vendas Totais</p><h3 className="text-4xl font-black">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro (30%)</p><h3 className="text-4xl font-black">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-blue-500 uppercase mb-1">Clientes</p><h3 className="text-4xl font-black">{totalPlayers}</h3></div>
        </div>

        <h2 className="text-[11px] font-black uppercase text-white/40 mb-6 flex items-center gap-2"><Users size={14}/> Gestão de Unidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                <div className="flex gap-2">
                  {/* 🔥 BOTÃO DE GERENCIAR CLIENTES (EXCLUSIVO SUPER ADMIN) 🔥 */}
                  <button onClick={() => router.push(`/admin/models/${m.id}/players`)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all" title="Gerenciar Clientes desta Modelo">
                    <Users size={16}/>
                  </button>
                  <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                  <button onClick={() => handleDelete(m.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-black uppercase text-lg mb-1">{m.slug}</h3>
              <p className="text-[10px] text-emerald-400 font-bold mb-4 tracking-widest">GANHOS: {(financialData.byModel[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Mail size={10}/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Key size={10}/> {m.password}</div></div>
              
              {m.whatsapp && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                   <input type="text" placeholder="Mensagem rápida..." className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none" value={customMessages[m.id] || ""} onChange={(e) => setCustomMessages({ ...customMessages, [m.id]: e.target.value })} />
                   <button onClick={() => { const msg = customMessages[m.id] || `Oi ${m.slug}!`; window.open(`https://wa.me/${m.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank'); }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-2 rounded-xl"><MessageCircle size={16}/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
