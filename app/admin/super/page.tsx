"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2, Video, RefreshCw } from "lucide-react";
import { getSuperData, runAdminAction } from "./actions";

export default function SuperAdmin() {
  const router = useRouter();
  const [isLogged, setIsLogged] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [models, setModels] = useState<any[]>([]);
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
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const res = await getSuperData();
      if (res.ok && res.data) {
          const { data } = res;
          if (data.global) {
              setGlobalMsg(data.global.announcement_msg || "");
              setRankVisible(!!data.global.ranking_visible);
              setGoalAmount(data.global.goal_amount || 1000);
              setGoalReward(data.global.goal_reward || "");
          }
          setModels(data.models); setTransactions(data.transactions); setWithdrawals(data.withdrawals);
          setApplications(data.applications); setTotalPlayers(data.totalPlayers); setAbandoned(data.abandoned);
          setVideoRequests(data.videoRequests);
      } else {
          console.error("Erro no retorno:", res.error);
      }
    } catch (e) {
      console.error("Erro ao carregar:", e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") { setIsLogged(true); loadData(); }
    else { setInitialLoading(false); }
  }, []);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true");
      setIsLogged(true); setInitialLoading(true); loadData();
    } else { alert("Acesso negado!"); }
  };

  const handleAction = async (action: string, payload?: any) => {
      setLoading(true);
      const res = await runAdminAction(action, payload);
      if (res.ok) {
          if (action === "approveApplication") {
              const msg = `Oii, ${payload.full_name.split(' ')[0]}! Plataforma pronta!\nLogin: ${res.data.generatedEmail}\nSenha: ${res.data.generatedPass}`;
              window.open(`https://wa.me/${payload.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
          }
          await loadData();
      } else { alert("Erro na ação: " + res.error); }
      setLoading(false);
  };

  const financialData = useMemo(() => {
    let sales = 0, plat = 0, mods = 0;
    const byMod: Record<string, number> = {};
    transactions.forEach(t => {
      sales += Number(t.real_amount || 0); plat += Number(t.platform_cut || 0); mods += Number(t.model_cut || 0);
      byMod[t.model_id] = (byMod[t.model_id] || 0) + Number(t.real_amount || 0);
    });
    return { sales, plat, mods, byMod };
  }, [transactions]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
       <Loader2 className="animate-spin text-[#FF1493] mb-4" size={40}/>
       <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Sincronizando Banco...</p>
    </div>
  );

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
      <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black text-white mb-8">PAINEL MASTER</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
        <input type="password" placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
        <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Entrar</button>
      </form>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1 uppercase">Sistema v.3001 Master</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleAction('resetSystem')} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-xl"><AlertCircle size={16}/> ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all shadow-xl"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </div>

        {/* VIDEOS REQUESTS */}
        {videoRequests.length > 0 && (
          <div className="mb-12 bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-blue-400 mb-4 flex items-center gap-2"><Video size={16}/> {videoRequests.length} Vídeos Solicitados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoRequests.map(req => (
                <div key={req.id} className="bg-black border border-blue-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4"><p className="text-[10px] text-blue-400 font-black uppercase mb-1">@{req.Models?.slug}</p><p className="text-xs text-white font-bold leading-relaxed mb-2">"{req.description}"</p></div>
                  <button onClick={() => window.open(`https://wa.me/${req.Models?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent('Oi linda! Você tem um pedido de Vídeo VIP no seu painel!')}`)} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-500 transition-all"><MessageCircle size={14}/> Avisar Modelo</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIX ABANDONADOS */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Fã VIP'}</p>
                    <p className="text-[10px] text-red-400 font-bold mb-1">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-white/50 italic">Musa: {cart.model_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://wa.me/${(cart.player_phone || cart.whatsapp)?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii ${cart.player_name}! Vi que o PIX da ${cart.model_name} não concluiu. Quer ajuda?`)}`)} className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"><MessageCircle size={14}/> Chamar</button>
                    <button onClick={() => handleAction('ignoreAbandoned', { id: cart.id })} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500 transition-all"><X size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATURAS */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2"><UserPlus size={16}/> {applications.length} Novas Modelos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all group">
                  <div className="mb-4"><p className="text-[12px] text-white uppercase font-black">{app.full_name}</p><p className="text-[10px] text-indigo-400 font-bold uppercase mb-2">@{app.nickname}</p></div>
                  <button className="bg-indigo-500/20 text-indigo-400 px-4 py-3 rounded-xl text-[9px] font-black uppercase group-hover:bg-indigo-500 group-hover:text-white transition-all">Analisar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 mb-4"><DollarSign size={14} className="inline mr-2"/> Caixa Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Faturamento Bruto</p><h3 className="text-4xl font-black text-white">{financialData.sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Plataforma (30%)</p><h3 className="text-4xl font-black text-white">{financialData.plat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-white/30 uppercase mb-1">Repasse Modelos (70%)</p><h3 className="text-4xl font-black text-white/70">{financialData.mods.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          </div>
        </div>

        {/* LISTA DE UNIDADES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 px-2 flex items-center gap-2"><Users size={14}/> Redes Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                    <div className="flex gap-2">
                       <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                       <button onClick={() => handleAction('deleteModel', { id: m.id })} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-black uppercase text-sm mb-1 relative z-10">@{m.slug}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 relative z-10 uppercase tracking-widest">Lucro: {(financialData.byMod[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold truncate"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Key size={10} className="text-[#FF1493]"/> {m.password}</div></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-8">
             {/* SAQUES PENDENTES NO LADO DIREITO */}
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><DollarSign size={14}/> Saques Solicitados</h2>
            <div className="space-y-3">
              {withdrawals.filter(w => w.status === 'pendente').map(w => (
                  <div key={w.id} className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-3xl animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-3">
                      <div><p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Modelo: {models.find(m => m.id === w.model_id)?.slug}</p><p className="text-lg font-black text-white italic">R$ {Number(w.amount).toFixed(2)}</p></div>
                      <button onClick={() => handleAction('approveWithdrawal', { id: w.id })} className="bg-amber-500 text-black px-4 py-2.5 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-all">Pagar</button>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                       <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Chaves PIX:</p>
                       <p className="text-[9px] font-mono text-emerald-400 truncate">1: {models.find(m => m.id === w.model_id)?.pix_key_1 || 'N/A'}</p>
                    </div>
                  </div>
              ))}
              {withdrawals.filter(w => w.status === 'pendente').length === 0 && <div className="py-10 text-center text-white/10 font-black uppercase text-[10px] border border-dashed border-white/5 rounded-3xl tracking-widest">Tudo em dia ✅</div>}
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"><h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest"><Megaphone size={14}/> Comunicado Global</h2><textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none focus:border-[#FF1493] h-24 mb-4 resize-none" /><button onClick={() => handleAction('saveGlobal', { globalMsg, rankVisible, goalAmount, goalReward })} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">{loading ? <Loader2 size={14} className="animate-spin"/> : "SALVAR COMUNICADO"}</button></div>
          </div>
        </div>
      </div>

      {/* MODAL ANALISE */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 text-indigo-400 italic tracking-tighter">Analisar Candidata</h2>
            <div className="flex gap-6 mb-6">
              <div className="w-32 h-40 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0"><img src={selectedApp.profile_url || selectedApp.bg_url} className="w-full h-full object-cover" /></div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-black text-white uppercase">{selectedApp.full_name}</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase">@{selectedApp.nickname}</p>
                <p className="text-[10px] font-bold text-white uppercase">{selectedApp.whatsapp}</p>
              </div>
            </div>
            <button onClick={() => handleAction('approveApplication', selectedApp)} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">{loading ? <Loader2 className="animate-spin" size={16}/> : "Aprovar e Criar Unidade"}</button>
            <button onClick={() => handleAction('rejectApplication', { id: selectedApp.id })} className="w-full mt-4 py-3 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">Rejeitar</button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 italic">Criar <span className="text-[#FF1493]">Manual</span></h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAction('createModel', newModel); setShowModal(false); }} className="space-y-4">
              <input type="text" required placeholder="Slug" value={newModel.slug} onChange={e => setNewModel({ ...newModel, slug: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" />
              <input type="email" required placeholder="Email" value={newModel.email} onChange={e => setNewModel({ ...newModel, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" />
              <input type="text" required placeholder="Senha" value={newModel.password} onChange={e => setNewModel({ ...newModel, password: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" />
              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg">Criar Franquia</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
