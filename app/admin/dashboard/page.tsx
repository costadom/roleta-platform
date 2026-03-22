"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Image as ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, 
  Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, 
  Loader2, Wallet, Calendar, CheckCircle2, Bell, FileText, Lock, 
  HelpCircle, ChevronUp, ChevronDown, User, Globe, Camera, Video, Send, Trash2, LayoutGrid, CheckCircle, Clock, AlertTriangle, Settings, Eye, EyeOff, X, Upload, Plus
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
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"finance" | "hub" | "gallery" | "video_requests" | "roleta" | "players">("finance");

  // Dados do Banco
  const [modelData, setModelData] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [videoRequests, setVideoRequests] = useState<any[]>([]);

  // Notificações e Termos
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Estados Financeiros
  const [modelBalance, setModelBalance] = useState<number>(0);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(0);
  const [pixKey1, setPixKey1] = useState("");
  const [pixKey2, setPixKey2] = useState("");
  const [savingPix, setSavingPix] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Estados Roleta & Perfil
  const [modelName, setModelName] = useState("");
  const [currentBg, setCurrentBg] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [editingPrize, setEditingPrize] = useState<any | null>(null);
  const [bio, setBio] = useState("");
  const [savingHub, setSavingHub] = useState(false);

  // Estados de Upload (Desunificados)
  const [uploading, setUploading] = useState(false);
  const [galleryPreviewUrl, setGalleryPreviewUrl] = useState<string | null>(null);
  const [selectedGalleryFile, setSelectedGalleryFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);

  // Galeria
  const [newMediaCaption, setNewMediaCaption] = useState("");
  const [isPaidMedia, setIsPaidMedia] = useState(false);
  const [rawPrice, setRawPrice] = useState(""); // Máscara

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    // O link agora manda direto pro Hub da modelo (que tem as fotos e o botão da roleta)
    if (modelSlug) {
        setModelUrl(`${window.location.origin}/profile/${modelSlug}`);
    }
  }, [modelSlug]);

  const loadData = async () => {
    if (!modelId) return;
    setDashboardLoading(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const [resGlob, resModel, resNotif, resTrans, resPrizes, resConfig, resMedia, resVideos, resHistory] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Withdrawals?model_id=eq.${modelId}&status=eq.pago&is_read=eq.false`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&select=model_cut`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`, { headers }).then(r => r.json()),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${modelId}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/SpinHistory?model_id=eq.${modelId}&order=created_at.desc&limit=50`, { headers }).then(r => r.json())
      ]);

      if (resGlob[0]) {
        setGlobalAnnouncement(resGlob[0].announcement_msg);
      }
      if (resModel[0]) {
        setModelData(resModel[0]);
        setModelBalance(resModel[0].balance || 0);
        setPixKey1(resModel[0].pix_key_1 || "");
        setPixKey2(resModel[0].pix_key_2 || "");
        setTermsAccepted(resModel[0].terms_accepted === true);
        setBio(resModel[0].bio || "");
      }
      if (resConfig[0]) {
        setCurrentBg(resConfig[0].bg_url);
        setCurrentProfile(resConfig[0].profile_url);
        setModelName(resConfig[0].model_name || "");
        setShowcaseVisible(resConfig[0].showcase_visible === true);
      }
      setAccumulatedEarnings(resTrans.reduce((acc:any, curr:any) => acc + (Number(curr.model_cut) || 0), 0));
      setPrizes(resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)));
      setNotifications(resNotif || []);
      setMediaList(resMedia || []);
      setVideoRequests(resVideos || []);
      setHistory(resHistory || []);
    } catch (err) { console.error(err); } finally { setDashboardLoading(false); }
  };

  useEffect(() => { loadData(); }, [modelId]);

  // --- MÁSCARA FINANCEIRA R$ ---
  const handlePriceInput = (e: any) => { setRawPrice(e.target.value.replace(/\D/g, "")); };
  const formattedPrice = useMemo(() => {
    return (Number(rawPrice) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }, [rawPrice]);

  // --- HANDLERS FINANCEIRO & PERFIL ---
  const handleSavePix = async () => {
    setSavingPix(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 }) });
    setSavingPix(false); alert("Chaves PIX salvas!");
  };

  const handleSaveHub = async () => {
    setSavingHub(true);
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bio }) });
    setSavingHub(false); alert("Bio atualizada!");
  };

  const handleWithdraw = async () => {
    if (modelBalance < 20) return alert("Mínimo R$ 20");
    setIsWithdrawing(true);
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) });
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) });
    setModelBalance(0); setIsWithdrawing(false); alert("Saque solicitado!");
  };

  // --- GALERIA (DESUNIFICADO) ---
  const onChooseGalleryFile = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return alert("Máximo 10MB!");
      setSelectedGalleryFile(file);
      setGalleryPreviewUrl(URL.createObjectURL(file));
    }
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

  // --- ROLETA ---
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

  if (dashboardLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center">
      <Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Seu novo universo está sendo carregado...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER COM NICKNAME EDITÁVEL */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => isSuper ? router.push('/admin/super') : (localStorage.clear(), router.push('/admin'))} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all">
             {isSuper ? "Voltar Master" : "Sair"}
          </button>
          <div className="text-right flex flex-col items-end">
            <h1 className="text-2xl font-black uppercase text-[#FF1493] tracking-tighter">PAINEL VIP</h1>
            <div className="flex items-center gap-2 group cursor-pointer">
                <Edit3 size={10} className="text-white/20 group-hover:text-[#FFD700]"/>
                <input 
                  type="text" 
                  value={modelName} 
                  onChange={(e) => setModelName(e.target.value)} 
                  onBlur={async () => { await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_name: modelName }) }); }} 
                  className="bg-transparent text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] text-right outline-none border-b border-transparent focus:border-[#FFD700] w-full" 
                />
            </div>
          </div>
        </div>

        {/* --- CENTRAL DE AVISOS E LINKS (RESTAURADA) --- */}
        <div className="mb-8 space-y-4">
            {/* NOTIFICAÇÃO DE SAQUE PAGO */}
            {notifications.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)] gap-4 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-12 w-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)]"><CheckCircle2 size={24}/></div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-emerald-500">PIX NA CONTA! 💸</h2>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Seu último saque foi pago com sucesso.</p>
                  </div>
                </div>
                <button onClick={async () => {
                  await Promise.all(notifications.map(n => fetch(`${supabaseUrl}/rest/v1/Withdrawals?id=eq.${n.id}`, { method: 'PATCH', headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true }) })));
                  setNotifications([]);
                }} className="w-full sm:w-auto bg-emerald-500 text-black text-[10px] font-black uppercase px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all shrink-0 hover:scale-[1.02]">Ok, Entendi!</button>
              </div>
            )}

            {/* AVISO GLOBAL (MASTER) */}
            {globalAnnouncement && (
              <div className="bg-[#FF1493]/10 border border-[#FF1493]/20 p-4 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-[#FF1493] text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#FF1493]/20"><Megaphone size={20}/></div>
                <p className="text-[11px] font-black uppercase text-[#FF1493] leading-relaxed">{globalAnnouncement}</p>
              </div>
            )}

            {/* LINK DE DIVULGAÇÃO */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-4 shadow-xl">
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 bg-[#FFD700] text-black rounded-2xl shadow-[0_0_15px_rgba(255,215,0,0.3)] shrink-0"><LinkIcon size={20}/></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Seu Link de Divulgação VIP</p>
                  <p className="text-xs sm:text-sm font-bold text-white lowercase tracking-tight truncate w-full">{isMounted ? modelUrl : "..."}</p>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(modelUrl); alert("Link copiado! Mande para seus fãs."); }} className="w-full sm:w-auto px-6 py-3 bg-[#FFD700] text-black rounded-xl text-[10px] font-black uppercase hover:bg-yellow-400 transition-all shrink-0">
                Copiar Link
              </button>
            </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "finance" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-white/30 hover:bg-white/5"}`}>Ganhos</button>
          <button onClick={() => setActiveTab("hub")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "hub" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Hub</button>
          <button onClick={() => setActiveTab("gallery")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "gallery" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Galeria</button>
          <button onClick={() => setActiveTab("video_requests")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "video_requests" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Vídeos</button>
          <button onClick={() => setActiveTab("roleta")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "roleta" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Roleta</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "players" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Fãs</button>
        </div>

        {/* --- ABA GANHOS --- */}
        {activeTab === "finance" && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center">
                        <h2 className="text-xs font-black uppercase mb-2 text-emerald-500 tracking-widest">Saldo Disponível (70%)</h2>
                        <div className="text-5xl font-black mb-8 tracking-tighter">{modelBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <button onClick={handleWithdraw} disabled={isWithdrawing || modelBalance < 20} className="w-full bg-emerald-500 text-black py-5 rounded-2xl text-xs font-black uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">Solicitar Saque (PIX)</button>
                    </div>
                    <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center text-center">
                        <h2 className="text-xs font-black uppercase mb-2 text-[#FFD700] tracking-widest">Total de Ganhos</h2>
                        <div className="text-5xl font-black tracking-tighter">{accumulatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                </div>
                <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h2 className="text-xs font-black uppercase mb-4 text-[#FF1493] flex items-center gap-2"><DollarSign size={16}/> Chaves PIX para Recebimento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input type="text" value={pixKey1} onChange={e => setPixKey1(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none" placeholder="Chave PIX Principal" />
                        <input type="text" value={pixKey2} onChange={e => setPixKey2(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white outline-none" placeholder="Chave PIX Secundária" />
                    </div>
                    <button onClick={handleSavePix} disabled={savingPix} className="bg-[#FF1493] text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">{savingPix ? "Salvando..." : "Salvar Chaves PIX"}</button>
                </div>
            </div>
        )}

        {/* --- ABA HUB --- */}
        {activeTab === "hub" && (
            <div className="max-w-3xl mx-auto bg-black border border-white/10 p-10 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-4">
                <h2 className="text-xl font-black uppercase italic mb-8 text-[#FF1493]">Configurar Hub Público</h2>
                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-white/40 mb-2 block ml-2">Sua Biografia / Frase de Boas-vindas</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-48 resize-none mb-6" placeholder="Escreva algo que atraia seus fãs..."/>
                    <button onClick={handleSaveHub} disabled={savingHub} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg">{savingHub ? <Loader2 className="animate-spin mx-auto"/> : "Salvar Alterações do Hub"}</button>
                </div>
            </div>
        )}

        {/* --- ABA GALERIA --- */}
        {activeTab === "gallery" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-black border border-white/10 p-10 rounded-[3rem] mb-12 shadow-2xl">
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-[#FF1493] ml-2">Legenda da Foto</label>
                            <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none h-32" placeholder="O que tem na foto? 🔥"/>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-[9px] text-white/40 uppercase font-black">⚠️ Regras: Nudez somente na categoria PAGA (Mín. R$ 10). Fotos gratuitas não podem conter nudez explícita.</div>
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
                                    <input type="file" hidden accept="image/*" onChange={onChooseGalleryFile} />
                                </label>
                            ) : (
                                <div className="mt-6 space-y-3">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[#FF1493] shadow-lg">
                                        <img src={galleryPreviewUrl} className="w-full h-full object-cover" />
                                        <button onClick={() => { setSelectedGalleryFile(null); setGalleryPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><X size={16}/></button>
                                    </div>
                                    <button onClick={onPublishPhoto} disabled={uploading} className="w-full bg-[#FF1493] text-white py-6 rounded-2xl font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                        {uploading ? <div className="flex flex-col items-center gap-1"><Loader2 className="animate-spin"/><span className="text-[8px]">Carregando Arquivo...</span></div> : <><Camera size={20}/> Publicar Agora na Galeria</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <h3 className="text-xs font-black uppercase text-white/30 mb-6 ml-4">Fotos Publicadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mediaList.map((item) => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                            <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all"/>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                <button onClick={async () => { if(confirm("Apagar esta foto permanentemente?")) { await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-3 bg-red-500 rounded-full"><Trash2 size={20}/></button>
                            </div>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#FF1493]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price}`}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- ABA VÍDEOS --- */}
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
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                        <Info size={18} className="text-blue-400 shrink-0"/>
                        <p className="text-[10px] font-black uppercase text-blue-400 leading-relaxed">
                            Ao aceitar um vídeo, o valor líquido (70%) será creditado no seu saldo NA HORA. Você terá o prazo de 48h úteis para entregar o link do Drive. Se não entregar, seu saldo poderá ficar negativo e sua conta bloqueada.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {videoRequests.length > 0 ? videoRequests.map((req) => (
                        <div key={req.id} className="bg-black border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative overflow-hidden">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${req.status === 'pago' ? 'bg-blue-500' : req.status === 'aceito' ? 'bg-amber-500 text-black' : 'bg-emerald-500'}`}>{req.status === 'pago' ? 'Aguardando sua Aprovação' : req.status}</span>
                                    <span className="text-[10px] text-white/30 font-bold uppercase">{req.duration} Minutos (R$ {req.price})</span>
                                </div>
                                <p className="text-sm italic text-white/80 leading-relaxed font-medium mb-4">"{req.description}"</p>
                                {req.status === 'aceito' && <div className="flex items-center gap-2 text-amber-500 text-[9px] font-black uppercase"><Clock size={14}/> Entrega em até 48h!</div>}
                            </div>
                            <div className="min-w-[240px] bg-white/5 p-6 rounded-3xl flex flex-col justify-center gap-3">
                                {req.status === 'pago' && (
                                    <>
                                    <button onClick={async () => { if(!confirm("Aceitar? O valor (70%) cai na hora!")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'aceito', accepted_at: new Date().toISOString() }) }); await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: modelBalance + (req.price * 0.7) }) }); loadData(); }} className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/10">Aceitar Pedido</button>
                                    <button onClick={async () => { if(!confirm("Recusar?")) return; await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: 'recusado' }) }); loadData(); }} className="w-full bg-red-500/10 text-red-500 py-4 rounded-xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all">Recusar</button>
                                    </>
                                )}
                                {req.status === 'aceito' && (
                                    <div className="space-y-2">
                                        <input type="text" placeholder="Link do Drive + Enter" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-emerald-500" onKeyDown={async (e:any) => { if(e.key === 'Enter') { await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ drive_link: e.target.value, status: 'entregue' }) }); loadData(); } }} />
                                        <p className="text-[8px] text-white/30 text-center font-black">Link e Aperte Enter</p>
                                    </div>
                                )}
                                {req.status === 'entregue' && <div className="text-emerald-500 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2 bg-emerald-500/5 py-4 rounded-xl border border-emerald-500/10"><CheckCircle size={14}/> Vídeo Entregue</div>}
                            </div>
                        </div>
                    )) : <div className="py-24 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem] animate-pulse">Nenhuma solicitação no momento.</div>}
                </div>
            </div>
        )}

        {/* --- ABA ROLETA --- */}
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
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Foto Vitrine<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files[0]; if(f) { setSelectedProfileFile(f); setProfilePreviewUrl(URL.createObjectURL(f)); } }} className="hidden" /></label>
                        {selectedProfileFile && <button onClick={async () => { setUploading(true); const fn=`profile_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedProfileFile.type}, body:selectedProfileFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ profile_url: url }) }); setCurrentProfile(url); setSelectedProfileFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FFD700] text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Foto Vitrine</button>}
                    </div>
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-full h-32 mb-4 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative">
                            {(bgPreviewUrl || currentBg) ? <img src={(bgPreviewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}
                            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                        </div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Fundo Roleta<input type="file" accept="image/*" onChange={(e:any) => { const f=e.target.files[0]; if(f) { setSelectedBgFile(f); setBgPreviewUrl(URL.createObjectURL(f)); } }} className="hidden" /></label>
                        {selectedBgFile && <button onClick={async () => { setUploading(true); const fn=`bg_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedBgFile.type}, body:selectedBgFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: url }) }); setCurrentBg(url); setSelectedBgFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FF1493] text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Fundo Roleta</button>}
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-8 rounded-[3rem] shadow-2xl">
                    <h2 className="text-xs font-black uppercase text-white/50 tracking-widest mb-6">Slots da Roleta</h2>
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

        {/* --- ABA JOGADORES --- */}
        {activeTab === "players" && <PlayersManager modelId={modelId} isSuperAdmin={isSuper} />}

      </div>

      {/* MODAL EDITAR SLOT */}
      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const payload = { name: editingPrize.name, color: editingPrize.color, delivery_type: editingPrize.delivery_type, delivery_value: editingPrize.delivery_value };
              await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              setEditingPrize(null); loadData();
          }} className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative">
            <button type="button" onClick={() => setEditingPrize(null)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={24}/></button>
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center">Editar Slot</h2>
            <div className="space-y-4">
                <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" />
                <input type="color" value={editingPrize.color} onChange={e => setEditingPrize({...editingPrize, color: e.target.value})} className="w-full h-12 bg-transparent cursor-pointer" />
                <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase text-white/40">Entrega do Conteúdo</p>
                    <select value={editingPrize.delivery_type || 'whatsapp'} onChange={e => setEditingPrize({...editingPrize, delivery_type: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white">
                        <option value="whatsapp">Chamar no WhatsApp</option>
                        <option value="link">Link Direto (Drive)</option>
                        <option value="credit">Créditos de Giro</option>
                    </select>
                    {editingPrize.delivery_type !== 'whatsapp' && <input type="text" value={editingPrize.delivery_value || ''} onChange={e => setEditingPrize({...editingPrize, delivery_value: e.target.value})} placeholder="Link ou Valor" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />}
                </div>
                <button type="submit" className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95">Salvar Configurações</button>
            </div>
          </form>
        </div>
      )}

      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }`}</style>
    </div>
  );
}

export default function DashboardPage() { return <Suspense fallback={null}><DashboardContent /></Suspense>; }
