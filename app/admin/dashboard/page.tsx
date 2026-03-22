"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Image as ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, 
  Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, 
  Loader2, Wallet, Calendar, CheckCircle2, Bell, FileText, Lock, 
  HelpCircle, ChevronUp, ChevronDown, User, Globe, Camera, Video, Send, Trash2, LayoutGrid, CheckCircle, Clock, AlertTriangle, Settings
} from "lucide-react";
import PlayersManager from "./players";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [isMounted, setIsMounted] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(true);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [showRankTab, setShowRankTab] = useState(false); 
  const [metaValue, setMetaValue] = useState(0);
  const [metaPrize, setMetaPrize] = useState("");

  const [activeTab, setActiveTab] = useState<"finance" | "hub" | "gallery" | "video_requests" | "prizes" | "players" | "history" | "ranking">("finance");
  
  const [prizes, setPrizes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [rankHistory, setRankHistory] = useState<any[]>([]);
  const [editingPrize, setEditingPrize] = useState<any | null>(null);

  const [modelBalance, setModelBalance] = useState<number>(0);
  const [lastWithdrawal, setLastWithdrawal] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [pixKey1, setPixKey1] = useState("");
  const [pixKey2, setPixKey2] = useState("");
  const [savingPix, setSavingPix] = useState(false);

  const [currentBg, setCurrentBg] = useState<string | null>(null);
  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);

  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [showcaseVisible, setShowcaseVisible] = useState(false);

  const [modelName, setModelName] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // NOVOS ESTADOS HUB E GALERIA
  const [bio, setBio] = useState("");
  const [savingHub, setSavingHub] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [newMediaPrice, setNewMediaPrice] = useState(0);
  const [newMediaCaption, setNewMediaCaption] = useState("");
  const [videoRequests, setVideoRequests] = useState<any[]>([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelId) setReferralUrl(`${window.location.origin}/?ref=${modelId}`);
    if (modelSlug) setModelUrl(`${window.location.origin}/game/${modelSlug}`);
  }, [modelSlug, modelId]);

  const loadData = async () => {
    if (!modelId) return;
    setDashboardLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const [resGlob, resModel, resNotif, resTrans, resPrizes, resConfig, resMyHist, resRankHist, resAllMod, resMedia, resVideos] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?model_id=eq.${modelId}&status=eq.pago&is_read=eq.false`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&select=model_cut`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?model_id=eq.${modelId}&order=created_at.desc&limit=50`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?select=model_id&limit=2000`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => [])
      ]);

      if (resGlob[0]) {
        setGlobalAnnouncement(resGlob[0].announcement_msg);
        setShowRankTab(resGlob[0].ranking_visible === true);
        setMetaValue(resGlob[0].goal_amount);
        setMetaPrize(resGlob[0].goal_reward);
      }
      if (resModel[0]) {
        setModelBalance(resModel[0].balance || 0);
        setLastWithdrawal(resModel[0].last_withdrawal);
        setPixKey1(resModel[0].pix_key_1 || "");
        setPixKey2(resModel[0].pix_key_2 || "");
        setTermsAccepted(resModel[0].terms_accepted === true);
        setBio(resModel[0].bio || "");
      }
      setAccumulatedEarnings(resTrans.reduce((acc:any, curr:any) => acc + (Number(curr.model_cut) || 0), 0));
      setPrizes(resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)));
      setNotifications(resNotif); setHistory(resMyHist); setRankHistory(resRankHist); setAllModels(resAllMod); setMediaList(resMedia); setVideoRequests(resVideos);
      if (resConfig[0]) { setCurrentBg(resConfig[0].bg_url); setCurrentProfile(resConfig[0].profile_url); setModelName(resConfig[0].model_name || ""); setShowcaseVisible(resConfig[0].showcase_visible === true); }
    } catch (err) { console.error(err); } finally { setDashboardLoading(false); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  // --- FUNÇÕES FINANCEIRO ---
  const handleSavePix = async () => {
    setSavingPix(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 }) });
    setSavingPix(false); alert("Chaves PIX salvas!");
  };

  const handleWithdraw = async () => {
    if (modelBalance < 20) return alert("Mínimo R$ 20");
    setIsWithdrawing(true);
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) });
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) });
    setModelBalance(0); setIsWithdrawing(false); alert("Saque solicitado!");
  };

  // --- FUNÇÕES HUB E GALERIA ---
  const handleSaveHub = async () => {
    setSavingHub(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bio }) });
    setSavingHub(false); alert("Perfil Hub atualizado!");
  };

  const handleUploadPhoto = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande (Máx 10MB)");
    setUploading(true);
    const fileName = `${modelId}/gal_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": file.type }, body: file });
    if (uploadRes.ok) {
        const url = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
        await fetch(`${supabaseUrl}/rest/v1/Media`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, url, price: newMediaPrice, caption: newMediaCaption }) });
        setNewMediaCaption(""); setNewMediaPrice(0); loadData(); alert("Foto publicada!");
    }
    setUploading(false);
  };

  // --- FUNÇÕES ROLETA E PRÊMIOS ---
  const checkIsFake = (prize: any) => { 
    const name = String(prize.name).toUpperCase();
    return Number(prize.weight) <= 0.05 || name.includes("PIX") || name.includes("PRESENCIAL") || name.includes("100") || name.includes("R$"); 
  };

  const movePrize = async (index: number, direction: 'up' | 'down') => {
    const newPrizes = [...prizes]; const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPrizes.length || checkIsFake(newPrizes[index]) || checkIsFake(newPrizes[targetIndex])) return;
    [newPrizes[index], newPrizes[targetIndex]] = [newPrizes[targetIndex], newPrizes[index]];
    let currentWeight = 10; const updates = newPrizes.map(p => { if(!checkIsFake(p)) { p.weight = currentWeight; currentWeight+=10; return {id:p.id, weight:p.weight}; } return null; }).filter(Boolean);
    setPrizes([...newPrizes]);
    await Promise.all(updates.map((u:any) => fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${u.id}`, { method:"PATCH", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":"application/json"}, body:JSON.stringify({weight:u.weight}) })));
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { setSelectedProfileFile(file); setProfilePreviewUrl(URL.createObjectURL(file)); }
  };
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) { setSelectedBgFile(file); setBgPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSaveProfileImage = async () => {
    if (!selectedProfileFile) return; setUploading(true);
    const fileName = `profile_${modelId}_${Date.now()}.${selectedProfileFile.name.split('.').pop()}`;
    await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": selectedProfileFile.type }, body: selectedProfileFile });
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ profile_url: publicUrl }) });
    setCurrentProfile(publicUrl); setSelectedProfileFile(null); setUploading(false); alert("Perfil Atualizado!");
  };

  const handleSaveBgImage = async () => {
    if (!selectedBgFile) return; setUploading(true);
    const fileName = `bg_${modelId}_${Date.now()}.${selectedBgFile.name.split('.').pop()}`;
    await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": selectedBgFile.type }, body: selectedBgFile });
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
    await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: publicUrl }) });
    setCurrentBg(publicUrl); setSelectedBgFile(null); setUploading(false); alert("Fundo Atualizado!");
  };

  if (dashboardLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Seu novo universo está sendo carregado...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => isSuper ? router.push('/admin/super') : (localStorage.clear(), router.push('/admin'))} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all">
            {isSuper ? <><ArrowLeft size={14}/> Voltar Master</> : <><LogOut size={14}/> Sair</>}
          </button>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[#FF1493]">Painel VIP</h1>
            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} onBlur={async () => { await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName }) }); }} className="bg-transparent text-[#FFD700] text-[9px] font-bold uppercase tracking-[0.2em] text-right outline-none border-b border-transparent focus:border-[#FFD700] w-full" />
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "finance" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border shadow-lg" : "text-white/30"}`}>Ganhos</button>
          <button onClick={() => setActiveTab("hub")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "hub" ? "bg-[#FF1493]/20 text-[#FF1493] border-[#FF1493]/30 border shadow-lg" : "text-white/30"}`}>Hub</button>
          <button onClick={() => setActiveTab("gallery")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "gallery" ? "bg-[#FF1493]/20 text-[#FF1493] border-[#FF1493]/30 border shadow-lg" : "text-white/30"}`}>Galeria</button>
          <button onClick={() => setActiveTab("video_requests")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "video_requests" ? "bg-[#FF1493]/20 text-[#FF1493] border-[#FF1493]/30 border shadow-lg" : "text-white/30"}`}>Vídeos</button>
          <button onClick={() => setActiveTab("prizes")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "prizes" ? "bg-white/10 text-white" : "text-white/30"}`}>Roleta</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "players" ? "bg-white/10 text-white" : "text-white/30"}`}>Fãs</button>
          <button onClick={() => setActiveTab("history")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "history" ? "bg-white/10 text-white" : "text-white/30"}`}>Entregas</button>
        </div>

        {/* FINANCEIRO */}
        {activeTab === "finance" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h2 className="text-xs font-black uppercase mb-2 text-emerald-500">Saldo Disponível</h2>
                <div className="text-5xl font-black text-white mb-8 tracking-tighter">{modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <button onClick={handleWithdraw} disabled={isWithdrawing || modelBalance < 20} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all">Solicitar Saque (PIX)</button>
              </div>
              <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
                <h2 className="text-xs font-black uppercase mb-2 text-[#FFD700]">Lucro Acumulado (6 Meses)</h2>
                <div className="text-5xl font-black text-white tracking-tighter">{accumulatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>
            <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
              <h2 className="text-xs font-black uppercase mb-4 text-[#FF1493] flex items-center gap-2"><DollarSign size={16}/> Chaves PIX</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input type="text" value={pixKey1} onChange={e => setPixKey1(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white" placeholder="Chave Principal" />
                <input type="text" value={pixKey2} onChange={e => setPixKey2(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white" placeholder="Chave Reserva" />
              </div>
              <button onClick={handleSavePix} disabled={savingPix} className="bg-[#FF1493] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase">{savingPix ? "Salvando..." : "Salvar Chaves"}</button>
            </div>
          </div>
        )}

        {/* HUB */}
        {activeTab === "hub" && (
            <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                <div className="bg-black border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <h2 className="text-xl font-black uppercase italic mb-8 text-[#FF1493]">Editar Meu Hub Público</h2>
                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase text-white/40 mb-2 block ml-2">Biografia</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-[#FF1493] h-40 resize-none" placeholder="Diga algo picante..."/>
                        <button onClick={handleSaveHub} disabled={savingHub} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg">{savingHub ? "Salvando..." : "Salvar Hub"}</button>
                    </div>
                </div>
            </div>
        )}

        {/* GALERIA */}
        {activeTab === "gallery" && (
          <div className="animate-in slide-in-from-bottom-4">
            <div className="bg-black border border-white/10 p-10 rounded-[3rem] mb-12 shadow-2xl grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-[#FF1493]">Legenda da Foto (Máx 500)</label>
                    <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-32" placeholder="O que tem na foto? 🔥"/>
                </div>
                <div className="flex flex-col justify-between">
                    <div><label className="text-[10px] font-black text-white/40 mb-2 block">Preço (0 = Grátis)</label><input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-white font-black text-2xl outline-none"/></div>
                    <label className="w-full bg-[#FF1493] text-white py-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] shadow-xl mt-6">{uploading ? <Loader2 className="animate-spin" size={18}/> : <><Camera size={20}/> Escolher Foto</>}<input type="file" hidden accept="image/*" onChange={handleUploadPhoto} disabled={uploading}/></label>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mediaList.map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                        <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><button onClick={async () => { if(confirm("Deletar?")) { await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><Trash2 size={20}/></button></div>
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#FF1493]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price}`}</div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* ROLETA E CONFIGURAÇÕES DE IMAGEM */}
        {activeTab === "prizes" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div><h3 className="text-[11px] font-black uppercase text-[#FFD700] mb-1">Exibir na Vitrine</h3><p className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Apareça na página inicial da plataforma.</p></div>
              <button onClick={async () => { const n = !showcaseVisible; setShowcaseVisible(n); await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ showcase_visible: n }) }); }} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${showcaseVisible ? 'bg-[#FF1493]' : 'bg-white/20'}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${showcaseVisible ? 'translate-x-7' : 'translate-x-1'}`} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-32 h-32 mb-4 bg-white/5 border border-white/10 rounded-full overflow-hidden flex items-center justify-center">{(profilePreviewUrl || currentProfile) ? <img src={(profilePreviewUrl || currentProfile) as string} className="w-full h-full object-cover" /> : <User className="text-white/10" size={40} />}</div>
                <h3 className="text-[11px] font-black uppercase text-[#FFD700] mb-4">Foto Vitrine (Showcase)</h3>
                <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2">Escolher Arquivo<input type="file" accept="image/*" onChange={handleProfileFileChange} className="hidden" /></label>
                {selectedProfileFile && <button onClick={handleSaveProfileImage} disabled={uploading} className="w-full bg-[#FFD700] text-black px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#FFD700]/20">{uploading ? "Salvando..." : "Salvar Foto"}</button>}
              </div>

              <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-full h-32 mb-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">{(bgPreviewUrl || currentBg) ? <img src={(bgPreviewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}</div>
                <h3 className="text-[11px] font-black uppercase text-[#FF1493] mb-4">Fundo da Roleta (Background)</h3>
                <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2">Escolher Arquivo<input type="file" accept="image/*" onChange={handleBgFileChange} className="hidden" /></label>
                {selectedBgFile && <button onClick={handleSaveBgImage} disabled={uploading} className="w-full bg-[#FF1493] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#FF1493]/20">{uploading ? "Salvando..." : "Salvar Fundo"}</button>}
              </div>
            </div>

            <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
               <h2 className="text-xs font-black uppercase text-white/50 tracking-widest mb-6">Slots da Roleta</h2>
               <div className="grid gap-3">
                {prizes.map((p, index) => {
                  const isFake = checkIsFake(p); 
                  return (
                    <div key={p.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all border ${isFake ? 'bg-indigo-500/5 border-indigo-500/20 opacity-80' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-2">
                        {!isFake && (<div className="flex flex-col gap-1 mr-2"><button onClick={() => movePrize(index, 'up')} className="p-1 rounded-md bg-white/5 hover:bg-[#FF1493] text-white"><ChevronUp size={14}/></button><button onClick={() => movePrize(index, 'down')} className="p-1 rounded-md bg-white/5 hover:bg-[#FF1493] text-white"><ChevronDown size={14}/></button></div>)}
                        <div className="h-6 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <p className={`text-xs font-black uppercase ml-2 ${isFake ? 'text-indigo-400' : 'text-white'}`}>{isFake && <Lock size={12} className="inline mr-1"/>} {p.name}</p>
                      </div>
                      {!isFake && (<button onClick={() => setEditingPrize(p)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-[#FF1493]"><Edit3 size={18}/></button>)}
                    </div>
                  );
                })}
               </div>
            </div>
          </div>
        )}

        {activeTab === "video_requests" && (
          <div className="grid gap-6 animate-in slide-in-from-bottom-4">
              {videoRequests.map((req) => (
                  <div key={req.id} className="bg-black border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative">
                      <div className="flex-1">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-4 inline-block ${req.status === 'pago' ? 'bg-blue-500' : 'bg-amber-500'}`}>{req.status}</span>
                          <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{req.description}"</p>
                      </div>
                      <div className="min-w-[240px] bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-center gap-3">
                          {req.status === 'pago' && (
                              <button onClick={async () => { if(!confirm("Aceitar?")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aceito', accepted_at: new Date().toISOString() }) }); await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: modelBalance + (req.price * 0.7) }) }); loadData(); }} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase text-[10px]">Aceitar e Receber</button>
                          )}
                          {req.status === 'aceito' && <input type="text" placeholder="Link do Drive" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white" onKeyDown={async (e:any) => { if(e.key === 'Enter') { await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ drive_link: e.target.value, status: 'entregue' }) }); loadData(); } }} />}
                          {req.status === 'entregue' && <div className="text-emerald-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2"><CheckCircle size={14}/> Entregue</div>}
                      </div>
                  </div>
              ))}
          </div>
        )}

        {activeTab === "players" && <PlayersManager modelId={modelId} isSuperAdmin={isSuper} />}
        {activeTab === "history" && (
          <div className="grid gap-3">
            {history.map((h, i) => (
              <div key={h.id || i} className={`p-5 rounded-3xl border flex items-center justify-between ${h.delivered ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div><h3 className={`text-sm font-black uppercase ${h.delivered ? 'text-white/30' : 'text-white'}`}>{h.player_name}</h3><p className="text-[9px] font-bold text-[#FFD700] uppercase mt-1">{h.prize_name}</p></div>
                <button onClick={async () => { if (h.delivered) return; await fetch(`${supabaseUrl}/rest/v1/SpinHistory?id=eq.${h.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ delivered: true }) }); loadData(); }} className={`h-12 w-12 rounded-2xl flex items-center justify-center ${h.delivered ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/20'}`}><Check size={20}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDITAR SLOT - COMPLETO COM REGRAS DE ENTREGA */}
      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const payload = { name: editingPrize.name, color: editingPrize.color, delivery_type: editingPrize.delivery_type, delivery_value: editingPrize.delivery_value };
              await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              setEditingPrize(null); loadData();
          }} className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center">Editar Slot</h2>
            <div className="space-y-4 mb-6">
                <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
                <input type="color" value={editingPrize.color} onChange={e => setEditingPrize({...editingPrize, color: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                
                <div className="bg-white/5 p-5 rounded-3xl space-y-4">
                    <p className="text-[10px] font-black uppercase text-[#FFD700]">Regra de Entrega</p>
                    <select value={editingPrize.delivery_type || 'whatsapp'} onChange={e => setEditingPrize({...editingPrize, delivery_type: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white">
                        <option value="whatsapp">Chamar no WhatsApp</option>
                        <option value="link">Link Automático (Drive)</option>
                        <option value="credit">Créditos na Roleta</option>
                    </select>
                    {editingPrize.delivery_type !== 'whatsapp' && (
                        <input type="text" value={editingPrize.delivery_value || ''} onChange={e => setEditingPrize({...editingPrize, delivery_value: e.target.value})} placeholder={editingPrize.delivery_type === 'link' ? "Cole o link aqui" : "Qtd de Créditos"} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />
                    )}
                </div>
            </div>
            <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Salvar</button>
            <button type="button" onClick={() => setEditingPrize(null)} className="w-full text-[9px] font-black text-white/20 mt-4 uppercase text-center">Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() { return <Suspense fallback={null}><DashboardContent /></Suspense>; }
