"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2, Video } from "lucide-react";
import PlayersManager from "./players";

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

  // 🔥 HELPER PADRONIZADO E BLINDADO (Conecta apenas com nossa API) 🔥
  const apiRequest = async (method: 'GET' | 'POST', action?: string, payload?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        cache: 'no-store'
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ action, payload });
      }

      const res = await fetch('/api/portal', options);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Falha na comunicação com o servidor.");
      }

      return json;
    } catch (error: any) {
      console.error(`Erro no apiRequest [${method} ${action || ''}]:`, error);
      throw error;
    }
  };

  // 🔥 LEITURA INICIAL (GET) 🔥
  const fetchData = async () => {
    try {
      const response = await apiRequest('GET');
      const data = response.data;

      // Os nomes batem exatamente com o que a API retorna
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
      alert(`Erro ao carregar o painel: ${err.message}`);
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

  // 🔥 MUTAÇÕES (POST) CENTRALIZADAS NA NOSSA API 🔥

  const handleResetSystem = async () => {
    const confirmText = prompt("ATENÇÃO: ZERAR SISTEMA?\nDigite ZERARTUDO:");
    if (confirmText !== "ZERARTUDO") return;
    setInitialLoading(true);
    try {
      await apiRequest('POST', 'resetSystem');
      await fetchData();
      alert("Sistema zerado com sucesso.");
    } catch (err: any) { alert(err.message); setInitialLoading(false); }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await apiRequest('POST', 'saveGlobal', { globalMsg, rankVisible, goalAmount, goalReward });
      alert("Comunicado salvo.");
    } catch (err: any) { alert(err.message); } finally { setSavingGlobal(false); }
  };

  const handleApproveWithdrawal = async (id: string, amount: number, modelPhone: string) => {
    if (!confirm(`Pagar R$ ${amount.toFixed(2)}?`)) return;
    try {
      await apiRequest('POST', 'approveWithdrawal', { id });
      if (modelPhone) window.open(`https://wa.me/${modelPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${amount.toFixed(2)} foi enviado!`)}`, '_blank');
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleIgnoreAbandoned = async (id: string) => {
    try {
      setAbandoned(prev => prev.filter(c => c.id !== id));
      await apiRequest('POST', 'ignoreAbandoned', { id });
    } catch (err: any) { alert(err.message); }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Aprovar ${app.nickname}?`)) return;
    setLoading(true);
    try {
      const res = await apiRequest('POST', 'approveApplication', app);
      setSelectedApp(null); 
      await fetchData();

      const msg = `Oii, ${app.full_name.split(' ')[0]}! Que alegria ter você com a gente!\n\nA sua Plataforma LabzSexy exclusiva já está 100% configurada e pronta pra você faturar muito!\n\nLink do seu Painel: https://labzsexyroll.vercel.app/admin\n\nLogin: ${res.data.generatedEmail}\nSenha: ${res.data.generatedPass}\n\nQualquer dúvida, é só me chamar aqui. Bora fazer muito dinheiro!`;
      window.location.href = `https://wa.me/${app.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleRejectApplication = async (id: string) => {
    if(!confirm('Rejeitar e excluir esta candidatura?')) return;
    try {
      await apiRequest('POST', 'rejectApplication', { id });
      setSelectedApp(null);
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await apiRequest('POST', 'createModel', newModel);
      setShowModal(false); 
      setNewModel({ slug: "", email: "", password: "", referred_by: "" });
      await fetchData();
      alert("Modelo criada com sucesso.");
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDeleteModel = async (m: any) => {
    if(confirm(`Excluir a musa ${m.slug} permanentemente? Isso não pode ser desfeito.`)) { 
      try {
        await apiRequest('POST', 'deleteModel', { id: m.id });
        await fetchData();
      } catch (err: any) { alert(err.message); }
    }
  };

  // Cálculos Financeiros
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center">
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
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleResetSystem} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-xl"><AlertCircle size={16}/> ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all shadow-xl"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </div>

        {/* VIDEOS */}
        {videoRequests.length > 0 && (
          <div className="mb-12 bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <h2 className="text-xs font-black uppercase text-blue-400 mb-4 flex items-center gap-2 tracking-widest"><Video size={16}/> {videoRequests.length} Novos Pedidos de Vídeo VIP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoRequests.map(req => (
                <div key={req.id} className="bg-black border border-blue-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Musa: @{req.Models?.slug}</p>
                    <p className="text-[12px] text-white font-bold leading-relaxed mb-2">"{req.description}"</p>
                    <div className="flex justify-between text-[9px] text-white/50 font-mono uppercase">
                        <span>💰 R$ {req.price}</span>
                        <span>⏱ {req.duration} min</span>
                    </div>
                  </div>
                  <button onClick={() => {
                    const msg = encodeURIComponent(`Oi linda! Você tem um novo pedido de Vídeo VIP! Aceite no seu painel para garantir seu saldo!`);
                    window.open(`https://wa.me/${req.Models?.whatsapp?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                  }} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-500 transition-all">
                    <MessageCircle size={14}/> Enviar para Modelo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIX ABANDONADOS */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados (Recuperar Vendas)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => {
                const phone = cart.player_phone || cart.whatsapp;
                return (
                  <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Cliente VIP'}</p>
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                      <p className="text-[9px] text-white/50 uppercase font-mono">Item: {cart.model_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={!phone}
                        onClick={() => {
                          const msg = `Oii ${cart.player_name || 'VIP'}! Vi aqui que você tentou acessar um conteúdo da ${cart.model_name.split(' ')[0]}, mas o PIX não concluiu.\n\nQuer que eu te mande a chave PIX de novo pra você não perder o bônus?`;
                          window.open(`https://wa.me/${phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                        }} 
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-transform ${phone ? 'bg-emerald-500 text-black hover:scale-105' : 'bg-white/5 text-white/20'}`}
                      >
                        <MessageCircle size={14}/> {phone ? 'Chamar no Zap' : 'Sem Telefone'}
                      </button>
                      <button onClick={() => handleIgnoreAbandoned(cart.id)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500 transition-all" title="Ignorar / Limpar"><X size={14}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CANDIDATURAS */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2 tracking-widest"><UserPlus size={16}/> {applications.length} Novas Candidaturas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all group">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{app.full_name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">@{app.nickname}</p>
                    <div className="text-[9px] text-white/50 uppercase font-mono space-y-1"><p>📱 {app.whatsapp}</p></div>
                  </div>
                  <button className="bg-indigo-500/20 text-indigo-400 px-4 py-3 rounded-xl text-[9px] font-black uppercase group-hover:bg-indigo-500 group-hover:text-white transition-all">Analisar Perfil</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SAQUES PENDENTES */}
        {withdrawals.filter(w => w.status === 'pendente').length > 0 && (
          <div className="mb-12 bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <h2 className="text-xs font-black uppercase text-amber-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {withdrawals.filter(w => w.status === 'pendente').length} Saques (PIX) Solicitados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {withdrawals.filter(w => w.status === 'pendente').map(w => {
                const model = models.find(m => m.id === w.model_id);
                return (
                  <div key={w.id} className="bg-black border border-amber-500/20 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div><p className="text-[10px] text-white/40 uppercase font-black mb-1">Modelo: {model?.slug}</p><p className="text-xl font-black text-white">R$ {Number(w.amount).toFixed(2)}</p></div>
                      <button onClick={() => handleApproveWithdrawal(w.id, w.amount, model?.whatsapp || '')} className="bg-amber-500 text-black px-4 py-3 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform flex items-center gap-1"><CheckCircle2 size={14}/> Pagar</button>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-white/30 mb-1">Chaves PIX:</p>
                      <p className="text-[10px] font-mono text-emerald-400 break-all mb-1">1: {model?.pix_key_1 || 'N/A'}</p>
                      <p className="text-[10px] font-mono text-white/50 break-all">2: {model?.pix_key_2 || 'N/A'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 mb-4 flex items-center gap-2"><DollarSign size={14}/> Caixa Global & Plataforma</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={80} className="text-[#FF1493]"/></div><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1 tracking-widest relative z-10">Faturamento Bruto</p><h3 className="text-4xl font-black text-white relative z-10">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={80} className="text-emerald-500"/></div><p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest relative z-10">Lucro Plataforma (30%)</p><h3 className="text-4xl font-black text-white relative z-10">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-white/30 uppercase mb-1 tracking-widest">Repasse Modelos (70%)</p><h3 className="text-4xl font-black text-white/70">{financialData.totalModels.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-[#FFD700]/20 rounded-2xl"><Users size={32} className="text-[#FFD700]" /></div>
              <div><p className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest mb-1">Modelos Parceiras Ativas</p><h3 className="text-3xl font-black text-white">{models.length} <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Contas</span></h3></div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2.5rem] flex items-center gap-5 shadow-xl">
              <div className="p-4 bg-blue-500/20 rounded-2xl"><Gamepad2 size={32} className="text-blue-500" /></div>
              <div><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Clientes Cadastrados</p><h3 className="text-3xl font-black text-white">{totalPlayers} <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Jogadores</span></h3></div>
            </div>
          </div>
        </div>

        {/* LISTA DE MUSAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><Users size={14}/> Unidades Franqueadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF1493]/5 rounded-full blur-[40px] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                    <div className="flex gap-2">
                      <div className="text-right"><span className="text-[8px] font-black text-white/30 uppercase block">ID</span><span className="text-[9px] font-mono text-white/50">{m.id.split('-')[0]}</span></div>
                      
                      <button onClick={() => router.push(`/admin/models/${m.id}/players`)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all shadow-lg" title="Ver Clientes">
                        <Users size={16}/>
                      </button>

                      <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                      <button onClick={() => handleDeleteModel(m)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <h3 className="font-black uppercase text-sm mb-1 relative z-10">{m.slug}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 relative z-10 tracking-widest">GEROU: {(financialData.byModel[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  
                  {m.referred_by && (<div className="mb-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-block"><span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">👑 Indicada por Afiliado</span></div>)}
                  
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5 relative z-10 mb-4"><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Key size={10} className="text-[#FF1493]"/> {m.password}</div></div>

                  {m.whatsapp && (
                    <div className="relative z-10 mt-2 bg-[#141414] border border-white/10 rounded-2xl p-2 flex flex-col gap-2">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-2">Mandar mensagem rápida:</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ex: Amor, tudo bem com a sua roleta?"
                          className="flex-1 bg-black border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-emerald-500/50"
                          value={customMessages[m.id] || ""}
                          onChange={(e) => setCustomMessages({ ...customMessages, [m.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => {
                            const userMsg = customMessages[m.id];
                            const defaultMsg = `Oii ${m.slug}!`;
                            const finalMsg = userMsg ? userMsg : defaultMsg;
                            window.open(`https://wa.me/${m.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(finalMsg)}`, '_blank');
                            setCustomMessages({ ...customMessages, [m.id]: "" });
                          }} 
                          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-2 rounded-xl hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center shrink-0" 
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-5"><Megaphone size={60}/></div><h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest relative z-10"><Megaphone size={14}/> Comunicado Global</h2><textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none focus:border-[#FF1493] h-24 mb-4 resize-none relative z-10" /><button onClick={handleSaveGlobal} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10">{savingGlobal ? <Loader2 size={14} className="animate-spin"/> : "ENVIAR COMUNICADO"}</button></div>
          </div>
        </div>
      </div>

      {/* 🔥 MODAL DE ANALISAR PERFIL 🔥 */}
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
                
                <div><p className="text-[8px] text-white/40 uppercase font-black">E-mail de Cadastro</p><p className="text-[10px] font-bold text-white">{selectedApp.email || "Não informado"}</p></div>
                <div><p className="text-[8px] text-white/40 uppercase font-black">CPF / Nasc.</p><p className="text-[10px] font-bold text-white">{selectedApp.cpf || "Não informado"} - {selectedApp.birth_date}</p></div>

                {selectedApp.referred_by && <div><p className="text-[8px] text-amber-500 uppercase font-black tracking-widest mt-2">👑 Indicação Ativa</p></div>}
              </div>
            </div>

            <button onClick={() => handleApproveApplication(selectedApp)} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><MessageCircle size={16}/> Aprovar e Enviar WhatsApp</>}
            </button>
            <button onClick={() => handleRejectApplication(selectedApp.id)} className="w-full mt-4 py-3 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">Rejeitar Candidatura</button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 italic">Criar <span className="text-[#FF1493]">Manual</span></h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="text-[10px] font-black text-white/50 uppercase ml-2">Slug</label><input type="text" required value={newModel.slug} onChange={e => setNewModel({ ...newModel, slug: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 mt-1 text-white text-sm outline-none focus:border-[#FF1493]" placeholder="Ex: savanah" /></div>
              <div><label className="text-[10px] font-black text-white/50 uppercase ml-2">Email</label><input type="email" required value={newModel.email} onChange={e => setNewModel({ ...newModel, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 mt-1 text-white text-sm outline-none focus:border-[#FF1493]" /></div>
              <div><label className="text-[10px] font-black text-white/50 uppercase ml-2">Senha</label><input type="text" required value={newModel.password} onChange={e => setNewModel({ ...newModel, password: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 mt-1 text-white text-sm outline-none focus:border-[#FF1493]" /></div>
              
              <div><label className="text-[10px] font-black text-white/50 uppercase ml-2">Slug da Madrinha (Opcional)</label><input type="text" value={newModel.referred_by} onChange={e => setNewModel({ ...newModel, referred_by: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 mt-1 text-amber-500 text-sm outline-none focus:border-amber-500" placeholder="Ex: raphasavanah" /></div>

              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg flex justify-center items-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Franquia"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
