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

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [globalMsg, setGlobalMsg] = useState("");
  const [rankVisible, setRankVisible] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fetchData = async () => {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

      // BUSCA PLANA: Resolve o ERRO 400 definitivamente separando as tabelas
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
      
      // Mapeia nomes das modelos para as transações no código (Evita Erro 400 de relação)
      const mappedTrans = trans.map((t: any) => {
          const c = confs.find((x: any) => x.model_id === t.model_id);
          return { ...t, modelName: c?.model_name || 'Musa' };
      });

      // Mapeia modelos para a grade principal
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

    } catch (err) { console.error("Erro no fetchData:", err); } finally { setInitialLoading(false); }
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
      fetchData(); // Atualiza a lista na hora
  };

  const financialData = useMemo(() => {
    const totalSales = transactions.reduce((acc, t) => acc + (Number(t.real_amount) || 0), 0);
    const totalPlatform = transactions.reduce((acc, t) => acc + (Number(t.platform_cut) || 0), 0);
    return { totalSales, totalPlatform };
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
        
        {/* HEADER ORIGINAL */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1>
            <p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">SISTEMA V.3001 MASTER</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={async () => { if(confirm("Deseja zerar transações e histórico?")) { /* Logic to reset */ } }} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase">ZERAR SISTEMA</button>
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={16}/> Criar Manual</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500"><Lock size={18}/></button>
          </div>
        </div>

        {/* 1. PIX ABANDONADOS (CARD VERMELHO ORIGINAL) */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} PIX Abandonados (Roleta, Fotos e Vídeos)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between group">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Cliente VIP'}</p>
                    <p className="text-[10px] text-red-400 font-bold uppercase mb-1">TENTOU COMPRAR R$ {Number(cart.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-white/50 uppercase font-mono">Na unidade: {cart.model_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`https://wa.me/${cart.player_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Vi aqui que você tentou comprar um conteúdo na Labz da ${cart.model_name}, mas o PIX acabou não concluindo 😕\n\nA roleta dela tá pegando fogo hoje! 🔥 Quer o código de novo?`)}`, '_blank')} className="flex-1 bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-lg hover:bg-emerald-400 transition-all">
                        <MessageCircle size={14} fill="currentColor"/> Chamar no Zap
                    </button>
                    <button onClick={() => handleIgnoreCart(cart.id)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <X size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CANDIDATURAS PENDENTES (AZUL INDIGO) */}
        {applications.length > 0 && (
          <div className="mb-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2.5rem]">
            <h2 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2 tracking-widest"><UserPlus size={16}/> {applications.length} Candidaturas de Novas Musas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {applications.map(app => (
                <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-black border border-indigo-500/20 p-5 rounded-3xl cursor-pointer hover:border-indigo-400 transition-all flex justify-between items-center group">
                  <div>
                    <p className="text-[12px] text-white uppercase font-black">{app.full_name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase">@{app.nickname}</p>
                  </div>
                  <ChevronDown size={14} className="text-indigo-500 group-hover:translate-y-1 transition-transform"/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FINANCEIRO GLOBAL (TRÊS CARDS ORIGINAIS) */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-6 opacity-10 text-[#FF1493]"><DollarSign size={60}/></div>
             <p className="text-[10px] font-black text-[#FF1493] uppercase mb-1 tracking-widest">Faturamento Bruto</p>
             <h3 className="text-4xl font-black tracking-tighter">{financialData.totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500"><ShieldCheck size={60}/></div>
             <p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Lucro Plataforma (30%)</p>
             <h3 className="text-4xl font-black tracking-tighter">{financialData.totalPlatform.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500"><Users size={60}/></div>
             <p className="text-[10px] font-black text-blue-500 uppercase mb-1 tracking-widest">Total Jogadores</p>
             <h3 className="text-4xl font-black tracking-tighter">{totalPlayers}</h3>
          </div>
        </div>

        {/* 4. BANNER DE SAQUES (TEXTO CORRETO) */}
        {withdrawals.filter(w => w.status === 'pendente').length > 0 && (
            <div className="mb-12 bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2.5rem] animate-in slide-in-from-right-4 shadow-2xl">
                <h2 className="text-xs font-black uppercase text-emerald-500 mb-6 flex items-center gap-2 tracking-[0.2em]"><DollarSign size={16}/> Solicitações de Saque Pendentes</h2>
                <div className="grid gap-3">
                    {withdrawals.filter(w => w.status === 'pendente').map(w => {
                        const m = models.find(x => x.id === w.model_id);
                        return (
                            <div key={w.id} className="bg-black/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                                <div><p className="text-xs font-black uppercase text-white">{m?.modelName || 'Musa'}</p><p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">VALOR: R$ {Number(w.amount).toFixed(2)}</p></div>
                                <button onClick={async () => {
                                    if(!confirm(`Confirmar pagamento de R$ ${Number(w.amount).toFixed(2)} para ${m?.modelName}?`)) return;
                                    await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${w.id}`, { method: 'PATCH', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'pago' }) });
                                    window.open(`https://wa.me/${m?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${Number(w.amount).toFixed(2)} foi enviado! 💸`)}`, '_blank');
                                    fetchData();
                                }} className="bg-emerald-500 text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-400 shadow-lg">Aprovar e Enviar PIX</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* 5. LISTA DE UNIDADES PARCEIRAS */}
        <h2 className="text-[11px] font-black uppercase text-white/40 mb-6 flex items-center gap-2 tracking-[0.3em]"><Crown size={14}/> Unidades Parceiras</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl relative group hover:border-[#FF1493]/20 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF1493] to-[#7928CA] flex items-center justify-center text-white font-black italic shadow-lg">{m.slug.substring(0,2).toUpperCase()}</div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/admin/models/${m.id}/players`)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all" title="Clientes"><Users size={16}/></button>
                  <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all shadow-lg"><LayoutDashboard size={16}/></a>
                  <button onClick={async () => { if(confirm(`Excluir ${m.slug}?`)) { await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${m.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); fetchData(); } }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="font-black uppercase text-lg italic tracking-tighter mb-1">{m.modelName}</h3>
              <p className="text-[10px] text-emerald-400 font-bold mb-4 uppercase tracking-widest">Ganhos Totais: R$ {m.totalEarnings.toFixed(2)}</p>
              <div className="space-y-1.5 p-4 bg-black/50 rounded-2xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-black"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div>
                  <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-black"><Key size={10} className="text-[#FFD700]"/> {m.password}</div>
              </div>
              {m.whatsapp && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                   <input type="text" placeholder="Mensagem rápida..." className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-emerald-500 transition-all" value={customMessages[m.id] || ""} onChange={(e) => setCustomMessages({ ...customMessages, [m.id]: e.target.value })} />
                   <button onClick={() => window.open(`https://wa.me/${m.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(customMessages[m.id] || `Oi ${m.modelName}!`)}`, '_blank')} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-3 rounded-xl hover:bg-emerald-500 hover:text-black transition-all shadow-lg"><MessageCircle size={16} fill="currentColor"/></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* COMUNICADO GLOBAL */}
        <div className="mt-12 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-[#FF1493]"><Megaphone size={80}/></div>
          <h2 className="text-xs font-black uppercase text-[#FF1493] mb-8 flex items-center gap-2 tracking-[0.3em]"><Sparkles size={14}/> Comunicado Global da Rede</h2>
          <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-6 rounded-[2rem] text-sm text-white outline-none h-32 mb-6 resize-none focus:border-[#FF1493] transition-all" placeholder="Mensagem para todas as musas..."/>
          <button onClick={handleSaveGlobal} disabled={savingGlobal} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-[#FF1493] hover:text-white transition-all flex items-center justify-center gap-3">
              {savingGlobal ? <Loader2 className="animate-spin" size={20}/> : <><Megaphone size={18}/> Disparar Comunicado</>}
          </button>
        </div>
      </div>

      {/* MODAL ANALISE CANDIDATURA (TEXTO DE ACEITE AUTOMÁTICO) */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-indigo-500/30 p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setSelectedApp(null)} className="absolute top-8 right-8 text-white/30 hover:text-white"><X size={28} /></button>
            <h2 className="text-2xl font-black uppercase mb-8 text-indigo-400 italic">Analisar Candidata</h2>
            <div className="flex gap-8 mb-8">
              <div className="w-32 h-44 bg-black border border-white/10 rounded-2xl overflow-hidden shrink-0 shadow-2xl"><img src={selectedApp.profile_url || selectedApp.bg_url} className="w-full h-full object-cover" /></div>
              <div className="flex-1 space-y-4">
                <div><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Nome Real</p><p className="text-lg font-black text-white uppercase tracking-tighter">{selectedApp.full_name}</p><p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">@{selectedApp.nickname}</p></div>
                <div><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Contato Direto</p><p className="text-sm font-bold text-white uppercase tracking-widest">{selectedApp.whatsapp}</p></div>
              </div>
            </div>
            <button onClick={async () => {
                setLoading(true);
                const cap = selectedApp.nickname.charAt(0).toUpperCase() + selectedApp.nickname.slice(1);
                const em = `${selectedApp.nickname.toLowerCase()}@admin.com`; 
                const ps = `${cap}Admin26`;
                try {
                    const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: selectedApp.nickname.toLowerCase(), email: em, password: ps, full_name: selectedApp.full_name, whatsapp: selectedApp.whatsapp }) });
                    const d = await resMod.json();
                    if(d[0]) {
                        await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: d[0].id, model_name: selectedApp.nickname.toUpperCase(), spin_cost: 2, bg_url: selectedApp.bg_url, profile_url: selectedApp.profile_url }) });
                        await fetch(`${supabaseUrl}/rest/v1/Applications?id=eq.${selectedApp.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aprovada' }) });
                        window.open(`https://wa.me/${selectedApp.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi! Sua roleta Savanah Labz foi criada com sucesso! ✨\n\nLogin: ${em}\nSenha: ${ps}\n\nAcesse seu painel agora e comece a faturar!`)}`, '_blank');
                        setSelectedApp(null); fetchData();
                    }
                } catch(e) { alert("Erro ao aprovar."); } finally { setLoading(false); }
            }} disabled={loading} className="w-full bg-indigo-500 text-white py-6 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-400 transition-all">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <><ShieldCheck size={20}/> Aprovar e Gerar Roleta</>}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CRIAR MANUAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-md relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase mb-10 italic tracking-tighter">Criar Unidade <span className="text-[#FF1493]">Manual</span></h2>
            <form onSubmit={async (e) => {
                e.preventDefault(); setLoading(true);
                const now = new Date().toISOString(); 
                const res = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ slug: newModel.slug.toLowerCase(), email: newModel.email, password: newModel.password, created_at: now }) });
                const m = await res.json();
                if(m[0]) await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: m[0].id, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }) });
                setShowModal(false); fetchData(); setLoading(false);
            }} className="space-y-5">
              <input type="text" required value={newModel.slug} onChange={e => setNewModel({ ...newModel, slug: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493]" placeholder="SLUG DA MUSA" />
              <input type="email" required value={newModel.email} onChange={e => setNewModel({ ...newModel, email: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493]" placeholder="EMAIL DE ACESSO" />
              <input type="text" required value={newModel.password} onChange={e => setNewModel({ ...newModel, password: e.target.value })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-5 text-white text-sm outline-none focus:border-[#FF1493]" placeholder="SENHA PADRÃO" />
              <button type="submit" disabled={loading} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase shadow-lg shadow-[#FF1493]/20 flex justify-center items-center gap-2 mt-4 hover:bg-[#f062ff] transition-all">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Finalizar Franquia"}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }`}</style>
    </div>
  );
}
