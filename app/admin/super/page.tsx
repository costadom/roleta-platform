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
      // Usamos headers de cache e preferência de contagem para velocidade máxima
      const headers = { 
        apikey: supabaseKey!, 
        Authorization: `Bearer ${supabaseKey}`, 
        "Cache-Control": "no-cache"
      };

      // Dispara todas as consultas ao mesmo tempo (Paralelismo Real)
      const [resMod, resHist, resGlob, resTrans, resWith, resApp, resPlayers, resAbandon] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=id,model_id,player_phone&order=created_at.desc&limit=50`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Applications?select=*`, { headers }),
        // Otimização: Pede apenas a contagem total, sem baixar os dados dos usuários
        fetch(`${supabaseUrl}/rest/v1/Players?select=id`, { headers: { ...headers, "Prefer": "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?select=*&order=created_at.desc&limit=50`, { headers })
      ]);

      // Processa Jogadores via Header Content-Range (Muito mais rápido)
      const range = resPlayers.headers.get("content-range");
      if (range) {
        const total = range.split("/")[1];
        setTotalPlayers(parseInt(total));
      }

      const dataHist = resHist.ok ? await resHist.json() : [];
      if (resMod.ok) setModels(await resMod.json());
      setHistory(dataHist);
      if (resTrans.ok) setTransactions(await resTrans.json());
      if (resWith.ok) setWithdrawals(await resWith.json());
      
      // Filtros de status (Pendente/pendente)
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

      if (resGlob.ok) {
        const dataGlob = await resGlob.json();
        if (dataGlob[0]) {
          setGlobalMsg(dataGlob[0].announcement_msg);
          setRankVisible(dataGlob[0].ranking_visible);
          setGoalAmount(dataGlob[0].goal_amount);
          setGoalReward(dataGlob[0].goal_reward);
        }
      }

    } catch (err) { 
      console.error("Erro no fetch", err); 
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

  const handleResetSystem = async () => {
    const confirmText = prompt("ATENÇÃO: ZERAR SISTEMA?\nDigite ZERARTUDO:");
    if (confirmText !== "ZERARTUDO") return;
    setInitialLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Transactions?id=not.is.null`, { method: 'DELETE', headers }),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=not.is.null`, { method: 'DELETE', headers }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=not.is.null`, { method: 'DELETE', headers }),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=not.is.null`, { method: 'DELETE', headers })
      ]);
      fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_msg: globalMsg, ranking_visible: rankVisible, goal_amount: goalAmount, goal_reward: goalReward, updated_at: new Date().toISOString() })
      });
    } catch (err) {} finally { setSavingGlobal(false); }
  };

  const handleApproveWithdrawal = async (id: string, amount: number, modelId: string, modelName: string, modelPhone: string) => {
    if (!confirm(`Pagar R$ ${amount.toFixed(2)}?`)) return;
    try {
      await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${id}`, {
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'pago', is_read: false })
      });
      if (modelPhone) window.open(`https://wa.me/${modelPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${amount.toFixed(2)} foi enviado! 💸`)}`, '_blank');
      fetchData();
    } catch (err) { alert("Erro."); }
  };

  const handleApproveApplication = async (app: any) => {
    if (!confirm(`Aprovar ${app.nickname}?`)) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const capNick = app.nickname.charAt(0).toUpperCase() + app.nickname.slice(1);
      const generatedEmail = `${app.nickname}@admin.com`;
      const generatedPass = `${capNick}Admin26`;
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ slug: app.nickname, email: generatedEmail, password: generatedPass, full_name: app.full_name, whatsapp: app.whatsapp, created_at: now }),
      });
      const dataMod = await resMod.json();
      const mId = dataMod[0].id;
      await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: mId, model_name: app.nickname.toUpperCase(), spin_cost: 2, bg_url: app.bg_url, profile_url: app.profile_url || app.bg_url, created_at: now }), });
      await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${app.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aprovada' }), });
      window.open(`https://wa.me/${app.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi! Sua roleta foi criada. Login: ${generatedEmail} | Senha: ${generatedPass}`)}`, '_blank');
      setSelectedApp(null); fetchData();
    } catch (err) { alert("Erro."); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const now = new Date().toISOString(); 
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: newModel.slug.toLowerCase(), email: newModel.email, password: newModel.password, created_at: now }), });
      const mId = (await resMod.json())[0].id;
      await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: mId, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }), });
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
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">SISTEMA V.3001 MASTER</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleResetSystem} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase">ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500"><Lock size={18}/></button>
          </div>
        </div>

        {/* PIX ABANDONADOS */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{cart.player_name}</p>
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-1">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-white/50 uppercase font-mono">Na roleta: {cart.model_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://wa.me/${cart.player_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii ${cart.player_name}! Vi aqui que você tentou recarregar na roleta da ${cart.model_name}, mas o PIX acabou não concluindo 😕\n\nA roleta dela tá pegando fogo hoje! 🔥 Quer o código de novo?`)}`, '_blank')} className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1"><MessageCircle size={14}/> Chamar no Zap</button>
                    <button onClick={async () => {
                      await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${cart.id}`, { method: 'PATCH', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'ignorado' }) });
                      fetchData();
                    }} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500"><X size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATURAS */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2 tracking-widest"><UserPlus size={16}/> {applications.length} Novas Musas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl cursor-pointer hover:border-indigo-400 transition-all">
                  <p className="text-[12px] text-white uppercase font-black">{app.full_name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">@{app.nickname}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO GLOBAL */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Faturamento Bruto</p><h3 className="text-4xl font-black">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Plataforma (30%)</p><h3 className="text-4xl font-black">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-blue-500 uppercase mb-1">Total Jogadores</p><h3 className="text-4xl font-black">{totalPlayers}</h3></div>
        </div>

        {/* LISTA DE MODELOS */}
        <h2 className="text-[11px] font-black uppercase text-white/40 mb-6 flex items-center gap-2"><Users size={14}/> Unidades Parceiras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/admin/models/${m.id}/players`)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all" title="Clientes"><Users size={16}/></button>
                  <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                  <button onClick={() => handleDelete(m.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500"><Trash2 size={16}/></button>
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
        <div className="mt-12 bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden">
          <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest"><Megaphone size={14}/> Comunicado Global</h2>
          <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none h-24 mb-4 resize-none" />
          <button onClick={() => handleSaveGlobal()} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all">{savingGlobal ? "Salvando..." : "ENVIAR COMUNICADO"}</button>
        </div>
      </div>

      {/* MODAL ANALISE CANDIDATURA */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 text-indigo-400 italic">Analisar Perfil</h2>
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
            <button onClick={async () => { if(!confirm('Rejeitar candidatura?')) return; await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${selectedApp.id}`, { method: 'DELETE', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }}); setSelectedApp(null); fetchData(); }} className="w-full mt-4 py-3 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all">Rejeitar</button>
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
              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg flex justify-center items-center gap-2 mt-4">{loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Franquia"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
