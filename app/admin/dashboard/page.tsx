"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, Loader2 } from "lucide-react";
import { PlayersManager } from "./players";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [isMounted, setIsMounted] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);

  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [showRankTab, setShowRankTab] = useState(false); 
  const [metaValue, setMetaValue] = useState(0);
  const [metaPrize, setMetaPrize] = useState("");

  const [activeTab, setActiveTab] = useState<"prizes" | "players" | "history" | "ranking">("prizes");
  const [prizes, setPrizes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [editingPrize, setEditingPrize] = useState<any | null>(null);

  const [currentBg, setCurrentBg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [modelName, setModelName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [spinCost, setSpinCost] = useState<number>(2);
  const [pix10, setPix10] = useState("");
  const [pix20, setPix20] = useState("");
  const [pix50, setPix50] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelSlug) setModelUrl(`${window.location.origin}/game/${modelSlug}`);
  }, [modelSlug]);

  const loadData = async () => {
    if (!modelId) return;
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache", "Pragma": "no-cache" };
      
      const resGlob = await fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers, cache: 'no-store' });
      const dataGlob = await resGlob.json();
      if (Array.isArray(dataGlob) && dataGlob[0]) {
        setGlobalAnnouncement(dataGlob[0].announcement_msg);
        const isRankVisible = dataGlob[0].ranking_visible === true || dataGlob[0].ranking_visible === "true";
        setShowRankTab(isRankVisible);
        if (!isRankVisible && activeTab === "ranking") setActiveTab("prizes");
        setMetaValue(dataGlob[0].goal_amount);
        setMetaPrize(dataGlob[0].goal_reward);
      }
      
      const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`, { headers, cache: 'no-store' });
      const dataPrizes = await resPrizes.json();
      if (Array.isArray(dataPrizes)) setPrizes(dataPrizes.sort((a: any, b: any) => b.weight - a.weight));
      
      const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`, { headers, cache: 'no-store' });
      const dataConfig = await resConfig.json();
      if (Array.isArray(dataConfig) && dataConfig[0]) { setCurrentBg(dataConfig[0].bg_url); setModelName(dataConfig[0].model_name || ""); setWhatsapp(dataConfig[0].whatsapp || ""); setSpinCost(dataConfig[0].spin_cost || 2); setPix10(dataConfig[0].pix_10 || ""); setPix20(dataConfig[0].pix_20 || ""); setPix50(dataConfig[0].pix_50 || ""); }
      
      const resHistory = await fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=*&order=created_at.desc`, { headers, cache: 'no-store' });
      const dataHistory = await resHistory.json();
      if (Array.isArray(dataHistory)) setHistory(dataHistory);
      
      const resAllMod = await fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug`, { headers, cache: 'no-store' });
      const allModData = await resAllMod.json();
      setAllModels(Array.isArray(allModData) ? allModData : []);
      
      const resPlayers = await fetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&select=id`, { headers, cache: 'no-store' });
      const dataPlayers = await resPlayers.json();
      if (Array.isArray(dataPlayers)) setPlayersCount(dataPlayers.length);
    } catch (err) { console.error("Erro na leitura:", err); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  const totalChance = useMemo(() => prizes.reduce((acc, p) => acc + (Number(p.weight) || 0), 0), [prizes]);
  
  const modelRanking = useMemo(() => {
    if (!Array.isArray(allModels)) return [];
    const counts: any = {};
    if (Array.isArray(history)) {
      history.forEach(h => { counts[h.model_id] = (counts[h.model_id] || 0) + 1; });
    }
    return allModels.map(m => ({ ...m, score: counts[m.id] || 0 })).sort((a, b) => b.score - a.score);
  }, [allModels, history]);

  const handleLogout = () => { localStorage.clear(); router.push('/admin'); };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName, whatsapp: whatsapp, spin_cost: spinCost, pix_10: pix10, pix_20: pix20, pix_50: pix50 }) });
    setSavingSettings(false); alert("Painel Atualizado!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Máximo 2MB!");
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const fileName = `bg_${modelId}_${Date.now()}.jpeg`;
    await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "image/jpeg" }, body: selectedFile });
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}?t=${Date.now()}`;
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: publicUrl }) });
    setCurrentBg(publicUrl); setSelectedFile(null); setPreviewUrl(null); setUploading(false); alert("Fundo Atualizado!");
  };

  const handleSaveEditPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrize.name, shortLabel: editingPrize.name, weight: Number(editingPrize.weight), color: editingPrize.color, updatedAt: new Date().toISOString() }) });
    setEditingPrize(null); loadData();
  };

  if (!modelId) return <div className="min-h-screen bg-black flex items-center justify-center text-white uppercase font-black">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          {isSuper ? (
            <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all"><ArrowLeft size={14}/> Voltar Master</button>
          ) : (
            <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 bg-red-500/5 px-4 py-2 rounded-xl transition-all"><LogOut size={14}/> Sair</button>
          )}
          <div className="text-right"><h1 className="text-2xl font-black uppercase tracking-tighter text-[#FF1493]">Painel VIP</h1><p className="text-[#FFD700] text-[9px] font-bold uppercase tracking-[0.2em]">{modelName || "Modelo"}</p></div>
        </div>

        {globalAnnouncement && (
          <div className="mb-6 bg-[#FF1493]/10 border border-[#FF1493]/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 bg-[#FF1493] text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#FF1493]/20"><Megaphone size={20}/></div>
            <p className="text-[11px] font-black uppercase text-[#FF1493] leading-relaxed">{globalAnnouncement}</p>
          </div>
        )}

        {showRankTab && (
          <div className="mb-8 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden group shadow-2xl animate-in zoom-in duration-500">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} className="text-amber-500"/></div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4"><Trophy size={16} className="text-amber-500"/><h3 className="text-xs font-black uppercase text-amber-500 tracking-widest">Desafio de Faturamento</h3></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><p className="text-[9px] text-white/30 uppercase font-black mb-1">Meta Semanal</p><p className="text-xl font-black text-white">R$ {metaValue.toLocaleString('pt-BR')}</p></div>
                 <div><p className="text-[9px] text-white/30 uppercase font-black mb-1">Prêmio</p><p className="text-xl font-black text-amber-500">{metaPrize || "Consulte o Master"}</p></div>
               </div>
             </div>
          </div>
        )}

        <div className="mb-8 bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4"><div className="p-3 bg-[#FFD700] text-black rounded-2xl shadow-lg"><LinkIcon size={20}/></div><div><p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Link de Divulgação</p><p className="text-sm font-bold text-white lowercase tracking-tight">{isMounted ? modelUrl : "..."}</p></div></div>
          <button onClick={() => { navigator.clipboard.writeText(modelUrl); alert("Copiado!"); }} className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-[#FFD700] hover:text-black transition-all">Copiar Link</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center"><p className="text-[8px] font-black uppercase text-white/30 mb-1">Pendentes</p><h2 className="text-xl font-black text-amber-400">{history.filter(h => h.model_id === modelId && !h.delivered).length}</h2></div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center"><p className="text-[8px] font-black uppercase text-white/30 mb-1">Clientes</p><h2 className="text-xl font-black text-white">{playersCount}</h2></div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center"><p className="text-[8px] font-black uppercase text-white/30 mb-1">Giros</p><h2 className="text-xl font-black text-[#FFD700]">{history.filter(h => h.model_id === modelId).length}</h2></div>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto">
          <button onClick={() => setActiveTab("prizes")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "prizes" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Roleta</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "players" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Jogadores</button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-white/10 text-[#FF1493]" : "text-white/30"}`}>Saques</button>
          
          {showRankTab && (
            <button onClick={() => setActiveTab("ranking")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "ranking" ? "bg-amber-500/20 text-amber-500 shadow-lg shadow-amber-500/10" : "text-white/30"}`}>Ranking</button>
          )}
        </div>

        {activeTab === "prizes" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-40 h-24 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative shrink-0">{(previewUrl || currentBg) ? <img src={(previewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}</div>
              <div className="flex-1 text-center sm:text-left"><p className="text-[10px] font-black uppercase text-white/40 mb-3 tracking-widest">Fundo (Máx 2MB | JPEG)</p><label className="bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-white/10 transition-all">Trocar Foto <input type="file" accept="image/jpeg" onChange={handleFileChange} className="hidden" /></label>{selectedFile && <button onClick={handleSaveImage} className="bg-[#FF1493] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase ml-2">Salvar</button>}</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left shadow-xl">
              <h2 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-[#FF1493] tracking-widest"><DollarSign size={14} /> Dados Financeiros</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">Nome na Roleta</label><input type="text" value={modelName} onChange={e => setModelName(e.target.value)} className="bg-transparent text-lg font-black outline-none text-[#FFD700] w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">WhatsApp</label><input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="bg-transparent text-lg font-black outline-none text-white w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">Custo Giro</label><input type="number" value={spinCost} onChange={e => setSpinCost(Number(e.target.value))} className="bg-transparent text-lg font-black outline-none text-white w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">PIX R$ 10</label><input type="text" value={pix10} onChange={e => setPix10(e.target.value)} className="bg-transparent text-[10px] font-mono outline-none text-white/60 w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">PIX R$ 20</label><input type="text" value={pix20} onChange={e => setPix20(e.target.value)} className="bg-transparent text-[10px] font-mono outline-none text-white/60 w-full" /></div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-black text-white/40 block mb-1">PIX R$ 50</label><input type="text" value={pix50} onChange={e => setPix50(e.target.value)} className="bg-transparent text-[10px] font-mono outline-none text-white/60 w-full" /></div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-[1.01] transition-all">SALVAR TUDO</button>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
               <div className="flex justify-between items-center mb-6"><h2 className="text-xs font-black uppercase text-white/50 tracking-widest">Slots da Roleta</h2><span className={`text-[10px] font-black ${totalChance === 100 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>{totalChance.toFixed(2)}% / 100%</span></div>
               <div className="grid gap-3">
                {prizes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-[#FF1493]/30 transition-all text-left">
                    <div className="flex items-center gap-4"><div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: p.color }} /><div><p className="text-xs font-black uppercase text-white">{p.name}</p><p className="text-[9px] font-bold text-[#FFD700]">{Number(p.weight).toFixed(2)}% de chance</p></div></div>
                    <button onClick={() => setEditingPrize(p)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-[#FF1493] transition-all"><Edit3 size={18}/></button>
                  </div>
                ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === "players" && <PlayersManager modelId={modelId} />}
        
        {activeTab === "history" && (
          <div className="grid gap-3 animate-in fade-in duration-500">
            {history.filter(h => h.model_id === modelId).map((h, i) => (
              <div key={h.id || i} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${h.delivered ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div><h3 className={`text-sm font-black uppercase ${h.delivered ? 'text-white/30' : 'text-white'}`}>{h.player_name}</h3><p className="text-[9px] font-bold text-[#FFD700] uppercase mt-1">{h.prize_name}</p></div>
                <button onClick={async () => {
                  if (h.delivered) return;
                  await fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=eq.${h.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ delivered: true }) });
                  loadData();
                }} className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${h.delivered ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/20'}`}><Check size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {showRankTab && activeTab === "ranking" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-center py-6">
              <h2 className="text-xl font-black uppercase text-amber-500 italic tracking-tighter">Ranking das Estrelas</h2>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Quem mais vendeu esta semana</p>
            </div>
            {modelRanking.map((m, i) => (
              <div key={m.id} className={`p-6 rounded-[2rem] border flex items-center justify-between transition-all ${m.id === modelId ? 'bg-[#FF1493]/10 border-[#FF1493]/30 scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-5">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${i === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-white/30'}`}>
                    {i === 0 ? <Crown size={20}/> : `#${i+1}`}
                  </div>
                  <div>
                    <h3 className={`font-black uppercase text-sm ${m.id === modelId ? 'text-[#FF1493]' : 'text-white'}`}>{m.slug} {m.id === modelId && "(Você)"}</h3>
                    <p className="text-[9px] font-black text-white/20 uppercase">Parceira Savanah Labz</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-white/30 uppercase mb-1">Giros Totais</p>
                  <p className="text-xl font-black text-white">{m.score}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditPrize} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center tracking-tighter">Editar Prêmio</h2>
            <div className="space-y-4">
              <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
              <input type="number" step="0.01" value={editingPrize.weight} onChange={e => setEditingPrize({...editingPrize, weight: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
              <div className="flex items-center gap-3 bg-black border border-white/10 p-4 rounded-2xl"><Palette size={16} className="text-white/30" /><input type="color" value={editingPrize.color} onChange={e => setEditingPrize({...editingPrize, color: e.target.value})} className="w-10 h-8 bg-transparent border-none cursor-pointer" /><span className="text-[10px] text-white/40 font-black uppercase">Cor da Fatia</span></div>
            </div>
            <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl text-[10px] font-black uppercase mt-8 shadow-xl">Salvar Alterações</button>
            <button type="button" onClick={() => setEditingPrize(null)} className="w-full text-[9px] font-black text-white/20 mt-6 uppercase text-center tracking-widest">Voltar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white uppercase font-black">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
