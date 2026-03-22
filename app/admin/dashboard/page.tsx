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

  const [activeTab, setActiveTab] = useState<"finance" | "hub" | "gallery" | "video_requests" | "prizes" | "players" | "history">("finance");
  
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

      if (resGlob[0]) { setGlobalAnnouncement(resGlob[0].announcement_msg); setShowRankTab(resGlob[0].ranking_visible === true); setMetaValue(resGlob[0].goal_amount); setMetaPrize(resGlob[0].goal_reward); }
      if (resModel[0]) { setModelBalance(resModel[0].balance || 0); setLastWithdrawal(resModel[0].last_withdrawal); setPixKey1(resModel[0].pix_key_1 || ""); setPixKey2(resModel[0].pix_key_2 || ""); setTermsAccepted(resModel[0].terms_accepted === true); setBio(resModel[0].bio || ""); }
      setAccumulatedEarnings(resTrans.reduce((acc:any, curr:any) => acc + (Number(curr.model_cut) || 0), 0));
      setPrizes(resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)));
      setNotifications(resNotif); setHistory(resMyHist); setRankHistory(resRankHist); setAllModels(resAllMod); setMediaList(resMedia); setVideoRequests(resVideos);
      if (resConfig[0]) { setCurrentBg(resConfig[0].bg_url); setCurrentProfile(resConfig[0].profile_url); setModelName(resConfig[0].model_name || ""); setShowcaseVisible(resConfig[0].showcase_visible === true); }
    } catch (err) { console.error(err); } finally { setDashboardLoading(false); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  // --- HANDLERS ---
  const handleSavePix = async () => {
    setSavingPix(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 }) });
    setSavingPix(false); alert("Salvo!");
  };

  const handleSaveHub = async () => {
    setSavingHub(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bio }) });
    setSavingHub(false); alert("Hub Atualizado!");
  };

  const handleUploadPhoto = async (e: any) => {
    const file = e.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) return alert("Arquivo maior que 10MB!");
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

  const handleWithdraw = async () => {
    if (modelBalance < 20) return alert("Mínimo R$ 20");
    setIsWithdrawing(true);
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) });
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) });
    setModelBalance(0); setIsWithdrawing(false); alert("Solicitado!");
  };

  const checkIsFake = (prize: any) => {
    const name = String(prize.name).toUpperCase();
    return Number(prize.weight) <= 0.05 || name.includes("PIX") || name.includes("PRESENCIAL") || name.includes("100") || name.includes("R$");
  };

  const movePrize = async (index: number, direction: 'up' | 'down') => {
    const newPrizes = [...prizes]; const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPrizes.length || checkIsFake(newPrizes[index]) || checkIsFake(newPrizes[targetIndex])) return;
    [newPrizes[index], newPrizes[targetIndex]] = [newPrizes[targetIndex], newPrizes[index]];
    let currentWeight = 10;
    const updates = newPrizes.map(p => { if(!checkIsFake(p)) { p.weight = currentWeight; currentWeight+=10; return {id:p.id, weight:p.weight}; } return null; }).filter(Boolean);
    setPrizes([...newPrizes]);
    await Promise.all(updates.map((u:any) => fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${u.id}`, { method:"PATCH", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":"application/json"}, body:JSON.stringify({weight:u.weight}) })));
  };

  if (dashboardLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center"><Loader2 className="animate-spin text-[#FF1493] mb-6" size={50}/><h2 className="text-xl font-black uppercase italic animate-pulse">Seu novo universo está sendo carregado...</h2></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => isSuper ? router.push('/admin/super') : (localStorage.clear(), router.push('/admin'))} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 bg-white/5 px-4 py-2 rounded-xl">{isSuper ? "Voltar Master" : "Sair"}</button>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-black uppercase text-[#FF1493]">Painel VIP</h1>
            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} onBlur={async () => { await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName }) }); }} className="bg-transparent text-[#FFD700] text-[9px] font-bold uppercase text-right outline-none w-full" />
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "finance" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-white/30"}`}>Ganhos</button>
          <button onClick={() => setActiveTab("hub")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "hub" ? "bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30" : "text-white/30"}`}>Hub</button>
          <button onClick={() => setActiveTab("gallery")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "gallery" ? "bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30" : "text-white/30"}`}>Galeria</button>
          <button onClick={() => setActiveTab("video_requests")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "video_requests" ? "bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30" : "text-white/30"}`}>Vídeos</button>
          <button onClick={() => setActiveTab("prizes")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "prizes" ? "bg-white/10 text-white" : "text-white/30"}`}>Roleta</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "players" ? "bg-white/10 text-white" : "text-white/30"}`}>Fãs</button>
        </div>

        {/* --- CONTEÚDO DAS ABAS --- */}

        {activeTab === "finance" && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <h2 className="text-xs font-black uppercase mb-2 text-emerald-500">Saldo Disponível</h2>
                        <div className="text-5xl font-black mb-8">{modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <button onClick={handleWithdraw} disabled={isWithdrawing || modelBalance < 20} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all">Solicitar Saque (PIX)</button>
                    </div>
                    <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
                        <h2 className="text-xs font-black uppercase mb-2 text-[#FFD700]">Lucro Acumulado</h2>
                        <div className="text-5xl font-black">{accumulatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
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

        {activeTab === "hub" && (
            <div className="max-w-3xl mx-auto bg-black border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-4">
                <h2 className="text-xl font-black uppercase italic mb-8 text-[#FF1493]">Editar Hub Público</h2>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-40 resize-none mb-6" placeholder="Sua frase de impacto..."/>
                <button onClick={handleSaveHub} disabled={savingHub} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg">{savingHub ? "Salvando..." : "Salvar Hub"}</button>
            </div>
        )}

        {activeTab === "gallery" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-black border border-white/10 p-10 rounded-[3rem] mb-12 shadow-2xl grid md:grid-cols-2 gap-10">
                    <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-32" placeholder="Legenda da foto... 🔥"/>
                    <div className="flex flex-col justify-between">
                        <input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-white font-black text-2xl mb-4" placeholder="Preço (0=Grátis)"/>
                        <label className="w-full bg-[#FF1493] text-white py-6 rounded-2xl cursor-pointer hover:scale-[1.02] flex items-center justify-center gap-3 font-black uppercase text-[10px] shadow-xl">
                            {uploading ? <Loader2 className="animate-spin" size={18}/> : "Publicar Foto"}
                            <input type="file" hidden accept="image/*" onChange={handleUploadPhoto} disabled={uploading}/>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mediaList.map((item) => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                            <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all"/>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <button onClick={async () => { if(confirm("Deletar?")) { await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-3 bg-red-500 rounded-full"><Trash2 size={20}/></button>
                            </div>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#FF1493]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price}`}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "video_requests" && (
            <div className="grid gap-6 animate-in slide-in-from-bottom-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl mb-4"><p className="text-[10px] font-black uppercase text-blue-400">Regras: Aceitar o vídeo credita 70% do valor no seu saldo na hora. Você tem 2 dias para entregar o link do Drive.</p></div>
                {videoRequests.length > 0 ? videoRequests.map((req) => (
                    <div key={req.id} className="bg-black border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative overflow-hidden">
                        <div className="flex-1">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-4 inline-block ${req.status === 'pago' ? 'bg-blue-500 text-white' : req.status === 'aceito' ? 'bg-amber-500 text-black' : 'bg-emerald-500'}`}>{req.status === 'pago' ? 'Aguardando sua Aprovação' : req.status}</span>
                            <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{req.description}"</p>
                            <p className="text-[10px] text-[#FFD700] font-black mt-2 uppercase">{req.duration} MINUTOS - R$ {req.price}</p>
                        </div>
                        <div className="min-w-[240px] bg-white/5 p-6 rounded-3xl flex flex-col justify-center gap-3">
                            {req.status === 'pago' && (
                                <>
                                <button onClick={async () => { if(!confirm("Aceitar?")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aceito', accepted_at: new Date().toISOString() }) }); await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: modelBalance + (req.price * 0.7) }) }); loadData(); }} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase text-[10px]">Aceitar e Receber R$ {(req.price * 0.7).toFixed(2)}</button>
                                <button onClick={async () => { if(!confirm("Recusar?")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'recusado' }) }); loadData(); }} className="w-full bg-red-500/10 text-red-500 py-4 rounded-xl font-black uppercase text-[10px]">Recusar</button>
                                </>
                            )}
                            {req.status === 'aceito' && (
                                <div className="space-y-2">
                                    <input type="text" placeholder="Link do Drive/Mega" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white" onKeyDown={async (e:any) => { if(e.key === 'Enter') { await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ drive_link: e.target.value, status: 'entregue' }) }); loadData(); } }} />
                                    <p className="text-[8px] text-white/30 text-center font-black">Link e Aperte Enter</p>
                                </div>
                            )}
                            {req.status === 'entregue' && <div className="text-emerald-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2"><CheckCircle size={14}/> Entregue</div>}
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/10 italic">Nenhum pedido recebido.</div>}
            </div>
        )}

        {activeTab === "prizes" && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                    <div><h3 className="text-[11px] font-black uppercase text-[#FFD700]">Exibir na Vitrine</h3></div>
                    <button onClick={async () => { const n = !showcaseVisible; setShowcaseVisible(n); await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ showcase_visible: n }) }); }} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${showcaseVisible ? 'bg-[#FF1493]' : 'bg-white/20'}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${showcaseVisible ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-32 h-32 mb-4 bg-black/50 border border-white/10 rounded-full overflow-hidden flex items-center justify-center">{(profilePreviewUrl || currentProfile) ? <img src={(profilePreviewUrl || currentProfile) as string} className="w-full h-full object-cover" /> : <User className="text-white/10" size={40} />}</div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2">Escolher Foto Vitrine<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files[0]; setSelectedProfileFile(f); setProfilePreviewUrl(URL.createObjectURL(f)); }} className="hidden" /></label>
                        {selectedProfileFile && <button onClick={async () => { setUploading(true); const fn=`profile_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedProfileFile.type}, body:selectedProfileFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ profile_url: url }) }); setCurrentProfile(url); setSelectedProfileFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FFD700] text-black py-3 rounded-xl text-[10px] font-black uppercase">Salvar Foto Vitrine</button>}
                    </div>
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-full h-32 mb-4 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">{(bgPreviewUrl || currentBg) ? <img src={(bgPreviewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}</div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2">Escolher Fundo Roleta<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files[0]; setSelectedBgFile(f); setBgPreviewUrl(URL.createObjectURL(f)); }} className="hidden" /></label>
                        {selectedBgFile && <button onClick={async () => { setUploading(true); const fn=`bg_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedBgFile.type}, body:selectedBgFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: url }) }); setCurrentBg(url); setSelectedBgFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FF1493] text-white py-3 rounded-xl text-[10px] font-black uppercase">Salvar Fundo Roleta</button>}
                    </div>
                </div>
                <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h2 className="text-xs font-black uppercase text-white/50 tracking-widest mb-6">Slots da Roleta</h2>
                    <div className="grid gap-3">
                        {prizes.map((p, index) => {
                            const isFake = checkIsFake(p);
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all border ${isFake ? 'bg-indigo-500/5 border-indigo-500/20 opacity-80' : 'bg-black/40 border-white/5 hover:border-[#FF1493]/30'}`}>
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

        {activeTab === "players" && <PlayersManager modelId={modelId} isSuperAdmin={isSuper} />}
      </div>

      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={async (e) => { e.preventDefault(); await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrize.name, color: editingPrize.color, delivery_type: editingPrize.delivery_type, delivery_value: editingPrize.delivery_value }) }); setEditingPrize(null); loadData(); }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center">Editar Slot</h2>
            <div className="space-y-4">
                <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white" />
                <input type="color" value={editingPrize.color} onChange={e => setEditingPrize({...editingPrize, color: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase text-white/40">Entrega do Conteúdo</p>
                    <select value={editingPrize.delivery_type || 'whatsapp'} onChange={e => setEditingPrize({...editingPrize, delivery_type: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white"><option value="whatsapp">Chamar no WhatsApp</option><option value="link">Link Direto (Drive)</option><option value="credit">Créditos de Giro</option></select>
                    {editingPrize.delivery_type !== 'whatsapp' && <input type="text" value={editingPrize.delivery_value || ''} onChange={e => setEditingPrize({...editingPrize, delivery_value: e.target.value})} placeholder="Link ou Qtd Créditos" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />}
                </div>
                <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase">Salvar Slot</button>
                <button type="button" onClick={() => setEditingPrize(null)} className="w-full text-[9px] font-black text-white/20 mt-2 uppercase text-center">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() { return <Suspense fallback={null}><DashboardContent /></Suspense>; }
