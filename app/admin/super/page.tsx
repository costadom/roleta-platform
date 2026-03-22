"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Trash2, Loader2, Mail, Key, Megaphone, DollarSign, AlertCircle, MessageCircle, X, UserPlus, Crown, Sparkles } from "lucide-react";

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
  const [globalMsg, setGlobalMsg] = useState("");
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
      
      const mappedTrans = trans.map((t: any) => {
          const c = confs.find((x: any) => x.model_id === t.model_id);
          return { ...t, modelName: c?.model_name || 'Musa' };
      });

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
      if (g[0]) { setGlobalMsg(g[0].announcement_msg); }

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
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/><h1 className="text-xl font-black text-white mb-8">PAINEL MASTER</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
          <div className="relative"><input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Acessar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1 uppercase">Sistema V.3001 Master</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </div>

        {/* PIX ABANDONADOS - CARD VERMELHO ORIGINAL */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-red-500 mb-6 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => {
                const phone = cart.player_phone || cart.whatsapp;
                return (
                  <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Cliente VIP'}</p>
                      <p className="text-[10px] text-red-400 font-bold uppercase mb-1">R$ {Number(cart.amount).toFixed(2)}</p>
                      <p className="text-[9px] text-white/50 uppercase font-mono italic">Unidade: {cart.model_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        disabled={!phone}
                        onClick={() => window.open(`https://wa.me/${phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Vi aqui que você tentou comprar um conteúdo na Labz da ${cart.model_name}, mas o PIX não concluiu 😕\n\nA roleta dela tá pegando fogo hoje! 🔥 Quer o código de novo?`)}`, '_blank')} 
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 ${phone ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/20'}`}
                      >
                        <MessageCircle size={14}/> {phone ? 'Chamar no Zap' : 'Sem Telefone'}
                      </button>
                      <button onClick={() => handleIgnoreCart(cart.id)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500"><X size={14}/></button>
                    </div>
                  </div>
                )
              })}
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

        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-[#FF1493] uppercase mb-1">Faturamento Bruto</p><h3 className="text-4xl font-black">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Plataforma (30%)</p><h3 className="text-4xl font-black">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem]"><p className="text-[10px] font-black text-blue-500 uppercase mb-1">Total Jogadores</p><h3 className="text-4xl font-black">{totalPlayers}</h3></div>
        </div>

        {/* LISTA DE MODELOS */}
        <h2 className="text-[11px] font-black uppercase text-white/40 mb-6 flex items-center gap-2 tracking-[0.3em]"><Users size={14}/> Unidades Parceiras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF1493] to-[#7928CA] flex items-center justify-center font-black italic shadow-lg">{m.slug.substring(0,2).toUpperCase()}</div>
                <div className="flex gap-2">
                  <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all shadow-lg"><LayoutDashboard size={16}/></a>
                  <button onClick={async () => { if(confirm(`Excluir ${m.slug}?`)) { await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${m.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); fetchData(); } }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-black uppercase text-lg italic tracking-tighter mb-1">{m.modelName}</h3>
              <p className="text-[10px] text-emerald-400 font-bold mb-4 uppercase">Ganhos: R$ {m.totalEarnings.toFixed(2)}</p>
              <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5"><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Mail size={10}/> {m.email}</div><div className="flex items-center gap-2 text-[9px] text-white/50 uppercase"><Key size={10}/> {m.password}</div></div>
            </div>
          ))}
        </div>

        {/* COMUNICADO GLOBAL */}
        <div className="mt-12 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-[#FF1493]"><Megaphone size={80}/></div>
          <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest"><Megaphone size={14}/> Comunicado Global</h2>
          <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none h-24 mb-4 resize-none" />
          <button onClick={async () => { setSavingGlobal(true); await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ announcement_msg: globalMsg }) }); setSavingGlobal(false); alert("Atualizado!"); }} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all">{savingGlobal ? "Salvando..." : "ENVIAR COMUNICADO"}</button>
        </div>
      </div>

      {/* MODAL ANALISE CANDIDATURA */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 text-indigo-400 italic">Analisar Perfil</h2>
            <div className="flex gap-6 mb-6">
              <div className="w-32 h-40 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0"><img src={selectedApp.profile_url || selectedApp.bg_url} className="w-full h-full object-cover" /></div>
              <div className="flex-1 space-y-2">
                <div><p className="text-[8px] text-white/40 uppercase font-black">Nome / Nickname</p><p className="text-sm font-black text-white uppercase">{selectedApp.full_name}</p><p className="text-[10px] text-indigo-400 uppercase font-bold">@{selectedApp.nickname}</p></div>
                <div><p className="text-[8px] text-white/40 uppercase font-black">Contato</p><p className="text-[10px] font-bold text-white uppercase">{selectedApp.whatsapp}</p></div>
              </div>
            </div>
            <button onClick={async () => {
                setLoading(true);
                const cap = selectedApp.nickname.charAt(0).toUpperCase() + selectedApp.nickname.slice(1);
                const em = `${selectedApp.nickname.toLowerCase()}@admin.com`; const ps = `${cap}Admin26`;
                const r = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: selectedApp.nickname.toLowerCase(), email: em, password: ps, full_name: selectedApp.full_name, whatsapp: selectedApp.whatsapp }) });
                const d = await r.json();
                if(d[0]) {
                    await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: d[0].id, model_name: selectedApp.nickname.toUpperCase(), spin_cost: 2, bg_url: selectedApp.bg_url, profile_url: selectedApp.profile_url }) });
                    await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${selectedApp.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aprovada' }) });
                    window.open(`https://wa.me/${selectedApp.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi! Sua roleta Savanah Labz foi criada com sucesso! ✨\n\nLogin: ${em}\nSenha: ${ps}\n\nAcesse seu painel agora e comece a faturar!`)}`, '_blank');
                    setSelectedApp(null); fetchData();
                }
                setLoading(false);
            }} disabled={loading} className="w-full bg-indigo-500 text-white py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><ShieldCheck size={16}/> Aprovar e Criar Roleta</>}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-6 italic tracking-tighter">Criar <span className="text-[#FF1493]">Manual</span></h2>
            <form onSubmit={async (e) => {
                e.preventDefault(); setLoading(true);
                const now = new Date().toISOString(); 
                const res = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: newModel.slug.toLowerCase(), email: newModel.email, password: newModel.password, created_at: now }) });
                const m = await res.json();
                if(m[0]) await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: m[0].id, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }) });
                setShowModal(false); fetchData(); setLoading(false);
            }} className="space-y-4">
              <input type="text" required value={newModel.slug} onChange={e => setNewModel({ ...newModel, slug: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" placeholder="SLUG" />
              <input type="email" required value={newModel.email} onChange={e => setNewModel({ ...newModel, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" placeholder="EMAIL" />
              <input type="text" required value={newModel.password} onChange={e => setNewModel({ ...newModel, password: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none" placeholder="SENHA" />
              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg mt-4">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Criar Franquia"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
