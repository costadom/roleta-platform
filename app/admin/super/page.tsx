"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, ShieldCheck, LayoutDashboard, Lock, Eye, EyeOff, Globe, Zap, Trash2, Loader2, Mail, Key, Megaphone, Trophy, Crown } from "lucide-react";

const DEFAULT_8_PRIZES = [
  { name: "Mimo Surpresa", shortLabel: "Mimo", type: "digital", weight: 12.5, color: "#FF1493", active: true },
  { name: "Vídeo Exclusivo", shortLabel: "Vídeo", type: "digital", weight: 12.5, color: "#8B0045", active: true },
  { name: "Foto Especial", shortLabel: "Foto", type: "digital", weight: 12.5, color: "#FF1493", active: true },
  { name: "Áudio Picante", shortLabel: "Áudio", type: "digital", weight: 12.5, color: "#8B0045", active: true },
  { name: "Acesso VIP", shortLabel: "VIP", type: "digital", weight: 12.5, color: "#FF1493", active: true },
  { name: "Chamada 5min", shortLabel: "Call", type: "digital", weight: 12.5, color: "#8B0045", active: true },
  { name: "Pack Econômico", shortLabel: "Pack", type: "digital", weight: 12.5, color: "#FF1493", active: true },
  { name: "Prêmio Master", shortLabel: "Master", type: "digital", weight: 12.5, color: "#8B0045", active: true },
];

export default function SuperAdmin() {
  const [isLogged, setIsLogged] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [models, setModels] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newModel, setNewModel] = useState({ slug: "", email: "", password: "" });

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
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?select=*&order=created_at.asc`, { headers, cache: 'no-store' });
      setModels(await resMod.json() || []);
      
      const resHist = await fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=*`, { headers, cache: 'no-store' });
      setHistory(await resHist.json() || []);
      
      const resGlob = await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers, cache: 'no-store' });
      const dataGlob = await resGlob.json();
      if (dataGlob[0]) {
        setGlobalMsg(dataGlob[0].announcement_msg);
        setRankVisible(dataGlob[0].ranking_visible);
        setGoalAmount(dataGlob[0].goal_amount);
        setGoalReward(dataGlob[0].goal_reward);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (localStorage.getItem("super_admin_auth") === "true") { setIsLogged(true); fetchData(); }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === "admin@savanahlabz.com" && adminPass === "SavanahBoss2026") {
      localStorage.setItem("super_admin_auth", "true");
      setIsLogged(true);
      fetchData();
    } else { alert("Acesso negado!"); }
  };

  const handleSaveGlobal = async (valRanking?: boolean) => {
    setSavingGlobal(true);
    const isVisible = typeof valRanking === 'boolean' ? valRanking : rankVisible;
    try {
      await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          announcement_msg: globalMsg, 
          ranking_visible: isVisible, 
          goal_amount: goalAmount, 
          goal_reward: goalReward, 
          updated_at: new Date().toISOString() 
        })
      });
      if (typeof valRanking !== 'boolean') alert("Configurações atualizadas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar.");
    } finally { setSavingGlobal(false); }
  };

  const toggleRankingVisibility = async () => {
    const nextVal = !rankVisible;
    setRankVisible(nextVal);
    await handleSaveGlobal(nextVal);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date().toISOString(); 
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ ...newModel, created_at: now }),
      });
      const dataMod = await resMod.json();
      if (!resMod.ok) throw new Error("A modelo já existe.");
      const mId = dataMod[0].id;

      await fetch(`${supabaseUrl}/rest/v1/Configs`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: mId, model_name: newModel.slug.toUpperCase(), spin_cost: 2, created_at: now }),
      });

      const prizesToInsert = DEFAULT_8_PRIZES.map(p => ({ id: crypto.randomUUID(), name: p.name, shortLabel: p.shortLabel, type: p.type, weight: p.weight, color: p.color, active: true, model_id: mId, createdAt: now, updatedAt: now }));
      await fetch(`${supabaseUrl}/rest/v1/Prize`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(prizesToInsert) });
      
      alert(`Franquia ${newModel.slug.toUpperCase()} criada!`);
      setShowModal(false); fetchData();
      setNewModel({ slug: "", email: "", password: "" });
    } catch (err: any) { alert("ERRO: " + err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover franquia ${name}?`)) return;
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
    fetchData();
  };

  const modelRanking = useMemo(() => {
    const counts: any = {};
    history.forEach(h => { counts[h.model_id] = (counts[h.model_id] || 0) + 1; });
    return models.map(m => ({ ...m, score: counts[m.id] || 0 })).sort((a, b) => b.score - a.score);
  }, [models, history]);

  if (!isLogged) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FF1493]/10 blur-[80px]" />
        <ShieldCheck size={40} className="text-[#FF1493] mx-auto mb-6 relative z-10"/>
        <h1 className="text-xl font-black uppercase text-white mb-8 italic relative z-10">Savanah Labz Master</h1>
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
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER COMPLETO E BOTÕES DE SAÍDA */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-[#FF1493] uppercase italic drop-shadow-[0_0_15px_rgba(255,20,147,0.3)]">Savanah Labz</h1>
            <p className="text-white/30 text-[10px] font-black tracking-[0.4em] mt-1">SISTEMA DE GESTÃO V.3001 MASTER</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#FF1493] hover:text-white transition-all shadow-xl"><Plus size={16}/> Nova Franqueada</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-red-500 transition-all" title="Sair do Master"><Lock size={18}/></button>
          </div>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]"><p className="text-[9px] font-black text-white/30 uppercase mb-1">Modelos Ativas</p><h3 className="text-2xl font-black">{models.length}</h3></div>
          <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]"><p className="text-[9px] font-black text-white/30 uppercase mb-1">Total de Giros</p><h3 className="text-2xl font-black text-[#FFD700]">{history.length}</h3></div>
          <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]"><p className="text-[9px] font-black text-white/30 uppercase mb-1">Status Server</p><h3 className="text-2xl font-black text-emerald-500 flex items-center gap-2">ONLINE <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/></h3></div>
          <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]"><p className="text-[9px] font-black text-white/30 uppercase mb-1">Versão</p><h3 className="text-2xl font-black text-white/50">PRO</h3></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: UNIDADES ATIVAS (COM SENHAS) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] px-2 flex items-center gap-2"><Users size={14}/> Unidades Franqueadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(m => (
                <div key={m.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] hover:border-[#FF1493]/30 transition-all shadow-xl group relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF1493]/5 rounded-full blur-[40px] pointer-events-none" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FF1493] group-hover:bg-[#FF1493] group-hover:text-white transition-all"><Users size={20}/></div>
                    <div className="flex gap-2">
                      <a href={`/admin/dashboard?model=${m.id}&slug=${m.slug}`} className="p-3 bg-white/5 border border-white/10 rounded-xl text-[#FF1493] hover:bg-[#FF1493] hover:text-white transition-all" title="Acessar Painel"><LayoutDashboard size={16}/></a>
                      <button onClick={() => handleDelete(m.id, m.slug)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Excluir"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="font-black uppercase text-sm mb-3 relative z-10">{m.slug}</h3>
                  <div className="space-y-1.5 p-3 bg-black/50 rounded-xl border border-white/5 relative z-10">
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Mail size={10} className="text-[#FF1493]"/> {m.email}</div>
                    <div className="flex items-center gap-2 text-[9px] text-white/50 font-bold uppercase tracking-widest"><Key size={10} className="text-[#FF1493]"/> {m.password}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: COMANDOS GLOBAIS E RANKING */}
          <div className="space-y-8">
            
            {/* AVISOS GLOBAIS */}
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Megaphone size={60}/></div>
               <h2 className="text-xs font-black uppercase text-[#FF1493] mb-6 flex items-center gap-2 tracking-widest relative z-10"><Megaphone size={14}/> Comunicado Global</h2>
               <textarea value={globalMsg} onChange={e => setGlobalMsg(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] text-white outline-none focus:border-[#FF1493] h-24 mb-4 resize-none relative z-10" placeholder="Digite a mensagem para todas as modelos..."/>
               <button onClick={() => handleSaveGlobal()} disabled={savingGlobal} className="w-full bg-white text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10">
                 {savingGlobal ? <Loader2 size={14} className="animate-spin"/> : "ENVIAR COMUNICADO"}
               </button>
            </div>

            {/* METAS E VISIBILIDADE DO RANKING */}
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
                   <input type="text" value={goalReward} onChange={e => setGoalReward(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-[#FFD700]" placeholder="Ex: Bônus de 10% no lucro"/>
                 </div>
                 
                 {/* BOTÃO DE COMANDO REAL PARA MOSTRAR/OCULTAR NAS MODELOS */}
                 <button onClick={toggleRankingVisibility} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase border transition-all active:scale-95 ${rankVisible ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                   {rankVisible ? 'RANKING VISÍVEL P/ ELAS' : 'RANKING OCULTO P/ ELAS'}
                 </button>
               </div>
               <button onClick={() => handleSaveGlobal()} className="w-full bg-[#FFD700] text-black py-4 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-[#FFD700]/20 active:scale-95 transition-all relative z-10">ATUALIZAR REGRAS</button>
            </div>

            {/* TOP 3 RANKING DE GIROS */}
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

      {/* MODAL NOVA FRANQUIA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[4rem] w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black uppercase mb-8 text-[#FF1493] text-center italic tracking-tighter">Nova Franquia</h2>
            <div className="space-y-4">
              <input type="text" placeholder="APELIDO (URL)" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.slug} onChange={e => setNewModel({...newModel, slug: e.target.value.toLowerCase().replace(/\s/g, '')})} />
              <input type="email" placeholder="E-MAIL" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.email} onChange={e => setNewModel({...newModel, email: e.target.value})} />
              <input type="text" placeholder="SENHA" required className="w-full bg-black border border-white/10 p-5 rounded-3xl text-xs outline-none focus:border-[#FF1493] text-white" value={newModel.password} onChange={e => setNewModel({...newModel, password: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#FF1493] py-5 rounded-[2rem] text-[10px] font-black uppercase mt-10 shadow-xl flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={16}/> : "CRIAR ACESSO & ROLETA"}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="w-full text-[9px] font-black uppercase text-white/20 mt-6 text-center tracking-widest">Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}