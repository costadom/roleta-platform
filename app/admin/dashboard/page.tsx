"use client";

import React, { useEffect, useState, Suspense, useMemo, Component, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ImageIcon, Check, Gift, DollarSign, Users, Link as LinkIcon, 
  Edit3, ArrowLeft, Palette, Copy, LogOut, Megaphone, Trophy, Crown, 
  Loader2, Wallet, Calendar, CheckCircle2, Bell, FileText, Lock, 
  HelpCircle, ChevronUp, ChevronDown, User, Globe, Camera, Video, Send, Trash2, LayoutGrid, CheckCircle, Clock, AlertTriangle, Settings, Eye, EyeOff, X, Upload, Plus, Info, Receipt, Sparkles, Star, MessageCircle, Mic, Square, ImagePlus, Heart, Play, Rocket, Key
} from "lucide-react";
import PlayersManager from "./players";

const censorText = (text: string) => {
  if (!text) return text;
  const forbiddenPatterns = [
    /whatsapp/gi, /wpp/gi, /zap/gi, /whats/gi, /w a t s/gi,
    /pix/gi, /p1x/gi, /p i x/gi, /p-i-x/gi,
    /instagram/gi, /insta/gi, /ig/gi, /@/gi,
    /email/gi, /e-mail/gi, /gmail/gi, /hotmail/gi,
    /telegram/gi, /tlg/gi,
    /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g
  ];
  let filteredText = text;
  forbiddenPatterns.forEach(pattern => { filteredText = filteredText.replace(pattern, " [⚠️ DADOS PROTEGIDOS] "); });
  return filteredText;
};

const formatAudioTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file; 
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event: any) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1280; 
                const MAX_HEIGHT = 1280;
                
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    else resolve(file);
                }, 'image/jpeg', 0.6); 
            };
        };
    });
};

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
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
  
  const urlModelId = searchParams.get("model");
  const urlModelSlug = searchParams.get("slug");
  const modelId = (urlModelId && urlModelId !== "undefined" && urlModelId !== "null") ? urlModelId : (typeof window !== "undefined" ? localStorage.getItem("labz_model_id") : null);
  const modelSlug = (urlModelSlug && urlModelSlug !== "undefined" && urlModelSlug !== "null") ? urlModelSlug : (typeof window !== "undefined" ? localStorage.getItem("labz_model_slug") : null);

  const [isMounted, setIsMounted] = useState(false);
  const [modelUrl, setModelUrl] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"finance" | "marketing" | "hub" | "gallery" | "sales" | "video_requests" | "vitrine" | "players" | "raspadinha" | "chat" | "followers">("finance");
  
  const [modelData, setModelData] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [videoRequests, setVideoRequests] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]); 
  const [scratchPhotos, setScratchPhotos] = useState<any[]>([]); 
  const [globalAnnouncement, setGlobalAnnouncement] = useState(""); 
  
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
  const [uploadingSliceMedia, setUploadingSliceMedia] = useState(false);

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

  const [unreadChatCounts, setUnreadChatCounts] = useState(0);
  const [followersList, setFollowersList] = useState<any[]>([]);
  
  const [showMediaStats, setShowMediaStats] = useState<any | null>(null);
  const [mediaComments, setMediaComments] = useState<any[]>([]);
  const [mediaLikes, setMediaLikes] = useState<number>(0);

  const [chatList, setChatList] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState<File | null>(null);
  const [chatMediaPreview, setChatMediaPreview] = useState<string | null>(null);
  const [isChatMediaPaid, setIsChatMediaPaid] = useState(false);
  const [chatMediaPrice, setChatMediaPrice] = useState("");

  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [clearingFeed, setClearingFeed] = useState(false);

  const [tgGroupId, setTgGroupId] = useState("");
  const [tgMessage, setTgMessage] = useState("");
  const [tgToken, setTgToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [sendingTg, setSendingTg] = useState(false);
  const [tgStatus, setTgStatus] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelSlug && typeof window !== 'undefined') setModelUrl(window.location.origin);
  }, [modelSlug]);

  const loadData = async () => {
    if (!modelId) {
        setDashboardLoading(false);
        return;
    }
    
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
      
      const safeFetch = async (url: string, opts: any = {}) => {
          try {
              const res = await fetch(url, { headers: { ...headers, ...opts.headers } });
              if (!res.ok) return null; 
              return await res.json();
          } catch (e) {
              console.error("Falha silenciosa na rota:", url);
              return null; 
          }
      };

      const resGlob = await safeFetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`);
      const resModel = await safeFetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=*`);
      const resConfig = await safeFetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`);

      if (resGlob && resGlob[0]) setGlobalAnnouncement(resGlob[0].announcement_msg); 
      
      if (resModel && resModel[0]) {
        setModelData(resModel[0]); 
        setModelBalance(resModel[0].balance || 0); 
        setPixKey1(resModel[0].pix_key_1 || ""); 
        setPixKey2(resModel[0].pix_key_2 || ""); 
        setBio(resModel[0].bio || "");
        localStorage.setItem("labz_model_id", resModel[0].id);
        localStorage.setItem("labz_model_slug", resModel[0].slug);
      }
      
      if (resConfig && resConfig[0]) {
        setCurrentBg(resConfig[0].bg_url || null); 
        setCurrentProfile(resConfig[0].profile_url || null); 
        setModelName(resConfig[0].model_name || ""); 
        setShowcaseVisible(resConfig[0].showcase_visible === true);
        setTgToken(resConfig[0].tg_bot_token || ""); 
      }

      setDashboardLoading(false);

      const loadBackgroundData = async () => {
          const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

          await sleep(200); 
          const resTrans = await safeFetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&select=model_cut`);
          if (resTrans) setAccumulatedEarnings(resTrans.reduce((acc:any, curr:any) => acc + (Number(curr.model_cut) || 0), 0));

          await sleep(200); 
          const resPrizes = await safeFetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`);
          if (resPrizes) setPrizes(resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)));

          await sleep(200); 
          const resVideos = await safeFetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${modelId}&order=created_at.desc`);
          if (resVideos) setVideoRequests(resVideos);

          await sleep(200); 
          const resFollowers = await safeFetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&order=created_at.desc`);
          const fList = resFollowers || [];
          setFollowersList(fList);

          await sleep(200); 
          const resSales = await safeFetch(`${supabaseUrl}/rest/v1/UnlockedMedia?select=*,Media(*)`);
          if (resSales) {
             const mySales = resSales.filter((s: any) => s.Media?.model_id === modelId);
             setSalesHistory(mySales.sort((a:any, b:any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()));
          }

          await sleep(200); 
          const resMedia = await safeFetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelId}&order=created_at.desc`);
          const resScratch = await safeFetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?model_id=eq.${modelId}&active=eq.true`);
          
          if (resScratch) setScratchPhotos(resScratch);
          if (resMedia) setMediaList(resMedia);
          
          loadActivityFeed(resMedia || [], resScratch || [], fList); 
      };

      loadBackgroundData();

    } catch (err) { 
        console.error(err); 
        setDashboardLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [modelId]);

  // ✅ CORREÇÃO 1: loadActivityFeed sem aspas nos UUIDs dentro do in.(...)
  const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          
          const recentMedias = medias.slice(0, 15); 
          const recentScratches = scratches.slice(0, 15);
          
          const allMediaItems = [...recentMedias, ...recentScratches];
          const mediaIds = allMediaItems.map(m => m.id || m.photo_url);
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (mediaIds.length > 0) {
              // ✅ join simples sem aspas — Supabase exige UUIDs sem aspas no in.(...)
              const mediaIdsStr = mediaIds.join(',');
              
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(`${supabaseUrl}/rest/v1/Likes?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(`${supabaseUrl}/rest/v1/Comments?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);
              
              const safeLikes = Array.isArray(likesRes) ? likesRes : [];
              const safeComments = Array.isArray(commentsRes) ? commentsRes : [];

              const findImageUrl = (mId: string) => {
                 const item = allMediaItems.find(m => m.id === mId || m.photo_url === mId);
                 return item?.url || item?.photo_url || null;
              };

              likesList = safeLikes.map((l: any) => ({ ...l, type: 'like', media_url: findImageUrl(l.media_id) }));
              commentsList = safeComments.map((c: any) => ({ ...c, type: 'comment', media_url: findImageUrl(c.media_id) }));
          }
          
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          
          const combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
             .slice(0, 50);
             
          setActivityFeed(combinedFeed);
      } catch (e) {
          console.error("Erro silencioso feed:", e);
      }
  };

  const clearActivityFeed = async () => {
    if (!confirm("Isso irá apagar todas as curtidas e comentários exibidos nestas notificações. Continuar?")) return;
    
    setClearingFeed(true);
    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        
        const likeIds = activityFeed.filter(n => n.type === 'like').map(n => n.id);
        const commentIds = activityFeed.filter(n => n.type === 'comment').map(n => n.id);

        if (likeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/Likes?id=in.(${likeIds.join(',')})`, { method: 'DELETE', headers });
        }
        
        if (commentIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/Comments?id=in.(${commentIds.join(',')})`, { method: 'DELETE', headers });
        }
        
        setActivityFeed([]);
    } catch(e) {
        alert("Erro ao limpar notificações.");
    }
    setClearingFeed(false);
  };


  const handleSaveTgToken = async () => {
    setSavingToken(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { 
          method: "PATCH", 
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
          body: JSON.stringify({ tg_bot_token: tgToken }) 
      });
      alert("Token do Bot atualizado com sucesso!");
    } catch (error) {
      alert("Erro ao salvar o Token.");
    }
    setSavingToken(false);
  };

  const handleSendTelegramBroadcast = async () => {
    if (!tgGroupId || !tgMessage) return alert("Preencha o Link do Grupo e a Mensagem.");
    
    setSendingTg(true); 
    setTgStatus("");

    let finalChatId = tgGroupId.trim();
    
    if (finalChatId.includes("t.me/")) {
        const slugStr = finalChatId.split("t.me/")[1].split("/")[0].split("?")[0];
        if (slugStr.startsWith("+") || slugStr.startsWith("joinchat")) {
             setTgStatus("❌ Erro: Não use Link de Convite (+...). Para grupos privados, use o ID Numérico (-100...).");
             setSendingTg(false);
             return;
        }
        finalChatId = "@" + slugStr;
    } else if (!finalChatId.startsWith("-") && !finalChatId.startsWith("@")) {
        finalChatId = "@" + finalChatId;
    }

    try {
      const res = await fetch("/api/tg-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            canal: finalChatId,
            mensagem: tgMessage, 
            modelId: modelId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setTgStatus(`✅ Disparo de sucesso para ${finalChatId}!`);
      } else {
        setTgStatus(`❌ Erro: ${data.error}`);
      }
    } catch (e) {
      setTgStatus("❌ Erro de conexão ao disparar.");
    }
    setSendingTg(false);
  };

  const applyTemplate = (type: number) => {
      if (type === 1) {
          setTgMessage(`🔥 A espera acabou! Minha Roleta VIP está online aqui no Telegram!\n\nGire agora e ganhe fotos inéditas, vídeos exclusivos ou até uma chamada de vídeo comigo. 🤫\n\n👇 Clique no botão abaixo para tentar a sorte:`);
      } else if (type === 2) {
          setTgMessage(`Ninguém dorme hoje... 😈\n\nAcabei de colocar prêmios surpresa na minha Roleta VIP. Quem girar nos próximos 30 minutos tem mais chance de levar o prêmio principal.\n\n👇 Vem jogar comigo:`);
      } else if (type === 3) {
          setTgMessage(`Alguém do grupo acabou de ganhar meu Pack Premium na roleta! 👀\n\nAinda restam alguns prêmios raros escondidos hoje. Será que você consegue tirar?\n\n👇 Teste sua sorte agora:`);
      }
  };

  // ✅ CORREÇÃO 2: HEX "#10B981" completo + vírgula e weight corretos
  const generateDefaultPrizes = async () => {
      if (!modelId) return;
      setDashboardLoading(true);
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          const defaultSlices = [
              { model_id: modelId, name: "1 Giro Extra", color: "#FF1493", weight: 60 },
              { model_id: modelId, name: "Foto Exclusiva", color: "#00f0ff", weight: 50 },
              { model_id: modelId, name: "Vídeo Curtinho", color: "#FFD700", weight: 40 },
              { model_id: modelId, name: "Pack 3 Fotos", color: "#D946EF", weight: 30 },
              { model_id: modelId, name: "3 Giros Extras", color: "#10B981", weight: 20 },
          ];

          for (const slice of defaultSlices) {
              await fetch(`${supabaseUrl}/rest/v1/Prize`, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(slice)
              });
          }

          await loadData();
      } catch (err) {
          console.error(err);
          alert("Erro ao gerar prêmios padrão.");
      }
      setDashboardLoading(false);
  };

  if (!isMounted) return null;

  if (dashboardLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#FF1493] mx-auto mb-4" size={40} />
          <p className="text-white/50 text-xs font-black uppercase tracking-widest animate-pulse">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!modelId) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="text-[#FFD700] mx-auto mb-4" size={40} />
          <h2 className="text-white font-black text-lg uppercase mb-2">Acesso Negado</h2>
          <p className="text-white/50 text-xs mb-6">Nenhum modelo identificado. Faça login novamente.</p>
          <button onClick={() => router.push("/admin")} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-4 rounded-2xl">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white">

        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentProfile ? (
              <img src={currentProfile} alt="profile" className="w-8 h-8 rounded-full object-cover border border-[#FF1493]/40" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FF1493]/20 border border-[#FF1493]/40 flex items-center justify-center">
                <User size={14} className="text-[#FF1493]" />
              </div>
            )}
            <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Dashboard</p>
              <p className="text-xs font-black text-white">{modelName || "Modelo"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
              className="relative w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Bell size={16} className="text-white/70" />
              {activityFeed.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF1493] rounded-full text-[8px] font-black flex items-center justify-center">
                  {activityFeed.length > 9 ? "9+" : activityFeed.length}
                </span>
              )}
            </button>

            {/* Model URL copy */}
            {modelSlug && (
              <button
                onClick={() => { navigator.clipboard.writeText(`${modelUrl}/${modelSlug}`); alert("Link copiado!"); }}
                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <LinkIcon size={16} className="text-white/70" />
              </button>
            )}

            <button
              onClick={() => { localStorage.clear(); router.push("/admin"); }}
              className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all"
            >
              <LogOut size={16} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS PANEL */}
        {showNotificationsPanel && (
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-black/95 backdrop-blur-2xl border-l border-white/10 z-[200] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-[#FF1493] tracking-widest flex items-center gap-2">
                <Bell size={14} /> Atividades Recentes
              </h3>
              <div className="flex items-center gap-2">
                {activityFeed.length > 0 && (
                  <button
                    onClick={clearActivityFeed}
                    disabled={clearingFeed}
                    className="text-[9px] font-black uppercase text-white/30 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    {clearingFeed ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                    Limpar
                  </button>
                )}
                <button onClick={() => setShowNotificationsPanel(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activityFeed.length === 0 ? (
                <p className="text-[10px] text-white/30 italic text-center py-10 uppercase tracking-widest">Nenhuma atividade recente.</p>
              ) : (
                activityFeed.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-start gap-3">
                    {item.type === 'like' && <Heart size={14} className="text-[#FF1493] mt-0.5 shrink-0" />}
                    {item.type === 'comment' && <MessageCircle size={14} className="text-[#00f0ff] mt-0.5 shrink-0" />}
                    {item.type === 'follower' && <Users size={14} className="text-[#FFD700] mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      {item.type === 'like' && <p className="text-[10px] text-white/70">Nova curtida na mídia</p>}
                      {item.type === 'comment' && (
                        <>
                          <p className="text-[10px] text-white/70">Novo comentário</p>
                          {item.content && <p className="text-[9px] text-white/40 mt-0.5 truncate">"{censorText(item.content)}"</p>}
                        </>
                      )}
                      {item.type === 'follower' && (
                        <p className="text-[10px] text-white/70">Novo seguidor: <span className="text-[#FFD700]">{item.name || item.nickname || "Fã VIP"}</span></p>
                      )}
                      <p className="text-[8px] text-white/20 mt-1">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    {item.media_url && (
                      <img src={item.media_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 opacity-60" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="pt-16 pb-24 px-4 max-w-2xl mx-auto">

          {/* TABS */}
          <div className="flex gap-2 overflow-x-auto pb-3 pt-4 no-scrollbar">
            {[
              { key: "finance", label: "Finanças", icon: <DollarSign size={12} /> },
              { key: "hub", label: "Hub", icon: <Settings size={12} /> },
              { key: "gallery", label: "Galeria", icon: <ImageIcon size={12} /> },
              { key: "raspadinha", label: "Raspadinha", icon: <Sparkles size={12} /> },
              { key: "vitrine", label: "Roleta", icon: <Trophy size={12} /> },
              { key: "video_requests", label: "Pedidos", icon: <Video size={12} /> },
              { key: "sales", label: "Vendas", icon: <Receipt size={12} /> },
              { key: "chat", label: "Chat", icon: <MessageCircle size={12} /> },
              { key: "followers", label: "Seguidores", icon: <Users size={12} /> },
              { key: "marketing", label: "Marketing", icon: <Megaphone size={12} /> },
              ...(isSuper ? [{ key: "players", label: "Clientes", icon: <Crown size={12} /> }] : []),
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? "bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/20"
                    : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: FINANCE */}
          {activeTab === "finance" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Saldo Disponível</p>
                  <p className="text-2xl font-black text-[#FFD700]">R$ {modelBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Total Acumulado</p>
                  <p className="text-2xl font-black text-[#FF1493]">R$ {accumulatedEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2"><Key size={14}/> Chaves PIX para Saque</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Chave PIX 1</label>
                    <input
                      value={pixKey1}
                      onChange={e => setPixKey1(e.target.value)}
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Chave PIX 2 (opcional)</label>
                    <input
                      value={pixKey2}
                      onChange={e => setPixKey2(e.target.value)}
                      placeholder="Chave de backup"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      setSavingPix(true);
                      await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
                        method: "PATCH",
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ pix_key_1: pixKey1, pix_key_2: pixKey2 })
                      });
                      setSavingPix(false);
                      alert("Chaves PIX salvas!");
                    }}
                    disabled={savingPix}
                    className="w-full bg-[#FF1493] text-white font-black uppercase text-[10px] py-3 rounded-xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingPix ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Salvar Chaves
                  </button>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (modelBalance <= 0) return alert("Saldo insuficiente para saque.");
                  if (!pixKey1) return alert("Cadastre uma chave PIX antes de solicitar saque.");
                  if (!confirm(`Solicitar saque de R$ ${modelBalance.toFixed(2)}?`)) return;
                  setIsWithdrawing(true);
                  await fetch(`${supabaseUrl}/rest/v1/WithdrawalRequests`, {
                    method: "POST",
                    headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ model_id: modelId, amount: modelBalance, pix_key: pixKey1, status: "pending" })
                  });
                  await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
                    method: "PATCH",
                    headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ balance: 0 })
                  });
                  setModelBalance(0);
                  setIsWithdrawing(false);
                  alert("Solicitação de saque enviada! Processaremos em até 24h.");
                }}
                disabled={isWithdrawing || modelBalance <= 0}
                className="w-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-black uppercase text-[10px] py-4 rounded-2xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-[#FFD700]/20 transition-all"
              >
                {isWithdrawing ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                Solicitar Saque — R$ {modelBalance.toFixed(2)}
              </button>
            </div>
          )}

          {/* TAB: PLAYERS (Super Admin Only) */}
          {activeTab === "players" && isSuper && (
            <div className="animate-in fade-in duration-300">
              <PlayersManager modelId={modelId} isSuperAdmin={isSuper} />
            </div>
          )}

          {/* TAB: FOLLOWERS */}
          {activeTab === "followers" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2 mb-4">
                  <Users size={14} /> {followersList.length} Seguidores
                </h3>
                <div className="space-y-2">
                  {followersList.length === 0 ? (
                    <p className="text-[10px] text-white/30 italic text-center py-6">Nenhum seguidor ainda.</p>
                  ) : (
                    followersList.map((f, idx) => (
                      <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white">{f.name || f.nickname || "Fã VIP"}</p>
                          <p className="text-[9px] text-white/30 mt-0.5">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="text-[8px] font-black uppercase text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/20 px-2 py-1 rounded-lg">
                          {f.credits || 0} CR
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MARKETING */}
          {activeTab === "marketing" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                  <Send size={14} /> Disparo no Telegram
                </h3>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Token do Bot</label>
                  <div className="flex gap-2">
                    <input
                      value={tgToken}
                      onChange={e => setTgToken(e.target.value)}
                      placeholder="1234567890:AAF..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50 font-mono"
                    />
                    <button
                      onClick={handleSaveTgToken}
                      disabled={savingToken}
                      className="px-4 bg-white/10 border border-white/10 rounded-xl text-white/60 hover:bg-white/20 transition-all"
                    >
                      {savingToken ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Link ou ID do Grupo/Canal</label>
                  <input
                    value={tgGroupId}
                    onChange={e => setTgGroupId(e.target.value)}
                    placeholder="t.me/seugrupo ou -1001234567890"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Mensagem</label>
                  <textarea
                    value={tgMessage}
                    onChange={e => setTgMessage(e.target.value)}
                    rows={5}
                    placeholder="Digite sua mensagem aqui..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(t => (
                    <button
                      key={t}
                      onClick={() => applyTemplate(t)}
                      className="bg-white/5 border border-white/10 rounded-xl py-2 text-[9px] font-black uppercase text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Template {t}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSendTelegramBroadcast}
                  disabled={sendingTg}
                  className="w-full bg-[#FF1493] text-white font-black uppercase text-[10px] py-4 rounded-2xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sendingTg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Disparar Mensagem
                </button>

                {tgStatus && (
                  <p className={`text-[10px] font-black text-center py-2 px-3 rounded-xl ${tgStatus.startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {tgStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB: HUB */}
          {activeTab === "hub" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2"><Edit3 size={14}/> Configurações do Perfil</h3>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Sua descrição..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-2">Foto de Perfil</label>
                  <div
                    onClick={() => document.getElementById('profileInput')?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-[#FF1493]/40 transition-all"
                  >
                    {profilePreviewUrl || currentProfile ? (
                      <img src={profilePreviewUrl || currentProfile!} alt="profile" className="w-16 h-16 rounded-full object-cover mx-auto" />
                    ) : (
                      <Camera size={20} className="text-white/20 mx-auto mb-2" />
                    )}
                    <p className="text-[9px] text-white/30 mt-2">Clique para alterar</p>
                  </div>
                  <input id="profileInput" type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedProfileFile(file);
                      setProfilePreviewUrl(URL.createObjectURL(file));
                    }
                  }} />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-2">Imagem de Fundo</label>
                  <div
                    onClick={() => document.getElementById('bgInput')?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-[#FF1493]/40 transition-all"
                  >
                    {bgPreviewUrl || currentBg ? (
                      <img src={bgPreviewUrl || currentBg!} alt="bg" className="w-full h-20 object-cover rounded-xl" />
                    ) : (
                      <ImageIcon size={20} className="text-white/20 mx-auto mb-2" />
                    )}
                    <p className="text-[9px] text-white/30 mt-2">Clique para alterar</p>
                  </div>
                  <input id="bgInput" type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedBgFile(file);
                      setBgPreviewUrl(URL.createObjectURL(file));
                    }
                  }} />
                </div>

                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-black text-white">Vitrine Pública</p>
                    <p className="text-[9px] text-white/30 mt-0.5">Exibir perfil na página de descoberta</p>
                  </div>
                  <button
                    onClick={async () => {
                      const newVal = !showcaseVisible;
                      setShowcaseVisible(newVal);
                      await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, {
                        method: "PATCH",
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ showcase_visible: newVal })
                      });
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${showcaseVisible ? 'bg-[#FF1493]' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showcaseVisible ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <button
                  onClick={async () => {
                    setSavingHub(true);
                    try {
                      await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
                        method: "PATCH",
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ bio })
                      });

                      if (selectedProfileFile) {
                        const compressed = await compressImage(selectedProfileFile);
                        const formData = new FormData();
                        formData.append('file', compressed);
                        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/profiles/${modelId}/profile_${Date.now()}.jpg`, {
                          method: 'POST',
                          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` },
                          body: compressed
                        });
                        if (uploadRes.ok) {
                          const profileUrl = `${supabaseUrl}/storage/v1/object/public/profiles/${modelId}/profile_${Date.now()}.jpg`;
                          await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, {
                            method: "PATCH",
                            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ profile_url: profileUrl })
                          });
                          setCurrentProfile(profileUrl);
                        }
                      }

                      alert("Perfil atualizado!");
                    } catch (e) {
                      alert("Erro ao salvar.");
                    }
                    setSavingHub(false);
                  }}
                  disabled={savingHub}
                  className="w-full bg-[#FF1493] text-white font-black uppercase text-[10px] py-3 rounded-xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingHub ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* TAB: GALLERY */}
          {activeTab === "gallery" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Nova Mídia</h3>

                <div
                  onClick={() => document.getElementById('galleryInput')?.click()}
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-[#FF1493]/40 transition-all"
                >
                  {galleryPreviewUrl ? (
                    <img src={galleryPreviewUrl} alt="preview" className="max-h-40 mx-auto rounded-xl object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-white/20 mx-auto mb-2" />
                      <p className="text-[9px] text-white/30">Clique para selecionar foto ou vídeo</p>
                    </>
                  )}
                </div>
                <input id="galleryInput" type="file" accept="image/*,video/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedGalleryFile(file);
                    setGalleryPreviewUrl(URL.createObjectURL(file));
                  }
                }} />

                <input
                  value={newMediaCaption}
                  onChange={e => setNewMediaCaption(e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50"
                />

                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-black text-white">Mídia Paga</p>
                    <p className="text-[9px] text-white/30 mt-0.5">Cobrar para desbloquear</p>
                  </div>
                  <button
                    onClick={() => setIsPaidMedia(!isPaidMedia)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isPaidMedia ? 'bg-[#FF1493]' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPaidMedia ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {isPaidMedia && (
                  <input
                    value={rawPrice}
                    onChange={e => setRawPrice(e.target.value)}
                    placeholder="Preço em créditos (ex: 50)"
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/50"
                  />
                )}

                <button
                  onClick={async () => {
                    if (!selectedGalleryFile) return alert("Selecione um arquivo.");
                    setUploading(true);
                    try {
                      const isVideo = selectedGalleryFile.type.startsWith('video/');
                      const fileToUpload = isVideo ? selectedGalleryFile : await compressImage(selectedGalleryFile);
                      const ext = isVideo ? 'mp4' : 'jpg';
                      const fileName = `${modelId}/${Date.now()}.${ext}`;
                      
                      await fetch(`${supabaseUrl}/storage/v1/object/media/${fileName}`, {
                        method: 'POST',
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': fileToUpload.type },
                        body: fileToUpload
                      });

                      const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${fileName}`;

                      await fetch(`${supabaseUrl}/rest/v1/Media`, {
                        method: "POST",
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({
                          model_id: modelId,
                          url: publicUrl,
                          caption: newMediaCaption,
                          is_paid: isPaidMedia,
                          price: isPaidMedia ? Number(rawPrice) : 0,
                          type: isVideo ? 'video' : 'image'
                        })
                      });

                      setSelectedGalleryFile(null);
                      setGalleryPreviewUrl(null);
                      setNewMediaCaption("");
                      setIsPaidMedia(false);
                      setRawPrice("");
                      await loadData();
                      alert("Mídia publicada!");
                    } catch (e) {
                      alert("Erro ao publicar mídia.");
                    }
                    setUploading(false);
                  }}
                  disabled={uploading || !selectedGalleryFile}
                  className="w-full bg-[#FF1493] text-white font-black uppercase text-[10px] py-4 rounded-2xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Publicar Mídia
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {mediaList.map((m, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-square bg-white/5">
                    {m.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/60">
                        <Play size={20} className="text-white/60" />
                      </div>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                    {m.is_paid && (
                      <div className="absolute top-1 right-1 bg-[#FFD700] text-black text-[8px] font-black px-1.5 py-0.5 rounded-lg">
                        {m.price}CR
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm("Excluir esta mídia?")) return;
                        await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${m.id}`, {
                          method: "DELETE",
                          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
                        });
                        setMediaList(prev => prev.filter(x => x.id !== m.id));
                      }}
                      className="absolute bottom-1 right-1 w-6 h-6 bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RASPADINHA */}
          {activeTab === "raspadinha" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2"><Sparkles size={14}/> Fotos da Raspadinha</h3>

                <div
                  onClick={() => document.getElementById('scratchInput')?.click()}
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-[#FF1493]/40 transition-all"
                >
                  {scratchPreviewUrl ? (
                    <img src={scratchPreviewUrl} alt="preview" className="max-h-40 mx-auto rounded-xl object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-white/20 mx-auto mb-2" />
                      <p className="text-[9px] text-white/30">Selecionar foto para raspadinha</p>
                    </>
                  )}
                </div>
                <input id="scratchInput" type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedScratchFile(file);
                    setScratchPreviewUrl(URL.createObjectURL(file));
                  }
                }} />

                <button
                  onClick={async () => {
                    if (!selectedScratchFile) return alert("Selecione uma foto.");
                    setUploadingScratch(true);
                    try {
                      const compressed = await compressImage(selectedScratchFile);
                      const fileName = `${modelId}/scratch_${Date.now()}.jpg`;
                      
                      await fetch(`${supabaseUrl}/storage/v1/object/scratch/${fileName}`, {
                        method: 'POST',
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'image/jpeg' },
                        body: compressed
                      });

                      const publicUrl = `${supabaseUrl}/storage/v1/object/public/scratch/${fileName}`;

                      await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos`, {
                        method: "POST",
                        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ model_id: modelId, photo_url: publicUrl, active: true })
                      });

                      setSelectedScratchFile(null);
                      setScratchPreviewUrl(null);
                      await loadData();
                      alert("Foto adicionada à raspadinha!");
                    } catch (e) {
                      alert("Erro ao adicionar foto.");
                    }
                    setUploadingScratch(false);
                  }}
                  disabled={uploadingScratch || !selectedScratchFile}
                  className="w-full bg-[#FF1493] text-white font-black uppercase text-[10px] py-4 rounded-2xl tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingScratch ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Adicionar à Raspadinha
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {scratchPhotos.map((p, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-square bg-white/5">
                    <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={async () => {
                        if (!confirm("Remover esta foto da raspadinha?")) return;
                        await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?id=eq.${p.id}`, {
                          method: "DELETE",
                          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
                        });
                        setScratchPhotos(prev => prev.filter(x => x.id !== p.id));
                      }}
                      className="absolute bottom-1 right-1 w-6 h-6 bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: VITRINE (Roleta) */}
          {activeTab === "vitrine" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {prizes.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                  <Trophy size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-xs font-black text-white/50 mb-2">Nenhum prêmio cadastrado</p>
                  <p className="text-[9px] text-white/30 mb-6">Gere os prêmios padrão ou crie manualmente</p>
                  <button
                    onClick={generateDefaultPrizes}
                    className="bg-[#FF1493] text-white font-black uppercase text-[10px] py-3 px-6 rounded-xl tracking-widest"
                  >
                    Gerar Prêmios Padrão
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {prizes.map((prize, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: prize.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white">{prize.name}</p>
                        <p className="text-[9px] text-white/30">Peso: {prize.weight}</p>
                      </div>
                      <button
                        onClick={() => setEditingPrize(prize)}
                        className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                      >
                        <Edit3 size={12} className="text-white/50" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Excluir este prêmio?")) return;
                          await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${prize.id}`, {
                            method: "DELETE",
                            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }
                          });
                          setPrizes(prev => prev.filter(p => p.id !== prize.id));
                        }}
                        className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: VIDEO REQUESTS */}
          {activeTab === "video_requests" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {videoRequests.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                  <Video size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-xs text-white/30">Nenhum pedido de vídeo ainda.</p>
                </div>
              ) : (
                videoRequests.map((req, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                        req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        req.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {req.status === 'pending' ? 'Pendente' : req.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                      <span className="text-[9px] text-white/30">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-white">{censorText(req.description)}</p>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, {
                              method: "PATCH",
                              headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                              body: JSON.stringify({ status: 'completed' })
                            });
                            setVideoRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'completed'} : r));
                          }}
                          className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 font-black uppercase text-[9px] py-2 rounded-xl"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={async () => {
                            await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${req.id}`, {
                              method: "PATCH",
                              headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
                              body: JSON.stringify({ status: 'cancelled' })
                            });
                            setVideoRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'cancelled'} : r));
                          }}
                          className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-[9px] py-2 rounded-xl"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: SALES */}
          {activeTab === "sales" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {salesHistory.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                  <Receipt size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-xs text-white/30">Nenhuma venda ainda.</p>
                </div>
              ) : (
                salesHistory.map((sale, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                    {sale.Media?.url && (
                      <img src={sale.Media.url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">{sale.Media?.caption || "Mídia"}</p>
                      <p className="text-[9px] text-white/30">{new Date(sale.unlocked_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-sm font-black text-[#FFD700] shrink-0">{sale.Media?.price || 0} CR</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === "chat" && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 animate-in fade-in duration-300">
              <p className="text-[10px] font-black uppercase text-white/30 tracking-widest text-center py-8">
                Chat em desenvolvimento 🚧
              </p>
            </div>
          )}

        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF1493]" size={40} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
