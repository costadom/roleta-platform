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

          // 🔥 PUXANDO GALERIA NORMAL E RASPADINHA PARA ALIMENTAR O FEED 🔥
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

  // 🔥 O NOVO FEED DE ATIVIDADES: PUXANDO FOTOS DO FEED E DA RASPADINHA 🔥
  const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          
          // Combina IDs das duas galerias (Limitando para as 15 mais recentes pra não travar)
          const recentMedias = medias.slice(0, 15); 
          const recentScratches = scratches.slice(0, 15);
          
          const allMediaItems = [...recentMedias, ...recentScratches];
          const mediaIds = allMediaItems.map(m => m.id || m.photo_url); // Usa photo_url como ID para raspadinha se não tiver ID
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (mediaIds.length > 0) {
              const mediaIdsStr = mediaIds.join(','); // AQUI FOI FEITA A CORREÇÃO (SEM ASPAS)
              
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(`${supabaseUrl}/rest/v1/Likes?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(`${supabaseUrl}/rest/v1/Comments?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);
              
              const safeLikes = Array.isArray(likesRes) ? likesRes : [];
              const safeComments = Array.isArray(commentsRes) ? commentsRes : [];

              const findImageUrl = (mId: string) => {
                 const item = allMediaItems.find(m => m.id === mId || m.photo_url === mId);
                 return item?.url || item?.photo_url || null;
              }

              likesList = safeLikes.map((l: any) => ({ ...l, type: 'like', media_url: findImageUrl(l.media_id) }));
              commentsList = safeComments.map((c: any) => ({ ...c, type: 'comment', media_url: findImageUrl(c.media_id) }));
          }
          
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          
          const combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
             .slice(0, 50); // Limita a 50 notificações no total
             
          setActivityFeed(combinedFeed);
      } catch (e) {
          console.error("Erro silencioso feed:", e);
      }
  };

  // 🔥 NOVA FUNÇÃO: LIMPAR FEED 🔥
  const clearActivityFeed = async () => {
    if (!confirm("Isso irá apagar todas as curtidas e comentários exibidos nestas notificações. Continuar?")) return;
    
    setClearingFeed(true);
    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        
        // Pega todos os IDs das notificações na tela
        const likeIds = activityFeed.filter(n => n.type === 'like').map(n => n.id);
        const commentIds = activityFeed.filter(n => n.type === 'comment').map(n => n.id);

        if (likeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/Likes?id=in.(${likeIds.join(',')})`, { method: 'DELETE', headers });
        }
        
        if (commentIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/Comments?id=in.(${commentIds.join(',')})`, { method: 'DELETE', headers });
        }
        
        // Followers não apagamos o player, apenas limpamos do visual
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
              { model_id: modelId, name: "3 Giros Extras", color: "#10B9
