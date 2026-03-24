"use client";

import React, { useEffect, useState, Suspense, useMemo, Component } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, 
  Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, 
  Loader2, Wallet, Calendar, CheckCircle2, Bell, FileText, Lock, 
  HelpCircle, ChevronUp, ChevronDown, User, Globe, Camera, Video, Send, Trash2, LayoutGrid, CheckCircle, Clock, AlertTriangle, Settings, Eye, EyeOff, X, Upload, Plus, Info, Receipt, Sparkles, Star
} from "lucide-react";
import PlayersManager from "./players";

// 🔥 ESPIÃO LABZ 🔥
class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("ESPIÃO LABZ PEGOU UM ERRO:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#7f1d1d', color: 'white', zIndex: 99999, padding: '24px', overflowY: 'auto', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase' }}>⚠️ O Espião Labz pegou um Erro!</h1>
          <p style={{ marginBottom: '20px', fontSize: '14px' }}>Tire um print dessa tela e mande para o dev:</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '30px', backgroundColor: 'white', color: '#7f1d1d', padding: '16px', borderRadius: '12px', width: '100%', fontWeight: '900', textTransform: 'uppercase' }}>Recarregar Página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [isMounted, setIsMounted] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"finance" | "hub" | "gallery" | "sales" | "video_requests" | "roleta" | "players" | "raspadinha">("finance");
  const [modelData, setModelData] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [videoRequests, setVideoRequests] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]); 
  const [scratchPhotos, setScratchPhotos] = useState<any[]>([]); 

  const [globalAnnouncement, setGlobalAnnouncement] = useState(""); // 🔥 Variável para o comunicado 🔥
  
  const [modelBalance, setModelBalance] = useState<number>(0);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(0);
  const [pixKey1, setPixKey1] = useState("");
  const [pixKey2, setPixKey2] = useState("");
  const [savingPix, setSavingPix] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [modelName, setModelName] = useState("");
  const [currentBg, setCurrentBg] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [editingPrize, setEditingPrize] = useState<any | null>(null);
  const [bio, setBio] = useState("");
  const [savingHub, setSavingHub] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryPreviewUrl, setGalleryPreviewUrl] = useState<string | null>(null);
  const [selectedGalleryFile, setSelectedGalleryFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);
  const [scratchPreviewUrl, setScratchPreviewUrl] = useState<string | null>(null);
  const [selectedScratchFile, setSelectedScratchFile] = useState<File | null>(null);
  const [uploadingScratch, setUploadingScratch] = useState(false);
  const [newMediaCaption, setNewMediaCaption] = useState("");
  const [isPaidMedia, setIsPaidMedia] = useState(false);
  const [rawPrice, setRawPrice] = useState(""); 
  const [showRoletaTutorial, setShowRoletaTutorial] = useState(false); 

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelSlug && typeof window !== 'undefined') setModelUrl(window.location.origin);
  }, [modelSlug]);

  const loadData = async () => {
    if (!modelId) return;
    setDashboardLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      const [resGlob, resModel, resTrans, resPrizes, resConfig, resMedia, resVideos, resSales, resScratch] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }).then(r => r.json()), // 🔥 Carrega o GlobalSettings 🔥
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&select=model_cut`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?select=*,Media(*)`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?model_id=eq.${modelId}&active=eq.true`, { headers }).then(r => r.json()).catch(() => [])
      ]);

      if (resGlob && resGlob[0]) setGlobalAnnouncement(resGlob[0].announcement_msg); // 🔥 Define a mensagem 🔥
      
      if (resModel && resModel[0]) {
        setModelData(resModel[0]); setModelBalance(resModel[0].balance || 0); setPixKey1(resModel[0].pix_key_1 || ""); setPixKey2(resModel[0].pix_key_2 || ""); setBio(resModel[0].bio || "");
      }
      if (resConfig && resConfig[0]) {
        setCurrentBg(resConfig[0].bg_url || null); setCurrentProfile(resConfig[0].profile_url || null); setModelName(resConfig[0].model_name || ""); setShowcaseVisible(resConfig[0].showcase_visible === true);
      }
      setAccumulatedEarnings(Array.isArray(resTrans) ? resTrans.reduce((acc:any, curr:any) => acc + (Number(curr.model_cut) || 0), 0) : 0);
      setPrizes(Array.isArray(resPrizes) ? resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)) : []);
      setMediaList(Array.isArray(resMedia) ? resMedia : []); setVideoRequests(Array.isArray(resVideos) ? resVideos : []); setScratchPhotos(Array.isArray(resScratch) ? resScratch : []);
      const mySales = Array.isArray(resSales) ? resSales.filter((s: any) => s.Media?.model_id === modelId) : [];
      setSalesHistory(mySales.sort((a:any, b:any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()));
    } catch (err) { console.error(err); } finally { setDashboardLoading(false); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  // 🔥 ENTREGA DE VÍDEO + REPASSE DA MADRINHA 🔥
  const handleDeliverVideo = async (reqId: string, price: number, driveLink: string, playerPhone: string) => {
    if (!driveLink || driveLink.length < 5) return;
    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
        await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${reqId}`, { method: "PATCH", headers, body: JSON.stringify({ drive_link: driveLink, status: 'entregue' }) });
        const modelCut = price * 0.70;
        let platformCut = price * 0.30;
        let affiliateCut = 0;
        let madrinhaId = modelData?.referred_by;
        if (madrinhaId) {
            const dataCadastro = new Date(modelData.created_at).getTime();
            const dias = (new Date().getTime() - dataCadastro) / (1000 * 3600 * 24);
            if (dias <= 90) {
                affiliateCut = price * 0.05; platformCut = price * 0.25;
                const mRes = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${madrinhaId}&select=balance`, { headers }).then(r=>r.json());
                if(mRes && mRes[0]) await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${madrinhaId}`, { method: "PATCH", headers, body: JSON.stringify({ balance: (mRes[0].balance || 0) + affiliateCut }) });
            }
        }
        await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers, body: JSON.stringify({ balance: modelBalance + modelCut }) });
        await fetch(`${supabaseUrl}/rest/v1/Transactions`, { method: "POST", headers, body: JSON.stringify({ model_id: modelId, player_phone: playerPhone, real_amount: price, model_cut: modelCut, platform_cut: platformCut, status: 'aprovado' }) });
        loadData(); alert("Vídeo entregue e saldo creditado!");
    } catch(e) { alert("Erro ao entregar."); }
  };

  const handlePriceInput = (e: any) => { setRawPrice(e.target.value.replace(/\D/g, "")); };
  const formattedPrice = useMemo(() => { return (Number(rawPrice) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }, [rawPrice]);

  const handleSavePix = async () => {
    setSavingPix(true); await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 }) }); setSavingPix(false); alert("Chaves PIX salvas!");
  };

  const handleSaveHub = async () => {
    setSavingHub(true); await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bio }) }); setSavingHub(false); alert("Bio atualizada!");
  };

  const handleWithdraw = async () => {
    if (modelBalance < 20) return alert("Mínimo R$ 20");
    setIsWithdrawing(true);
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) });
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) });
    setModelBalance(0); setIsWithdrawing(false); alert("Saque solicitado!");
  };

  const onChooseGalleryFile = (e: any) => {
    const file = e.target.files?.[0];
    if (file) { if (file.size > 10 * 1024 * 1024) return alert("Máximo 10MB!"); setSelectedGalleryFile(file); setGalleryPreviewUrl(URL.createObjectURL(file)); }
  };

  const onPublishPhoto = async () => {
    if (!selectedGalleryFile) return;
    const numericPrice = Number(rawPrice) / 100;
    if (isPaidMedia && numericPrice < 10) return alert("Mínimo R$ 10,00 para fotos pagas.");
    setUploading(true);
    try {
        const fileName = `${modelId}/gal_${Date.now()}.jpg`;
        const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": selectedGalleryFile.type }, body: selectedGalleryFile });
        if (res.ok) {
            const url = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
            await fetch(`${supabaseUrl}/rest/v1/Media`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, url, price: isPaidMedia ? numericPrice : 0, caption: newMediaCaption }) });
            setSelectedGalleryFile(null); setGalleryPreviewUrl(null); setRawPrice(""); setNewMediaCaption(""); setIsPaidMedia(false); loadData(); alert("Publicada!");
        }
    } catch (e) { alert("Erro ao publicar."); } finally { setUploading(false); }
  };

  const onChooseScratchFile = (e: any) => {
      const file = e.target.files?.[0];
      if (file) { if (file.size > 10 * 1024 * 1024) return alert("Máximo 10MB!"); setSelectedScratchFile(file); setScratchPreviewUrl(URL.createObjectURL(file)); }
  };

  const onPublishScratch = async () => {
      if (!selectedScratchFile) return;
      if (scratchPhotos.length >= 10) return alert("Você já atingiu o limite de 10 fotos para a Raspadinha. Apague uma para subir outra.");
      setUploadingScratch(true);
      try {
          const fileName = `${modelId}/scratch_${Date.now()}.jpg`;
          const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": selectedScratchFile.type }, body: selectedScratchFile });
          if (res.ok) {
              const url = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
              await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, photo_url: url, active: true }) });
              setSelectedScratchFile(null); setScratchPreviewUrl(null); loadData(); alert("Foto da Raspadinha adicionada!");
          }
      } catch (e: any) { alert("Erro ao subir foto."); } finally { setUploadingScratch(false); }
  };

  const checkIsFake = (prize: any) => {
    const name = String(prize.name).toUpperCase(); return Number(prize.weight) <= 0.05 || name.includes("PIX") || name.includes("PRESENCIAL") || name.includes("100") || name.includes("R$");
  };

  const movePrize = async (index: number, direction: 'up' | 'down') => {
    const newPrizes = [...prizes]; const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPrizes.length || checkIsFake(newPrizes[index]) || checkIsFake(newPrizes[targetIndex])) return;
    [newPrizes[index], newPrizes[targetIndex]] = [newPrizes[targetIndex], newPrizes[index]];
    let currentWeight = 10; const updates = newPrizes.map(p => { if(!checkIsFake(p)) { p.weight = currentWeight; currentWeight+=10; return {id:p.id, weight:p.weight}; } return null; }).filter(Boolean);
    setPrizes([...newPrizes]);
    await Promise.all(updates.map((u:any) => fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${u.id}`, { method:"PATCH", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":"application/json"}, body:JSON.stringify({weight:u.weight}) })));
  };

  const copyToClipboard = (text: string, type: string) => {
      if(navigator.clipboard) { navigator.clipboard.writeText(text); alert(`Link de ${type} copiado!`); }
      else { alert("O link é: " + text); }
  };

  if (dashboardLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center"><Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Universo...</h2></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => isSuper ? router.push('/admin/super') : (localStorage.clear(), router.push('/admin'))} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all"> {isSuper ? "Voltar Master" : "Sair"} </button>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-black uppercase text-[#FF1493] tracking-tighter">PAINEL VIP</h1>
            <div className="flex items-center gap-2 group cursor-pointer border-b border-transparent hover:border-[#FFD700] transition-all pb-1">
                <Edit3 size={12} className="text-[#FFD700]/50 group-hover:text-[#FFD700]"/>
                <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} onBlur={async () => { await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName }) }); }} className="bg-transparent text-[#FFD700] text-[10px] font-bold uppercase tracking-[0.2em] text-right outline-none w-32" placeholder="SEU NICKNAME" />
            </div>
          </div>
        </div>

        {modelUrl && (
            <div className="mb-8 space-y-3 animate-in fade-in">
                <div className="bg-gradient-to-r from-[#FF1493]/20 to-[#FFD700]/20 border border-[#FFD700]/30 p-4 sm:p-5 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#FFD700]/20 rounded-full shrink-0"><Users size={24} className="text-[#FFD700]"/></div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-white uppercase italic tracking-tighter">Indique Modelos e Ganhe 5%</h3>
                            <p className="text-[9px] sm:text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Copie o link abaixo, mande para amigas e receba 5% de todas as vendas delas por 3 meses!</p>
                        </div>
                    </div>
                    <button onClick={() => copyToClipboard(`${modelUrl}/cadastro?ref=${modelSlug}`, "Indicação de Afiliado")} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black px-6 py-4 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] shrink-0">
                        <LinkIcon size={14} /> Copiar Link de Indicação
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => copyToClipboard(`${modelUrl}/profile/${modelSlug}`, "Vitrine")} className="flex items-center justify-between bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-all group"> <span className="text-[9px] font-black uppercase text-white/50 tracking-widest"><LayoutGrid size={12} className="inline mr-2 text-white/30"/> Link Vitrine</span> <Copy size={14} className="text-[#FF1493]" /> </button>
                    <button onClick={() => copyToClipboard(`${modelUrl}/game/${modelSlug}`, "Roleta")} className="flex items-center justify-between bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-all group"> <span className="text-[9px] font-black uppercase text-white/50 tracking-widest"><Globe size={12} className="inline mr-2 text-white/30"/> Link Roleta</span> <Copy size={14} className="text-[#FF1493]" /> </button>
                    <button onClick={() => copyToClipboard(`${modelUrl}/game/${modelSlug}/raspadinha`, "Raspadinha")} className="flex items-center justify-between bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition-all group"> <span className="text-[9px] font-black uppercase text-white/50 tracking-widest"><Sparkles size={12} className="inline mr-2 text-[#FFD700]/50"/> Link Raspadinha</span> <Copy size={14} className="text-[#FFD700]" /> </button>
                </div>
            </div>
        )}

        {/* 🔥 COMUNICADO GLOBAL VISUAL (BANCO DE DADOS) 🔥 */}
        {globalAnnouncement && (
          <div className="mb-8 bg-[#FF1493]/10 border border-[#FF1493]/30 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Megaphone size={40} className="text-[#FF1493] rotate-12" />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-[#FF1493] rounded-2xl shadow-lg shadow-[#FF1493]/20">
                <Bell size={20} className="text-white animate-ring" />
              </div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-[#FF1493] uppercase tracking-[0.2em] mb-1">Comunicado Oficial Savanah</h3>
                <p className="text-sm font-bold text-white/90 leading-relaxed italic">
                  "{globalAnnouncement}"
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "finance" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Ganhos</button>
          <button onClick={() => setActiveTab("hub")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "hub" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Hub</button>
          <button onClick={() => setActiveTab("gallery")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "gallery" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Galeria</button>
          <button onClick={() => setActiveTab("video_requests")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "video_requests" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Vídeos</button>
          <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "sales" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Vendas</button>
          <button onClick={() => setActiveTab("roleta")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "roleta" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Roleta</button>
          <button onClick={() => setActiveTab("raspadinha")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "raspadinha" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Raspadinha</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "players" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Fãs</button>
        </div>

        {activeTab === "sales" && (
            <div className="animate-in fade-in">
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl mb-8 flex items-start gap-4">
                    <Receipt size={24} className="text-amber-400 shrink-0"/>
                    <p className="text-[10px] font-black uppercase text-amber-400 leading-relaxed">Aqui você acompanha todas as fotos que foram compradas (desbloqueadas) pelos seus clientes através do Hub.</p>
                </div>
                <div className="grid gap-4">
                    {salesHistory.length > 0 ? salesHistory.map((sale) => (
                        <div key={sale.id} className="bg-black border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5"><img src={sale.Media?.url} className="w-full h-full object-cover"/></div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase">{sale.player_phone || "Cliente VIP"}</p>
                                    <p className="text-[9px] text-white/40 italic">{sale.Media?.caption || "Foto VIP"}</p>
                                    <p className="text-[8px] font-bold text-emerald-500 uppercase mt-1">{new Date(sale.unlocked_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Valor</p>
                                <p className="text-lg font-black text-white">R$ {Number(sale.Media?.price || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    )) : <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem]">Nenhum conteúdo vendido ainda.</div>}
                </div>
            </div>
        )}

        {activeTab === "video_requests" && (
            <div className="animate-in fade-in duration-500">
                <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Video size={100}/></div>
                    <h2 className="text-xl font-black uppercase italic mb-4 text-[#FF1493]">Regras de Vídeos VIP</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center"><p className="text-[10px] font-black uppercase text-white/40 mb-1">3 Minutos</p><p className="text-xl font-black text-white">R$ 70,00</p></div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center"><p className="text-[10px] font-black uppercase text-white/40 mb-1">5 Minutos</p><p className="text-xl font-black text-white">R$ 110,00</p></div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center"><p className="text-[10px] font-black uppercase text-white/40 mb-1">10 Minutos</p><p className="text-xl font-black text-white">R$ 160,00</p></div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex items-start gap-3">
                        <Info size={24} className="text-blue-400 shrink-0"/>
                        <p className="text-[10px] font-black uppercase text-blue-400 leading-relaxed">
                            Atenção: Ao aceitar um pedido, você tem 48h úteis para entregar o link do Drive. O valor líquido (70%) do pedido só será creditado no seu saldo APÓS a entrega do link.
                        </p>
                    </div>
                </div>
                <div className="grid gap-6">
                    {videoRequests.length > 0 ? videoRequests.map((req) => (
                        <div key={req.id} className="bg-black border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative overflow-hidden">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${req.status === 'pago' ? 'bg-blue-500' : req.status === 'aceito' ? 'bg-amber-500 text-black' : 'bg-emerald-500'}`}>{req.status === 'pago' ? 'Aguardando Aprovação' : req.status}</span>
                                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{req.duration} Minutos (R$ {req.price})</span>
                                </div>
                                <p className="text-sm italic text-white/80 leading-relaxed font-medium mb-4">"{req.description}"</p>
                                {req.status === 'aceito' && <div className="flex items-center gap-2 text-amber-500 text-[9px] font-black uppercase"><Clock size={14}/> Entrega em até 48h!</div>}
                            </div>
                            <div className="min-w-[240px] bg-white/5 p-6 rounded-3xl flex flex-col justify-center gap-3">
                                {req.status === 'pago' && (
                                    <>
                                    <button onClick={async () => { if(!confirm(`Aceitar pedido?`)) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aceito', accepted_at: new Date().toISOString() }) }); loadData(); }} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase text-[10px]">Aceitar Pedido</button>
                                    <button onClick={async () => { if(!confirm("Recusar pedido?")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'recusado' }) }); loadData(); }} className="w-full bg-red-500/10 text-red-500 py-4 rounded-xl font-black uppercase text-[10px]">Recusar Pedido</button>
                                    </>
                                )}
                                {req.status === 'aceito' && (
                                    <div className="space-y-2">
                                        <input type="text" placeholder="Link do Google Drive" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500" onKeyDown={async (e:any) => { if(e.key === 'Enter') handleDeliverVideo(req.id, req.price, e.target.value, req.player_phone); }} />
                                        <p className="text-[8px] text-white/30 text-center font-black uppercase">Cole o link e aperte Enter</p>
                                    </div>
                                )}
                                {req.status === 'entregue' && <div className="text-emerald-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 bg-emerald-500/5 py-4 rounded-xl border border-emerald-500/10"><CheckCircle size={14}/> Vídeo Entregue</div>}
                            </div>
                        </div>
                    )) : <div className="py-24 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem] animate-pulse">Nenhuma solicitação.</div>}
                </div>
            </div>
        )}

        {activeTab === "finance" && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center">
                        <h2 className="text-xs font-black uppercase mb-2 text-emerald-500 tracking-widest">Saldo Disponível (70%)</h2>
                        <div className="text-5xl font-black mb-8 tracking-tighter">{modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <button onClick={handleWithdraw} disabled={isWithdrawing || modelBalance < 20} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">Solicitar Saque (PIX)</button>
                        
                        <div className="mt-6 space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[9px] text-white/70 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Check size={12} className="text-emerald-500"/> Mínimo R$ 20,00 por saque</p>
                           <p className="text-[9px] text-white/70 font-black uppercase tracking-widest flex items-center justify-center gap-2"><Calendar size={12} className="text-emerald-500"/> Limite de 1 pedido de PIX por dia</p>
                           <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest flex items-center justify-center gap-2"><AlertTriangle size={12}/> Taxa de R$ 1,00 por saque (Regra Banco Central)</p>
                        </div>
                    </div>
                    <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center text-center">
                        <h2 className="text-xs font-black uppercase mb-2 text-[#FFD700] tracking-widest">Total de Ganhos</h2>
                        <div className="text-5xl font-black tracking-tighter">{accumulatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                </div>
                <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h2 className="text-xs font-black uppercase mb-4 text-[#FF1493] flex items-center gap-2"><DollarSign size={16}/> Chaves PIX para Recebimento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input type="text" value={pixKey1} onChange={e => setPixKey1(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none" placeholder="Chave PIX Principal (CPF, Telefone...)" />
                        <input type="text" value={pixKey2} onChange={e => setPixKey2(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none" placeholder="Chave PIX Secundária" />
                    </div>
                    <button onClick={handleSavePix} disabled={savingPix} className="bg-[#FF1493] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">{savingPix ? "Salvando..." : "Salvar Chaves PIX"}</button>
                </div>
            </div>
        )}

        {activeTab === "hub" && (
            <div className="max-w-3xl mx-auto bg-black border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-4">
                <h2 className="text-xl font-black uppercase italic mb-8 text-[#FF1493]">Configurar Hub Público</h2>
                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-white/40 mb-2 block ml-2">Sua Biografia / Frase de Boas-vindas</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-40 resize-none transition-all" placeholder="Escreva algo que atraia seus fãs..."/>
                    <button onClick={handleSaveHub} disabled={savingHub} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg">{savingHub ? <Loader2 className="animate-spin mx-auto"/> : "Salvar Alterações do Hub"}</button>
                </div>
            </div>
        )}

        {activeTab === "raspadinha" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-black border border-white/10 p-8 rounded-[3rem] mb-12 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-[#FFD700]" size={24} />
                        <h2 className="text-2xl font-black uppercase italic text-[#FF1493]">Fotos Raspadinha VIP</h2>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 flex flex-col justify-center">
                            {!scratchPreviewUrl ? (
                                <label className={`w-full bg-white/5 text-white py-8 rounded-3xl cursor-pointer hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-3 font-black uppercase text-[10px] transition-all ${scratchPhotos.length >= 10 ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Upload size={32} className="text-[#FF1493]"/> 
                                    {scratchPhotos.length >= 10 ? "Lote Máximo Atingido (10/10)" : "Escolher Foto (Máx 10MB)"}
                                    <input type="file" hidden accept="image/*" onChange={onChooseScratchFile} disabled={scratchPhotos.length >= 10} />
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative aspect-[3/4] max-w-xs mx-auto rounded-3xl overflow-hidden border-2 border-[#FFD700] shadow-xl">
                                        <img src={scratchPreviewUrl} className="w-full h-full object-cover" />
                                        <button onClick={() => { setSelectedScratchFile(null); setScratchPreviewUrl(null); }} className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 hover:bg-red-500 transition-colors"><X size={20}/></button>
                                    </div>
                                    <button onClick={onPublishScratch} disabled={uploadingScratch} className="w-full bg-gradient-to-r from-[#FF1493] to-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all max-w-xs mx-auto">
                                        {uploadingScratch ? <div className="flex items-center gap-2"><Loader2 className="animate-spin"/> Subindo...</div> : "Salvar Foto na Coleção"}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                            <h3 className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest mb-2">Progresso do Lote</h3>
                            <div className="text-5xl font-black italic tracking-tighter mb-4">{scratchPhotos.length}<span className="text-xl text-white/30">/10</span></div>
                            <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-[#FF1493] to-[#FFD700]" style={{ width: `${(scratchPhotos.length / 10) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {scratchPhotos.length > 0 ? scratchPhotos.map((item) => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                            <img src={item.photo_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={async () => { if(confirm("Apagar foto?")) { await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-4 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg"><Trash2 size={24}/></button>
                            </div>
                            <div className="absolute top-4 left-4"><Star size={16} fill="#FFD700" className="text-[#FFD700] drop-shadow-md" /></div>
                        </div>
                    )) : <div className="col-span-full py-20 text-center text-white/20 italic font-black uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem]">Vazio.</div>}
                </div>
            </div>
        )}

        {activeTab === "gallery" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-black border border-white/10 p-8 rounded-[3rem] mb-12 shadow-2xl">
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-[#FF1493] ml-2">Legenda da Foto</label>
                            <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-32 resize-none" placeholder="O que tem na foto? 🔥"/>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-[9px] text-white/40 uppercase font-black">⚠️ REGRAS: Nudez somente em PAGO (Mín R$ 10). Grátis sem nudez.</div>
                        </div>
                        <div className="flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <input type="checkbox" checked={isPaidMedia} onChange={(e) => setIsPaidMedia(e.target.checked)} className="w-5 h-5 accent-[#FF1493]" />
                                    <span className="text-[10px] font-black uppercase">Conteúdo Pago (Com Blur)</span>
                                </div>
                                {isPaidMedia && (
                                    <div className="animate-in zoom-in duration-300">
                                        <label className="text-[10px] font-black text-white/40 mb-2 block ml-2">Definir Valor (Mín. R$ 10,00)</label>
                                        <input type="text" value={formattedPrice} onChange={handlePriceInput} className="w-full bg-black border border-[#FF1493] rounded-full py-5 px-8 text-white font-black text-2xl text-center outline-none" />
                                    </div>
                                )}
                            </div>
                            {!galleryPreviewUrl ? (
                                <label className="w-full bg-white/5 text-white py-6 rounded-2xl cursor-pointer hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3 font-black uppercase text-[10px] mt-6 transition-all">
                                    <Upload size={20}/> Escolher Arquivo (Máx 10MB)
                                    <input type="file" className="hidden" accept="image/*" onChange={onChooseGalleryFile} />
                                </label>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[#FF1493] shadow-lg">
                                        <img src={galleryPreviewUrl} className="w-full h-full object-cover" />
                                        <button onClick={() => { setSelectedGalleryFile(null); setGalleryPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><X size={16}/></button>
                                    </div>
                                    <button onClick={onPublishPhoto} disabled={uploading} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                        {uploading ? <div className="flex flex-col items-center gap-1"><Loader2 className="animate-spin"/><span className="text-[8px] uppercase font-black mt-1">Carregando...</span></div> : <><Camera size={20}/> Publicar Agora na Galeria</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mediaList.map((item) => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                            <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={async () => { if(confirm("Apagar foto?")) { await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-4 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg"><Trash2 size={24}/></button>
                            </div>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#FF1493]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price.toFixed(2)}`}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "roleta" && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                    <div><h3 className="text-[11px] font-black uppercase text-[#FFD700]">Visibilidade na Vitrine</h3></div>
                    <button onClick={async () => { const n = !showcaseVisible; setShowcaseVisible(n); await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ showcase_visible: n }) }); }} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${showcaseVisible ? 'bg-[#FF1493]' : 'bg-white/20'}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${showcaseVisible ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-32 h-32 mb-4 bg-black/50 border border-white/10 rounded-full overflow-hidden flex items-center justify-center relative">
                            {(profilePreviewUrl || currentProfile) ? <img src={(profilePreviewUrl || currentProfile) as string} className="w-full h-full object-cover" /> : <User className="text-white/10" size={40} />}
                            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                        </div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Foto Vitrine<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files?.[0]; if(f) { setSelectedProfileFile(f); setProfilePreviewUrl(URL.createObjectURL(f)); } }} className="hidden" /></label>
                        {selectedProfileFile && <button onClick={async () => { setUploading(true); const fn=`profile_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedProfileFile.type}, body:selectedProfileFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ profile_url: url }) }); setCurrentProfile(url); setSelectedProfileFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FFD700] text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Foto Vitrine</button>}
                    </div>
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-full h-32 mb-4 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative">
                            {(bgPreviewUrl || currentBg) ? <img src={(bgPreviewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}
                            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                        </div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Fundo Roleta<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files?.[0]; if(f) { setSelectedBgFile(f); setBgPreviewUrl(URL.createObjectURL(f)); } }} className="hidden" /></label>
                        {selectedBgFile && <button onClick={async () => { setUploading(true); const fn=`bg_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedBgFile.type}, body:selectedBgFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: url }) }); setCurrentBg(url); setSelectedBgFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FF1493] text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Fundo Roleta</button>}
                    </div>
                </div>
                <div className="bg-black border border-white/10 p-8 rounded-[3rem] shadow-2xl relative">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-black uppercase text-white/50 tracking-widest">Slots da Roleta</h2>
                        <button onClick={() => setShowRoletaTutorial(true)} className="p-3 bg-[#FF1493]/10 text-[#FF1493] rounded-full border border-[#FF1493]/30 hover:bg-[#FF1493] hover:text-white transition-all shadow-lg animate-bounce"><HelpCircle size={20}/></button>
                    </div>
                    <div className="grid gap-3">
                        {prizes.map((p, index) => {
                            const isFake = checkIsFake(p);
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all border ${isFake ? 'bg-indigo-500/5 border-indigo-500/20 opacity-80' : 'bg-white/5 border-white/10 hover:border-[#FF1493]/30'}`}>
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={async (e) => { 
              e.preventDefault(); 
              await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrize.name, color: editingPrize.color, delivery_type: editingPrize.delivery_type, delivery_value: editingPrize.delivery_value }) });
              setEditingPrize(null); loadData();
          }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative">
            <button type="button" onClick={() => setEditingPrize(null)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={24}/></button>
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center">Editar Slot</h2>
            <div className="space-y-4">
                <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" />
                <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase text-white/40">Entrega do Conteúdo</p>
                    <select value={editingPrize.delivery_type || 'whatsapp'} onChange={e => setEditingPrize({...editingPrize, delivery_type: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none">
                        <option value="whatsapp">Chamar no WhatsApp</option>
                        <option value="link">Link Direto (Drive)</option>
                        <option value="credit">Créditos de Giro</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {showRoletaTutorial && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#FF1493]/30 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative">
              <button onClick={() => setShowRoletaTutorial(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20} /></button>
              <h2 className="text-xl font-black uppercase italic mb-6 text-[#FF1493] flex items-center gap-2"><HelpCircle size={20}/> Guia da Roleta Lucrativa</h2>
              <div className="space-y-5 text-sm text-white/80 leading-relaxed font-medium">
                  <p><strong className="text-[#FFD700] uppercase text-[10px]">1. Topo da Lista:</strong> Prêmios comuns que saem mais vezes.</p>
                  <p><strong className="text-[#FF1493] uppercase text-[10px]">2. Final da Lista:</strong> Prêmios VIP raros. Quanto mais baixo, mais difícil.</p>
                  <p><strong className="text-indigo-400 uppercase text-[10px] flex items-center gap-1"><Lock size={12}/> 3. Itens Bloqueados:</strong> Iscas visuais impossíveis de ganhar, travadas pela Labz.</p>
              </div>
              <button onClick={() => setShowRoletaTutorial(false)} className="mt-8 bg-white/10 text-white w-full py-4 rounded-xl font-black uppercase text-[10px] hover:bg-white/20 transition-all">Entendi, Fechar</button>
            </div>
          </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        
        /* 🔥 Animação do Sino 🔥 */
        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-ring { animation: ring 2s ease infinite; }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
