"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X } from "lucide-react";

export default function SuperAdmin() {
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
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newModel, setNewModel] = useState({ slug: "", email: "", password: "" });

  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const [globalMsg, setGlobalMsg] = useState("");
  const [rankVisible, setRankVisible] = useState(false);
  const [goalAmount, setGoalAmount] = useState(1000);
  const [goalReward, setGoalReward] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fetchData = async () => {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      
      const [resMod, resHist, resGlob, resTrans, resWith, resApp] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?select=*&order=created_at.asc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Transactions?select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Applications?status=eq.pendente&select=*`, { headers })
      ]);

      if (resMod.ok) setModels(await resMod.json());
      if (resHist.ok) setHistory(await resHist.json());
      if (resTrans.ok) setTransactions(await resTrans.json());
      if (resWith.ok) setWithdrawals(await resWith.json());
      if (resApp.ok) setApplications(await resApp.json());

      if (resGlob.ok) {
        const dataGlob = await resGlob.json();
        if (dataGlob[0]) {
          setGlobalMsg(dataGlob[0].announcement_msg);
          setRankVisible(dataGlob[0].ranking_visible);
          setGoalAmount(dataGlob[0].goal_amount);
          setGoalReward(dataGlob[0].goal_reward);
        }
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
      setIsLogged(true);
      setInitialLoading(true);
      fetchData();
    } else { alert("Acesso negado!"); }
  };

  // BOTÃO NUCLEAR DE RESET
  const handleResetSystem = async () => {
    const confirmText = prompt("ATENÇÃO: Você está prestes a ZERAR todo o financeiro, histórico de giros e saques do sistema.\n\nIsso limpará tudo para o lançamento oficial. \n\nDigite ZERARTUDO para confirmar:");
    if (confirmText !== "ZERARTUDO") return alert("Cancelado.");

    setInitialLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      
      await fetch(`${supabaseUrl}/rest/v1/Transactions?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=not.is.null`, { method: 'DELETE', headers });
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=not.is.null`, { method: 'DELETE', headers });
      
      await fetch(`${supabaseUrl}/rest/v1/Models?id=not.is.null`, { 
        method: 'PATCH', headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ balance: 0 }) 
      });

      alert("Sistema Restaurado! O financeiro foi limpo para o lançamento oficial.");
      fetchData();
    } catch (err) {
      alert("Erro ao tentar limpar o sistema.");
    }
  };

  const handleSaveGlobal = async (valRanking?: boolean) => {
    setSavingGlobal(true);
    const isVisible = typeof valRanking === 'boolean' ? valRanking : rankVisible;
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_msg: globalMsg, ranking_visible: isVisible, goal_amount: goalAmount, goal_reward: goalReward, updated_at: new Date().toISOString() })
      });
      if (typeof valRanking !== 'boolean') alert("Configurações salvas!");
    } catch (err) {} finally { setSavingGlobal(false); }
  };

  const toggleRankingVisibility = async () => {
    const nextVal = !rankVisible;
    setRankVisible(nextVal);
    await handleSaveGlobal(nextVal);
  };

  const handleApproveWithdrawal = async (id: string, amount: number, modelId: string) => {
    if (!confirm(`Confirmar pagamento?`)) return;
    try {
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${id}`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'pago', is_read: false })
      });
      fetchData();
    } catch (err) { alert("Erro ao aprovar."); }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Deseja aprovar e criar a roleta de ${app.nickname}?`)) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const capNick = app.nickname.charAt(0).toUpperCase() + app.nickname.slice(1);
      const generatedEmail = `${app.nickname}@admin.com`;
      const generatedPass = `${capNick}Admin26`;

      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ 
          slug: app.nickname, email: generatedEmail, password: generatedPass,
          full_name: app.full_name, whatsapp: app.whatsapp, cpf: app.cpf, birth_date: app.birth_date,
          pix_key_1: app.pix_1, pix_key_2: app.pix_2, created_at: now 
        }),
      });
      const dataMod = await resMod.json();
      const mId = dataMod[0].id;

      await fetch(`${supabaseUrl}/rest/v1/Configs`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: mId, model_name: app.nickname.toUpperCase(), spin_cost: 2, bg_url: app.bg_url, created_at: now }),
      });

      const defaultColors = ["#FF1493", "#8B0045", "#FFD700", "#FF1493", "#8B0045", "#FFD700"];
      const appPrizes = Array.isArray(app.prizes) ? app.prizes : JSON.parse(app.prizes || "[]");
      
      const prizesToInsert = appPrizes.map((p: string, i: number) => ({
        id: crypto.randomUUID(), name: p, shortLabel: p.substring(0, 10), type: "digital", weight: 16.66, color: defaultColors[i], active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp'
      }));
      prizesToInsert.push({ id: crypto.randomUUID(), name: "R$ 100 no PIX", shortLabel: "R$ 100", type: "digital", weight: 0.02, color: "#10b981", active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp' });
      prizesToInsert.push({ id: crypto.randomUUID(), name: "Encontro Presencial", shortLabel: "Presencial", type: "digital", weight: 0.02, color: "#6366f1", active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp' });

      await fetch(`${supabaseUrl}/rest/v1/Prize`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(prizesToInsert) });

      await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${app.id}`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'aprovada' }),
      });

      alert(`Sucesso! Envie no WhatsApp dela:\nLink: site.com/game/${app.nickname}\nE-mail: ${generatedEmail}\nSenha: ${generatedPass}`);
      setSelectedApp(null);
      fetchData();
    } catch (err) { alert("Erro ao criar a roleta."); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const now = new Date().toISOString(); 
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ ...newModel, created_at: now }),
      });
      const dataMod = await resMod.json();
      const mId = dataMod[0].id;
      await fetch(`${supabaseUrl}/rest/v1/Configs`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: mId, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }),
      });
      
      const defaultColors = ["#FF1493", "#8B0045", "#FFD700", "#FF1493", "#8B0045", "#FFD700"];
      const fallbackPrizes = ["Mimo Surpresa", "Vídeo Exclusivo", "Foto Especial", "Áudio Picante", "Acesso VIP", "Pack Econômico"];
      const prizesToInsert = fallbackPrizes.map((p, i) => ({
        id: crypto.randomUUID(), name: p, shortLabel: p.substring(0, 10), type: "digital", weight: 16.66, color: defaultColors[i], active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp'
      }));
      prizesToInsert.push({ id: crypto.randomUUID(), name: "R$ 100 no PIX", shortLabel: "R$ 100", type: "digital", weight: 0.02, color: "#10b981", active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp' });
      prizesToInsert.push({ id: crypto.randomUUID(), name: "Encontro Presencial", shortLabel: "Presencial", type: "digital", weight: 0.02, color: "#6366f1", active: true, model_id: mId, createdAt: now, updatedAt: now, delivery_type: 'whatsapp' });

      await fetch(`${supabaseUrl}/rest/v1/Prize`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(prizesToInsert) });

      alert(`Franquia manual criada!`); setShowModal(false); fetchData(); setNewModel({ slug: "", email: "", password: "" });
    } catch (err) {} finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Remover franquia?`)) return;
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
    fetchData();
  };

  const modelRanking = useMemo(() => {
    const counts: any = {};
    history.forEach(h => { counts[h.model_id] = (counts[h.model_id] || 0) + 1; });
    return models.map(m => ({ ...m, score: counts[m.id] || 0 })).sort((a, b) => b.score - a.score);
  }, [models, history]);

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

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
      <Loader2 className="animate-spin text-[#FF1493] mb-4" size={40}/>
      <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 animate-pulse">Sincronizando Sistema...</h1>
    </div>
  );

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FF1493]/10 blur-[80px]" />
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6 relative z-10"/>
        <h1 className="text-xl font-black uppercase text-white mb-8 italic relative z-10"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1>
        <form onSubmit={handleLogin} className="space-y-4 text-left relative z-10">
          <input type="email" placeholder="EMAIL MASTER" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493]" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
          <div className="relative">
            <input type={showPass ? "text" : "password"} placeholder="SENHA MESTRE" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493]" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>
          <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-[#FF1493]/20 hover:scale-[1.02] active:scale-95 transition-all">Acessar Painel Master</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase italic drop-shadow-[0_0_15px_rgba(255,20,147,0.3)]"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1>
            <p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">SISTEMA DE GESTÃO V.3001 MASTER</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleResetSystem} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-xl"><AlertCircle size={16}/> ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all shadow-xl"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all" title="Sair do Master"><Lock size={18}/></button>
          </div>
        </div>

        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2 tracking-widest"><UserPlus size={16}/> {applications.length} Novas Candidaturas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition-all group">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{app.full_name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2">@{app.nickname}</p>
                    <div className="text-[9px] text-white/50 uppercase font-mono space-y-1">
                      <p>📱 {app.whatsapp}</p>
                    </div>
                  </div>
                  <button className="bg-indigo-500/20 text-indigo-400 px-4 py-3 rounded-xl text-[9px] font-black uppercase group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    Analisar Perfil
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingWithdrawals.length > 0 && (
          <div className="mb-12 bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <h2 className="text-xs font-black uppercase text-amber-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {pendingWithdrawals.length} Saques (PIX)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingWithdrawals.map(w => {
                const model = models.find(m => m.id === w.model_id);
                return (
                  <div key={w.id} className="bg-black border border-amber-500/20 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div><p className="text-[10px] text-white/40 uppercase font-black mb-1">Modelo: {model?.slug}</p><p className="text-xl font-black text-white">R$ {Number(w.amount).toFixed(2)}</p></div>
                      <button onClick={() => handleApproveWithdrawal(w.id, w.amount, w.model_id)} className="bg-amber-500 text-black px-4 py-3 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform flex items-center gap-1"><CheckCircle2 size={14}/> Pagar</button>
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

        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 mb-4 flex items-center gap-2"><DollarSign size={14}/> Livro Caixa Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={80} className="text-[#FF1493]"/></div><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1 tracking-widest relative z-10">Vendas Totais</p><h3 className="text-4xl font-black text-white relative z-10">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={80} className="text-emerald-500"/></div><p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest relative z-10">Lucro Plataforma</p><h3 className="text-4xl font-black text-white relative z-10">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden"><p className="text-[10px] font-black text-white/30 uppercase mb-1 tracking-widest">Repasse (70%)</p><h3 className="text-4xl font-black text-white/70">{financialData.totalModels.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><Users size={14}/> Unidades Franqueadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF1493]/5 rounded-full blur-[40px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                    <div className="flex gap-2">
                      <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                      <button onClick={() => handleDelete(m.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-black uppercase text-sm mb-1 relative z-10">{m.slug}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 relative z-10 tracking-widest">GEROU: {(financialData.byModel[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5 relative z-10">
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div>
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Key size={10} className="text-[#FF1493]"/> {m.password}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Megaphone size={60}/></div>
               <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest relative z-10"><Megaphone size={14}/> Comunicado Global</h2>
               <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none focus:border-[#FF1493] h-24 mb-4 resize-none relative z-10" />
               <button onClick={() => handleSaveGlobal()} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10">
                 {savingGlobal ? <Loader2 size={14} className="animate-spin"/> : "ENVIAR COMUNICADO"}
               </button>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Trophy size={60}/></div>
               <h2 className="text-xs font-black uppercase text-[#FFD700] mb-6 flex items-center gap-2 tracking-widest relative z-10"><Trophy size={14}/> Metas & Ranking</h2>
               <div className="space-y-4 mb-6 relative z-10">
                 <div>
                   <label className="text-[9px] font-black text-white/30 uppercase block mb-1">Meta Semanal (R$)</label>
                   <input type="number" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#FFD700]"/>
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-white/30 uppercase block mb-1">Premiação</label>
                   <input type="text" value={goalReward} onChange={e => setGoalReward(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#FFD700]"/>
                 </div>
                 <button onClick={toggleRankingVisibility} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase border transition-all active:scale-95 ${rankVisible ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                   {rankVisible ? 'RANKING VISÍVEL P/ ELAS' : 'RANKING OCULTO P/ ELAS'}
                 </button>
               </div>
               <button onClick={() => handleSaveGlobal()} className="w-full bg-[#FFD700] text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-[#FFD700]/20 active:scale-95 transition-all relative z-10">ATUALIZAR REGRAS</button>
            </div>

            <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]">
               <h3 className="text-[9px] font-black uppercase text-white/30 mb-4 tracking-widest flex items-center gap-2"><Crown size={12} className="text-[#FFD700]"/> Top 3 Faturamento</h3>
               <div className="space-y-3">
                 {modelRanking.length === 0 ? (
                   <p className="text-[10px] text-white/20 italic">Nenhum giro registrado.</p>
                 ) : (
                   modelRanking.slice(0, 3).map((m, i) => (
                     <div key={m.id} className="flex justify-between items-center text-[10px] font-black uppercase">
                       <span className="flex items-center gap-2"><span className={i === 0 ? "text-[#FFD700]" : "text-[#FF1493]"}>#{i+1}</span> {m.slug}</span>
                       <span className="text-white/30">{m.score} GIROS</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 text-indigo-400 italic tracking-tighter">Analisar Perfil</h2>
            
            <div className="flex gap-6 mb-6">
              <div className="w-32 h-40 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0">
                <img src={selectedApp.bg_url} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <div><p className="text-[8px] text-white/40 uppercase font-black">Nome / Nickname</p><p className="text-sm font-black text-white uppercase">{selectedApp.full_name}</p><p className="text-[10px] text-indigo-400 uppercase font-bold">@{selectedApp.nickname}</p></div>
                <div><p className="text-[8px] text-white/40 uppercase font-black">Nascimento / CPF</p><p className="text-[10px] font-bold text-white uppercase">{selectedApp.birth_date} | {selectedApp.cpf}</p></div>
                <div><p className="text-[8px] text-white/40 uppercase font-black">Contato</p><p className="text-[10px] font-bold text-white uppercase">{selectedApp.whatsapp}</p></div>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl mb-6">
              <p className="text-[9px] text-white/40 uppercase font-black mb-2">Chaves PIX</p>
              <p className="text-[10px] font-mono text-emerald-400">1: {selectedApp.pix_1}</p>
              <p className="text-[10px] font-mono text-white/50">2: {selectedApp.pix_2 || 'N/A'}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl mb-6">
              <p className="text-[9px] text-white/40 uppercase font-black mb-2">Prêmios Solicitados</p>
              <div className="grid grid-cols-2 gap-2">
                {(Array.isArray(selectedApp.prizes) ? selectedApp.prizes : JSON.parse(selectedApp.prizes || "[]")).map((p: string, i: number) => (
                  <div key={i} className="text-[9px] bg-black border border-white/5 p-2 rounded-lg text-white font-bold uppercase truncate">{p}</div>
                ))}
              </div>
            </div>

            <button onClick={() => handleApproveApplication(selectedApp)} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><CheckCircle2 size={16}/> Aprovar e Criar Roleta</>}
            </button>
            <button onClick={async () => {
              if(!confirm('Rejeitar e excluir esta candidatura?')) return;
              await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${selectedApp.id}`, { method: 'DELETE', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }});
              setSelectedApp(null); fetchData();
            }} className="w-full mt-4 py-3 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">Rejeitar Candidatura</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[4rem] w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black uppercase mb-8 text-[#FF1493] text-center italic tracking-tighter">Criar Manual</h2>
            <div className="space-y-4">
              <input type="text" placeholder="APELIDO (URL)" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.slug} onChange={e => setNewModel({...newModel, slug: e.target.value.toLowerCase().replace(/\s/g, '')})} />
              <input type="email" placeholder="E-MAIL" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.email} onChange={e => setNewModel({...newModel, email: e.target.value})} />
              <input type="text" placeholder="SENHA" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.password} onChange={e => setNewModel({...newModel, password: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#FF1493] py-5 rounded-[2rem] text-[10px] font-black uppercase mt-10 shadow-xl flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" size={16}/> : "CRIAR MANUALMENTE"}</button>
            <button type="button" onClick={() => setShowModal(false)} className="w-full text-[9px] font-black uppercase text-white/20 mt-6 text-center tracking-widest">Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}
