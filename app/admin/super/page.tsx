"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Trash2, Loader2, Mail, Key, Megaphone, DollarSign, AlertCircle, MessageCircle, X, ChevronDown } from "lucide-react";

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
  const [totalPlayers, setTotalPlayers] = useState(0); 
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newModel, setNewModel] = useState({ slug: "", email: "", password: "" });

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [globalMsg, setGlobalMsg] = useState("");
  const [rankVisible, setRankVisible] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fetchData = async () => {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

      const [resMod, resGlob, resTrans, resWith, resApp, resPlayers, resAbandon, resConfigs] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?select=*&order=created_at.asc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Transactions?select=*&order=created_at.desc&limit=100`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Applications?select=*`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Players?select=id`, { headers: { ...headers, "Prefer": "count=exact" } }),
        fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?select=*&order=created_at.desc&limit=50`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Configs?select=model_id,model_name`, { headers })
      ]);

      const range = resPlayers.headers.get("content-range");
      if (range) setTotalPlayers(parseInt(range.split("/")[1]));

      const mods = await resMod.json();
      const confs = await resConfigs.json();
      const trans = await resTrans.json();
      
      // Mapeia nomes das modelos para as transações sem dar Erro 400
      const mappedTrans = trans.map((t: any) => {
          const c = confs.find((x: any) => x.model_id === t.model_id);
          return { ...t, modelName: c?.model_name || 'Musa' };
      });

      // Mapeia modelos e seus ganhos acumulados
      const mappedModels = mods.map((m: any) => {
          const c = confs.find((x: any) => x.model_id === m.id);
          const earn = mappedTrans.filter((t: any) => t.model_id === m.id).reduce((acc: any, curr: any) => acc + (Number(curr.model_cut) || 0), 0);
          return { ...m, modelName: c?.model_name || m.slug, totalEarnings: earn };
      });

      setModels(mappedModels);
      setTransactions(mappedTrans);
      setWithdrawals(await resWith.json());
      setApplications((await resApp.json()).filter((a: any) => a.status?.toLowerCase() === 'pendente' || !a.status));
      setAbandoned((await resAbandon.json()).filter((c: any) => c.status?.toLowerCase() === 'pendente' || !c.status));

      const g = await resGlob.json();
      if (g[0]) { setGlobalMsg(g[0].announcement_msg); setRankVisible(g[0].ranking_visible); }

    } catch (err) { console.error(err); } finally { setInitialLoading(false); }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") { setIsLogged(true); fetchData(); }
    else { setInitialLoading(false); }
  }, []);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true"); setIsLogged(true); fetchData();
    } else { alert("Acesso negado!"); }
  };

  const handleIgnoreCart = async (id: string) => {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
      await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'ignorado' }) });
      fetchData();
  };

  const financialData = useMemo(() => {
    const platform = transactions.reduce((acc, t) => acc + (Number(t.platform_cut) || 0), 0);
    return { totalSales: platform / 0.3, totalPlatform: platform };
  }, [transactions]);

  if (initialLoading) return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="animate-spin text-[#FF1493]" size={40}/></div>;

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center">
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black text-white mb-8 uppercase tracking-tighter">Painel Master</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
          <div className="relative"><input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg shadow-[#FF1493]/20">Acessar Sistema</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 sm:p-10 font-sans pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER ORIGINAL RESTAURADO */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1>
            <p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1 uppercase">Sistema V.3001 Master</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={async () => { if(prompt("Digite ZERARTUDO para confirmar:") === "ZERARTUDO") { const h={apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`}; await Promise.all([fetch(`${supabaseUrl}/rest/v1/Transactions?id=not.is.null`, {method:'DELETE', headers:h}), fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=not.is.null`, {method:'DELETE', headers:h})]); window.location.reload(); } }} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Zerar Sistema</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </header>

        {/* 1. PIX ABANDONADOS (CARD VERMELHO ORIGINAL) */}
        {abandoned.length > 0 && (
          <div className="mb-16 bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500">{abandoned.length} PIX ABANDONADOS NO MOMENTO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black/60 border border-white/5 p-6 rounded-3xl relative group hover:border-red-500/30 transition-all">
                  <button onClick={() => handleIgnoreCart(cart.id)} className="absolute top-4 right-4 text-white/10 hover:text-red-500 transition-colors"><X size={18}/></button>
                  <p className="text-sm font-black text-white uppercase mb-1">{cart.player_name || "Cliente VIP"}</p>
                  <p className="text-[10px] text-red-400 font-black uppercase mb-4 tracking-tighter">Tentou comprar R$ {Number(cart.amount).toFixed(2)}</p>
                  <p className="text-[9px] text-white/30 uppercase font-bold mb-4 italic">Na roleta: {cart.model_name}</p>
                  <button onClick={() => window.open(`https://wa.me/${cart.player_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Vi aqui que você tentou recarregar na roleta da ${cart.model_name}, mas o PIX acabou não concluindo 😕\n\nA roleta dela tá pegando fogo hoje! 🔥 Quer o código de novo?`)}`, '_blank')} className="w-full bg-[#00D97E] text-black py-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                    <MessageCircle size={16} fill="currentColor"/> Chamar no Zap
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. STATS ORIGINAIS (CARDS LARGOS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-[#0a0a0a] border border-[#FF1493]/20 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-[#FF1493]"><DollarSign size={80}/></div>
            <p className="text-[10px] font-black uppercase text-[#FF1493] tracking-widest mb-2">Faturamento Bruto</p>
            <h3 className="text-4xl font-black tracking-tighter">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="bg-[#0a0a0a] border border-emerald-500/20 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500"><ShieldCheck size={80}/></div>
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-2">Lucro Plataforma (30%)</p>
            <h3 className="text-4xl font-black tracking-tighter">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="bg-[#0a0a0a] border border-blue-500/20 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500"><Users size={80}/></div>
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Total Jogadores</p>
            <h3 className="text-4xl font-black tracking-tighter">{totalPlayers}</h3>
          </div>
        </div>

        {/* 3. UNIDADES PARCEIRAS (GRID ORIGINAL) */}
        <div className="mb-20">
            <h2 className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em] mb-10 flex items-center gap-4">
                <Users size={18}/> Unidades Parceiras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl hover:border-[#FF1493]/30 transition-all group">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF1493] to-[#7928CA] flex items-center justify-center font-black text-lg italic shadow-lg">{m.slug.substring(0,2).toUpperCase()}</div>
                    <div>
                      <h3 className="font-black uppercase text-lg italic tracking-tighter">{m.modelName}</h3>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Ganhos: R$ {m.totalEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/admin/dashboard?model=${m.id}&slug=${m.slug}`)} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2"><LayoutDashboard size={14}/> Painel</button>
                    <button onClick={() => window.open(`https://wa.me/${m.whatsapp?.replace(/\D/g, '')}`, '_blank')} className="p-4 bg-white/5 border border-white/10 hover:bg-emerald-500/20 rounded-xl text-white/40 hover:text-emerald-400 transition-all"><MessageCircle size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* 4. SOLICITAÇÕES DE SAQUE (BANNER) */}
        {withdrawals.filter(w => w.status === 'pendente').length > 0 && (
            <div className="mb-20 bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2.5rem] shadow-2xl">
                <h2 className="text-[11px] font-black uppercase text-emerald-500 mb-8 flex items-center gap-3 tracking-widest"><DollarSign size={18}/> Solicitações de Saque Pendentes</h2>
                <div className="grid gap-4">
                    {withdrawals.filter(w => w.status === 'pendente').map(w => {
                        const m = models.find(x => x.id === w.model_id);
                        return (
                            <div key={w.id} className="bg-black border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase text-white">{m?.modelName || 'Musa'}</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Valor: R$ {Number(w.amount).toFixed(2)}</p>
                                </div>
                                <button onClick={async () => {
                                    if(!confirm(`Confirmar pagamento de R$ ${Number(w.amount).toFixed(2)} para ${m?.modelName}?`)) return;
                                    await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${w.id}`, { method: 'PATCH', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'pago' }) });
                                    window.open(`https://wa.me/${m?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${Number(w.amount).toFixed(2)} foi enviado! 💸`)}`, '_blank');
                                    fetchData();
                                }} className="bg-emerald-500 text-black px-8 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">Aprovar e Pagar</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* 5. EXTRATO DE TRANSAÇÕES */}
        <div className="mt-20">
            <h2 className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em] mb-10 flex items-center gap-4">
                <DollarSign size={18}/> Extrato Real-Time da Plataforma
            </h2>
            <div className="grid gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                {transactions.map((t) => (
                    <div key={t.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between group hover:border-[#FF1493]/20 transition-all">
                        <div>
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest tracking-widest">Entrada PIX: R$ {Number(t.real_amount).toFixed(2)}</p>
                            <p className="text-xs font-black uppercase mt-1 text-white/80 italic">Musa Parceira: {t.modelName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] text-white/20 font-black uppercase mb-1">Lucro Savanah Labz</p>
                            <p className="text-lg font-black text-emerald-400">+ R$ {Number(t.platform_cut).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COMUNICADO GLOBAL */}
        <div className="mt-20 bg-[#0a0a0a] border border-[#FF1493]/20 p-10 rounded-[3rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-[#FF1493]"><Megaphone size={60}/></div>
          <h2 className="text-[11px] font-black uppercase text-[#FF1493] mb-8 flex items-center gap-3 tracking-[0.2em]">Configurações da Rede Global</h2>
          <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase text-white/30 ml-2 mb-2 block">Notificação Global para todas as modelos</label>
                <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-6 rounded-2xl text-[11px] text-white outline-none h-28 mb-4 resize-none focus:border-[#FF1493] transition-all" />
              </div>
              <button onClick={async () => { setSavingGlobal(true); await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ announcement_msg: globalMsg }) }); setSavingGlobal(false); alert("Atualizado!"); }} disabled={savingGlobal} className="w-full bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-[#FF1493] hover:text-white transition-all">{savingGlobal ? "Salvando..." : "Atualizar Comunicado Global"}</button>
          </div>
        </div>

      </div>

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-10 italic tracking-tighter text-white">Nova <span className="text-[#FF1493]">Franquia</span></h2>
            <form onSubmit={async (e) => {
                e.preventDefault(); setLoading(true);
                const now = new Date().toISOString(); 
                const res = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: newModel.slug.toLowerCase(), email: newModel.email, password: newModel.password, created_at: now }) });
                const m = await res.json();
                if(m[0]) await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: m[0].id, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }) });
                setShowModal(false); fetchData(); setLoading(false);
            }} className="space-y-5">
              <div><input type="text" required value={newModel.slug} onChange={e => setNewModel({ ...newModel, slug: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493] transition-all" placeholder="SLUG DA MODELO" /></div>
              <div><input type="email" required value={newModel.email} onChange={e => setNewModel({ ...newModel, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493] transition-all" placeholder="EMAIL DE ACESSO" /></div>
              <div><input type="text" required value={newModel.password} onChange={e => setNewModel({ ...newModel, password: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493] transition-all" placeholder="SENHA" /></div>
              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase shadow-xl flex justify-center items-center gap-2 mt-4 hover:bg-[#f062ff] transition-all">{loading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar Criação"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CANDIDATURAS */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setSelectedApp(null)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-all"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-10 text-indigo-400 italic italic tracking-tighter">Análise de Perfil</h2>
            <div className="flex gap-8 mb-10">
              <div className="w-32 h-44 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0 shadow-2xl"><img src={selectedApp.profile_url || selectedApp.bg_url} className="w-full h-full object-cover" /></div>
              <div className="flex-1 space-y-4">
                <div><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Nome / Nickname</p><p className="text-lg font-black text-white uppercase">{selectedApp.full_name}</p><p className="text-xs text-indigo-400 font-bold uppercase">@{selectedApp.nickname}</p></div>
                <div><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">WhatsApp</p><p className="text-sm font-bold text-white uppercase tracking-widest">{selectedApp.whatsapp}</p></div>
              </div>
            </div>
            <button onClick={async () => {
                setLoading(true);
                const cap = selectedApp.nickname.charAt(0).toUpperCase() + selectedApp.nickname.slice(1);
                const em = `${selectedApp.nickname}@admin.com`; const ps = `${cap}Admin26`;
                const r = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: selectedApp.nickname, email: em, password: ps, full_name: selectedApp.full_name, whatsapp: selectedApp.whatsapp }) });
                const d = await r.json();
                if(d[0]) {
                    await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: d[0].id, model_name: selectedApp.nickname.toUpperCase(), spin_cost: 2, bg_url: selectedApp.bg_url, profile_url: selectedApp.profile_url }) });
                    await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${selectedApp.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aprovada' }) });
                    window.open(`https://wa.me/${selectedApp.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi! Sua roleta foi criada. Login: ${em} | Senha: ${ps}`)}`, '_blank');
                    setSelectedApp(null); fetchData();
                }
                setLoading(false);
            }} disabled={loading} className="w-full bg-indigo-500 text-white py-6 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-400 transition-all">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <><ShieldCheck size={18}/> Aprovar e Criar Roleta</>}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
}
