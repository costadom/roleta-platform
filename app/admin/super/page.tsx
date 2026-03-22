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
      alert("Sucesso!"); fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_msg: globalMsg, ranking_visible: rankVisible, goal_amount: goalAmount, goal_reward: goalReward, updated_at: new Date().toISOString() })
      });
      alert("Salvo!");
    } catch (err) {} finally { setSavingGlobal(false); }
  };

  const handleApproveWithdrawal = async (id: string, amount: number, modelId: string, modelName: string, modelPhone: string) => {
    if (!confirm(`Pagar R$ ${amount.toFixed(2)} para ${modelName}?`)) return;
    try {
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${id}`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'pago', is_read: false })
      });
      if (modelPhone) window.open(`https://wa.me/${modelPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii, ${modelName}! Seu PIX de R$ ${amount.toFixed(2)} foi enviado! 💸✨`)}`, '_blank');
      fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Criar roleta de ${app.nickname}?`)) return;
    setLoading(true);
    // ... (Logica de aprovação completa que você já tinha)
    setLoading(false);
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

  if (initialLoading) return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="animate-spin text-[#FF1493]" size={40}/></div>;

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
      <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black uppercase text-white mb-8 italic">PAINEL MASTER</h1>
      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <input type="email" placeholder="EMAIL MASTER" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
        <input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
        <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase">Acessar</button>
      </form>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">SISTEMA MASTER</p></div>
          <div className="flex gap-3"><button onClick={handleResetSystem} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase">ZERAR SISTEMA</button><button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30"><Lock size={18}/></button></div>
        </div>

        {/* PIX ABANDONADOS - RESTAURADO */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl">
                  <p className="text-[12px] text-white font-black uppercase">{cart.player_name}</p>
                  <p className="text-[10px] text-red-400 font-bold mb-4">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                  <button onClick={() => window.open(`https://wa.me/${cart.player_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii ${cart.player_name}! Vi que o PIX na roleta da ${cart.model_name} não concluiu...`)}`, '_blank')} className="w-full bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase">Recuperar no Zap</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOLICITAÇÕES DE SAQUE - RESTAURADO */}
        {pendingWithdrawals.length > 0 && (
          <div className="mb-12 bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-amber-500 mb-4 flex items-center gap-2"><AlertCircle size={16}/> Saques Pendentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="bg-black border border-amber-500/20 p-5 rounded-3xl">
                  <p className="text-[10px] text-white/40 uppercase font-black">Modelo: {models.find(m => m.id === w.model_id)?.slug}</p>
                  <p className="text-xl font-black mb-4">R$ {Number(w.amount).toFixed(2)}</p>
                  <button onClick={() => handleApproveWithdrawal(w.id, w.amount, w.model_id, 'Modelo', '')} className="w-full bg-amber-500 text-black py-3 rounded-xl text-[9px] font-black uppercase">Marcar como Pago</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOVAS CANDIDATURAS - RESTAURADO */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2"><UserPlus size={16}/> Novas Musas</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl cursor-pointer hover:border-indigo-400 transition-all">
                  <p className="text-[12px] text-white uppercase font-black">{app.full_name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">@{app.nickname}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Faturamento Total</p><h3 className="text-4xl font-black">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Plataforma</p><h3 className="text-4xl font-black">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-blue-500 uppercase mb-1">Clientes</p><h3 className="text-4xl font-black">{totalPlayers}</h3></div>
        </div>

        {/* LISTA DE MODELOS COM O NOVO BOTÃO DE USUÁRIOS */}
        <h2 className="text-[11px] font-black uppercase text-white/40 mb-6 flex items-center gap-2"><Users size={14}/> Gestão de Unidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                <div className="flex gap-2">
                  
                  {/* 🔥 BOTÃO DOURADO: GERENCIAR CLIENTES DA MODELO 🔥 */}
                  <button 
                    onClick={() => router.push(`/admin/models/${m.id}/players`)} 
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all" 
                    title="Ver Carteira de Clientes"
                  >
                    <Users size={16}/>
                  </button>

                  <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                  <button onClick={() => handleDelete(m.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-black uppercase text-lg mb-1">{m.slug}</h3>
              <p className="text-[10px] text-emerald-400 font-bold mb-4 uppercase">Ganhos: {(financialData.byModel[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Mail size={10}/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Key size={10}/> {m.password}</div></div>
              
              {m.whatsapp && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                   <input type="text" placeholder="Mensagem..." className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none" value={customMessages[m.id] || ""} onChange={(e) => setCustomMessages({ ...customMessages, [m.id]: e.target.value })} />
                   <button onClick={() => window.open(`https://wa.me/${m.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(customMessages[m.id] || `Oi ${m.slug}!`)}`, '_blank')} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-2 rounded-xl"><MessageCircle size={16}/></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* COMUNICADO GLOBAL */}
        <div className="mt-12 bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest"><Megaphone size={14}/> Comunicado Global</h2>
          <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none h-24 mb-4 resize-none" />
          <button onClick={() => handleSaveGlobal()} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all">{savingGlobal ? "Salvando..." : "ENVIAR COMUNICADO"}</button>
        </div>

      </div>

      {/* MODAL DE ANÁLISE DE CANDIDATURA - RESTAURADO */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 text-indigo-400 italic tracking-tighter">Analisar Perfil</h2>
            <div className="flex gap-6 mb-6">
              <div className="w-32 h-40 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0"><img src={selectedApp.profile_url || selectedApp.bg_url} className="w-full h-full object-cover" /></div>
              <div className="flex-1 space-y-2">
                <div><p className="text-[8px] text-white/40 uppercase font-black">Nome / Nickname</p><p className="text-sm font-black text-white uppercase">{selectedApp.full_name}</p><p className="text-[10px] text-indigo-400 uppercase font-bold">@{selectedApp.nickname}</p></div>
                <div><p className="text-[8px] text-white/40 uppercase font-black">Contato</p><p className="text-[10px] font-bold text-white uppercase">{selectedApp.whatsapp}</p></div>
              </div>
            </div>
            <button onClick={() => handleApproveApplication(selectedApp)} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><MessageCircle size={16}/> Aprovar e Criar Roleta</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
