"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2, Video, RefreshCw } from "lucide-react";
import { getSuperAdminData, runAdminAction } from "./actions";

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
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  // 🔥 CARREGAMENTO VIA SERVER ACTIONS 🔥
  const fetchData = async () => {
    try {
      const res = await getSuperAdminData();
      if (!res.ok) throw new Error(res.error);

      const { data } = res;
      if (data.global) {
        setGlobalMsg(data.global.announcement_msg || "");
        setRankVisible(!!data.global.ranking_visible);
        setGoalAmount(Number(data.global.goal_amount || 1000));
        setGoalReward(data.global.goal_reward || "");
      }

      setModels(data.models || []);
      setTransactions(data.transactions || []);
      setWithdrawals(data.withdrawals || []);
      setApplications(data.applications || []);
      setTotalPlayers(data.totalPlayers || 0);
      setAbandoned(data.abandoned || []);
      setVideoRequests(data.videoRequests || []);

    } catch (err: any) { 
      console.error("Erro no Fetch:", err); 
      alert(`Erro ao carregar dados: ${err.message}`);
    } finally {
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

  const executeAction = async (action: string, payload?: any) => {
    setLoading(true);
    try {
      const res = await runAdminAction(action, payload);
      if (!res.ok) throw new Error(res.error);
      
      if (action === "approveApplication") {
          const msg = `Oii, ${payload.full_name.split(' ')[0]}! Que alegria ter você com a gente!\n\nSua plataforma está pronta!\n\nLink do Painel: https://labzsexyroll.vercel.app/admin\nLogin: ${res.data.generatedEmail}\nSenha: ${res.data.generatedPass}`;
          window.open(`https://wa.me/${payload.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }
      
      await fetchData();
    } catch (err: any) {
      alert("Erro na ação: " + err.message);
    } finally {
      setLoading(false);
    }
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

  if (initialLoading) return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="animate-spin text-[#FF1493]" size={40}/></div>;

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
      <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black text-white mb-8">PAINEL MASTER</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
        <div className="relative"><input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
        <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Acessar</button>
      </form>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1 uppercase">Sistema V.3001 Master</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm("Zerar sistema?")) executeAction('resetSystem'); }} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-xl"><AlertCircle size={16}/> ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all shadow-xl"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </div>

        {/* VIDEOS */}
        {videoRequests.length > 0 && (
          <div className="mb-12 bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-blue-400 mb-4 flex items-center gap-2 tracking-widest"><Video size={16}/> {videoRequests.length} Novos Pedidos de Vídeo VIP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoRequests.map(req => (
                <div key={req.id} className="bg-black border border-blue-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Musa: @{req.Models?.slug}</p>
                    <p className="text-[12px] text-white font-bold leading-relaxed mb-2">"{req.description}"</p>
                  </div>
                  <button onClick={() => window.open(`https://wa.me/${req.Models?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent('Oi linda! Você tem um novo pedido de Vídeo VIP no seu painel!')}`)} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase">Notificar Modelo</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIX ABANDONADOS */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Fã VIP'}</p>
                    <p className="text-[10px] text-red-400 font-bold mb-1">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-white/50 italic">Musa: {cart.model_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://wa.me/${(cart.player_phone || cart.whatsapp)?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Vi que o seu PIX da ${cart.model_name} não concluiu. Quer ajuda?`)}`)} className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase">Chamar no Zap</button>
                    <button onClick={() => executeAction('ignoreAbandoned', { id: cart.id })} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500 transition-all"><X size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATURAS */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2 tracking-widest"><UserPlus size={16}/> {applications.length} Novas Candidaturas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all group">
                  <p className="text-white uppercase font-black text-xs">@{app.nickname}</p>
                  <button className="bg-indigo-500/20 text-indigo-400 px-4 py-3 rounded-xl text-[9px] font-black uppercase mt-4 group-hover:bg-indigo-500 group-hover:text-white">Analisar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAQUES */}
        {withdrawals.filter(w => w.status === 'pendente').length > 0 && (
          <div className="mb-12 bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem] shadow-xl">
            <h2 className="text-xs font-black uppercase text-amber-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> Saques Solicitados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {withdrawals.filter(w => w.status === 'pendente').map(w => (
                <div key={w.id} className="bg-black border border-amber-500/20 p-5 rounded-3xl">
                  <div className="flex justify-between items-start mb-4">
                    <div><p className="text-[10px] text-white/40 uppercase mb-1">@{models.find(m => m.id === w.model_id)?.slug}</p><p className="text-xl font-black text-white">R$ {Number(w.amount).toFixed(2)}</p></div>
                    <button onClick={() => executeAction('approveWithdrawal', { id: w.id })} className="bg-amber-500 text-black px-4 py-3 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform"><CheckCircle2 size={14} className="inline mr-1"/> Pagar</button>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl"><p className="text-[9px] font-mono text-emerald-400 break-all">{models.find(m => m.id === w.model_id)?.pix_key_1}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO GLOBAL */}
        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 mb-4 flex items-center gap-2"><DollarSign size={14}/> Caixa Global & Plataforma</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Faturamento Bruto</p><h3 className="text-4xl font-black text-white">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Savanah (30%)</p><h3 className="text-4xl font-black text-white">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-white/30 uppercase mb-1">Modelos (70%)</p><h3 className="text-4xl font-black text-white/70">{financialData.totalModels.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          </div>
        </div>

        {/* LISTA DE MODELOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><Users size={14}/> Unidades Franqueadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                    <div className="flex gap-2">
                       <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                       <button onClick={() => { if(confirm('Apagar unidade?')) executeAction('deleteModel', {id: m.id}); }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-black uppercase text-sm mb-1 relative z-10">@{m.slug}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 uppercase">Lucro: {(financialData.byModel[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold truncate"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Key size={10} className="text-[#FF1493]"/> {m.password}</div></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"><h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest relative z-10"><Megaphone size={14}/> Comunicado Global</h2><textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none focus:border-[#FF1493] h-24 mb-4 resize-none relative z-10" /><button onClick={() => executeAction('saveGlobal', { globalMsg, rankVisible, goalAmount, goalReward })} disabled={loading} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10">{loading ? <Loader2 size={14} className="animate-spin"/> : "SALVAR COMUNICADO"}</button></div>
          </div>
        </div>
      </div>

      {/* MODAL CANDIDATURA */}
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
                {selectedApp.referred_by && <div><p className="text-[8px] text-amber-500 uppercase font-black tracking-widest mt-2">👑 Indicação Ativa</p></div>}
              </div>
            </div>
            <button onClick={() => executeAction('approveApplication', selectedApp)} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">{loading ? <Loader2 className="animate-spin" size={16}/> : "Aprovar e Criar Unidade"}</button>
            <button onClick={() => executeAction('rejectApplication', { id: selectedApp.id })} className="w-full mt-4 py-3 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">Rejeitar</button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 italic">Criar <span className="text-[#FF1493]">Manual</span></h2>
            <form onSubmit={(e) => { e.preventDefault(); executeAction('createModel', newModel); setShowModal(false); }} className="space-y-4">
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
