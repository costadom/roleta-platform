"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown, DollarSign, CalendarDays, AlertCircle, CheckCircle2, UserPlus, X, MessageCircle, Gamepad2, Video, RefreshCw } from "lucide-react";
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
  const [globalMsg, setGlobalMsg] = useState("");
  const [rankVisible, setRankVisible] = useState(false);
  const [goalAmount, setGoalAmount] = useState(1000);
  const [goalReward, setGoalReward] = useState("");
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  // 🔥 SISTEMA DE CARREGAMENTO SEGURO (SEQUENCIAL) 🔥
  const [loadStep, setLoadStep] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fetchData = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    
    try {
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

      // PASSO 1: Configurações Globais
      setLoadStep("Configurações...");
      const resGlob = await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }).then(r => r.json());
      if (resGlob?.[0]) {
        setGlobalMsg(resGlob[0].announcement_msg);
        setRankVisible(resGlob[0].ranking_visible);
        setGoalAmount(resGlob[0].goal_amount);
        setGoalReward(resGlob[0].goal_reward);
      }

      // PASSO 2: Modelos (O Coração do Painel)
      await sleep(150);
      setLoadStep("Unidades Franqueadas...");
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug,email,password,whatsapp,pix_key_1,pix_key_2,referred_by,created_at&order=created_at.asc`, { headers }).then(r => r.json());
      if (resMod) setModels(resMod);

      // LIBERA A TELA AQUI (O resto carrega em background)
      setInitialLoading(false);

      // PASSO 3: Transações
      await sleep(200);
      const resTrans = await fetch(`${supabaseUrl}/rest/v1/Transactions?select=real_amount,platform_cut,model_cut,model_id&order=created_at.desc&limit=100`, { headers }).then(r => r.json());
      if (resTrans) setTransactions(resTrans);

      // PASSO 4: Saques
      await sleep(200);
      const resWith = await fetch(`${supabaseUrl}/rest/v1/Withdrawals?select=*&order=created_at.desc`, { headers }).then(r => r.json());
      if (resWith) setWithdrawals(resWith);

      // PASSO 5: Candidaturas
      await sleep(200);
      const resApp = await fetch(`${supabaseUrl}/rest/v1/Applications?select=*`, { headers }).then(r => r.json());
      if (resApp) setApplications(resApp.filter((a: any) => !a.status || a.status.toLowerCase() === 'pendente'));

      // PASSO 6: Contagem de Jogadores
      await sleep(200);
      const resCount = await fetch(`${supabaseUrl}/rest/v1/Players?select=id&limit=1`, { headers: { ...headers, "Prefer": "count=exact" } });
      const range = resCount.headers.get("content-range");
      if (range) setTotalPlayers(parseInt(range.split("/")[1]));

      // PASSO 7: Carrinhos Abandonados
      await sleep(200);
      const resAbandon = await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?select=*&order=created_at.desc&limit=200`, { headers }).then(r => r.json());
      if (resAbandon) {
        const threeMins = Date.now() - 3 * 60 * 1000;
        setAbandoned(resAbandon.filter((c: any) => (!c.status || c.status === 'pendente') && new Date(c.created_at).getTime() < threeMins));
      }

      // PASSO 8: Vídeos
      await sleep(200);
      const resVideos = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?status=eq.pago&select=*,Models(slug,whatsapp,full_name)`, { headers }).then(r => r.json());
      if (resVideos) setVideoRequests(resVideos);

    } catch (err) {
      console.error(err);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") { 
      setIsLogged(true); 
      fetchData(); 
    } else { setInitialLoading(false); }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true");
      setIsLogged(true); setInitialLoading(true); fetchData();
    } else { alert("Acesso negado!"); }
  };

  // Funções de ação (Aprovar, Deletar, etc) - Mantidas originais
  const handleApproveWithdrawal = async (id: string, amount: number, modelPhone: string) => {
    if (!confirm(`Pagar R$ ${amount.toFixed(2)}?`)) return;
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify({ status: 'pago' }) });
    if (modelPhone) window.open(`https://wa.me/${modelPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Seu PIX de R$ ${amount.toFixed(2)} foi enviado!`)}`, '_blank');
    fetchData();
  };

  const financialData = useMemo(() => {
    let sales = 0, plat = 0, mods = 0;
    const byMod: Record<string, number> = {};
    transactions.forEach(t => {
      sales += Number(t.real_amount); plat += Number(t.platform_cut); mods += Number(t.model_cut);
      byMod[t.model_id] = (byMod[t.model_id] || 0) + Number(t.real_amount);
    });
    return { sales, plat, mods, byMod };
  }, [transactions]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-[#FF1493]/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-[#FF1493] rounded-full animate-spin"></div>
      </div>
      <h2 className="text-[#FF1493] font-black uppercase italic tracking-tighter text-xl animate-pulse">Savanah Master</h2>
      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Carregando {loadStep}</p>
    </div>
  );

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl">
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6"/>
        <h1 className="text-xl font-black text-white mb-8">ACESSO RESTRITO</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminUser} onChange={e => setAdminUser(e.target.value)} />
          <div className="relative">
            <input type={showPass ? "text" : "password"} placeholder="SENHA" className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>
          <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-lg shadow-[#FF1493]/20">Entrar no Sistema</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans pb-24 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div><h1 className="text-4xl font-black uppercase italic tracking-tighter"><span className="text-white">SAVANAH</span> <span className="text-[#FF1493]">LABZ</span></h1><p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1 uppercase">Painel de Controle v.3001</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchData()} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-[#FF1493] transition-all"><RefreshCw size={18}/></button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all"><Lock size={18}/></button>
          </div>
        </div>

        {/* ALERTAS: VÍDEOS */}
        {videoRequests.length > 0 && (
          <div className="mb-12 bg-blue-500/10 border border-blue-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(59,130,246,0.1)] animate-in slide-in-from-top-4">
            <h2 className="text-xs font-black uppercase text-blue-400 mb-4 flex items-center gap-2 tracking-widest"><Video size={16}/> {videoRequests.length} Vídeos VIP Pagos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoRequests.map(req => (
                <div key={req.id} className="bg-black border border-blue-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">@{req.Models?.slug}</p>
                    <p className="text-[12px] text-white font-bold leading-relaxed mb-4">"{req.description}"</p>
                  </div>
                  <button onClick={() => window.open(`https://wa.me/${req.Models?.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent('Oi linda! Você tem um novo pedido de Vídeo VIP! Aceite no seu painel!')}`)} className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-500 transition-all">Notificar Modelo</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIX ABANDONADOS */}
        {abandoned.length > 0 && (
          <div className="mb-12 bg-red-500/10 border border-red-500/30 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(239,68,68,0.1)] animate-in slide-in-from-top-4">
            <h2 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2 tracking-widest"><AlertCircle size={16}/> {abandoned.length} Oportunidades de Recuperação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abandoned.map(cart => (
                <div key={cart.id} className="bg-black border border-red-500/20 p-5 rounded-3xl flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="text-[12px] text-white uppercase font-black">{cart.player_name || 'Fã VIP'}</p>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">R$ {Number(cart.amount).toFixed(2)} Pendente</p>
                    <p className="text-[9px] text-white/50 uppercase font-mono italic">Musa: {cart.model_name}</p>
                  </div>
                  <button onClick={() => window.open(`https://wa.me/${(cart.player_phone || cart.whatsapp)?.replace(/\D/g, '')}?text=${encodeURIComponent(`Oii! Vi que você tentou acessar um conteúdo da ${cart.model_name}, mas o PIX não concluiu. Quer ajuda?`)}`)} className="w-full bg-emerald-500 text-black py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"><MessageCircle size={14}/> Chamar Fã</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINANCEIRO GLOBAL */}
        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 mb-4 flex items-center gap-2"><DollarSign size={14}/> Caixa Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#FF1493]/10 border border-[#FF1493]/30 p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign size={80} className="text-[#FF1493]"/></div>
               <p className="text-[10px] font-black text-[#FF1493] uppercase mb-1 tracking-widest relative z-10">Bruto Total</p>
               <h3 className="text-4xl font-black text-white relative z-10">{financialData.sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={80} className="text-emerald-500"/></div>
               <p className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest relative z-10">Lucro Savanah (30%)</p>
               <h3 className="text-4xl font-black text-white relative z-10">{financialData.plat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-center">
               <p className="text-[10px] font-black text-white/30 uppercase mb-1 tracking-widest">Modelos (70%)</p>
               <h3 className="text-4xl font-black text-white/70">{financialData.mods.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
          </div>
        </div>

        {/* LISTA DE FRANQUIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><Users size={14}/> Redes Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF1493]/5 rounded-full blur-[40px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493]"><Users size={20}/></div>
                    <div className="flex gap-2">
                       <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all"><LayoutDashboard size={16}/></a>
                       <button onClick={async () => { if(confirm('Apagar unidade?')) { await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${m.id}`, { method: 'DELETE', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); fetchData(); } }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-black uppercase text-sm mb-1 relative z-10">@{m.slug}</h3>
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 tracking-widest uppercase">Ganhos: {(financialData.byMod[m.id] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase truncate"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div>
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase"><Key size={10} className="text-[#FF1493]"/> {m.password}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SAQUES PENDENTES NO LADO DIREITO */}
          <div className="space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><DollarSign size={14}/> Saques Solicitados</h2>
            <div className="space-y-3">
              {withdrawals.filter(w => w.status === 'pendente').map(w => {
                const model = models.find(m => m.id === w.model_id);
                return (
                  <div key={w.id} className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-3xl animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-3">
                      <div><p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Modelo: {model?.slug}</p><p className="text-lg font-black text-white italic">R$ {Number(w.amount).toFixed(2)}</p></div>
                      <button onClick={() => handleApproveWithdrawal(w.id, w.amount, model?.whatsapp)} className="bg-amber-500 text-black px-4 py-2.5 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-all">Pagar</button>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                       <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Chaves PIX:</p>
                       <p className="text-[9px] font-mono text-emerald-400 truncate">1: {model?.pix_key_1 || 'N/A'}</p>
                       <p className="text-[9px] font-mono text-white/30 truncate">2: {model?.pix_key_2 || 'N/A'}</p>
                    </div>
                  </div>
                )
              })}
              {withdrawals.filter(w => w.status === 'pendente').length === 0 && (
                <div className="py-10 text-center text-white/10 font-black uppercase text-[10px] border border-dashed border-white/5 rounded-3xl tracking-widest">Tudo em dia ✅</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
