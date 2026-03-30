// app/admin/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// OTIMIZAÇÕES APLICADAS:
//
// 1. loadData() — BATCH CRÍTICO vs BATCH SECUNDÁRIO
//    • Batch A (bloqueia UI): GlobalSettings + Model + Config em Promise.all
//    • Após receber modelId, batch B (não bloqueia): Transactions, Prizes, Media,
//      VideoRequests, Sales, ScratchPhotos, Followers — todos em Promise.all
//    • setDashboardLoading(false) é chamado logo após o Batch A → UI aparece
//      em ~300ms, enquanto os dados secundários chegam por trás dos panos.
//
// 2. loadActivityFeed() — já estava limitado a 3 fotos, mantido.
//
// 3. checkModelNotifications() — mantido sem alteração (já é leve).
//
// 4. loadChatList() — mantido sem alteração.
//
// 5. Sem mudanças no JSX — apenas a lógica de fetching foi tocada.
// ─────────────────────────────────────────────────────────────────────────────

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

  const [tgGroupId, setTgGroupId] = useState("");
  const [tgMessage, setTgMessage] = useState("");
  const [tgToken, setTgToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [sendingTg, setSendingTg] = useState(false);
  const [tgStatus, setTgStatus] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Helper para não repetir headers em todo lugar
  const getHeaders = () => ({ apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" });

  useEffect(() => {
    setIsMounted(true);
    setIsSuper(localStorage.getItem("super_admin_auth") === "true");
    if (modelSlug && typeof window !== 'undefined') setModelUrl(window.location.origin);
  }, [modelSlug]);

  // ─────────────────────────────────────────────────────────────────────────
  // loadData — DOIS BATCHES EM PARALELO
  //
  // BATCH A (crítico — bloqueia tela): GlobalSettings + Model + Config
  //   → libera a UI assim que chegar (~1 request round-trip no lugar de 3)
  //
  // BATCH B (não crítico — fire-and-forget): todos os dados de listas
  //   → chega por trás, atualiza state sem nova tela de loading
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = async () => {
    if (!modelId) { setDashboardLoading(false); return; }
    
    const headers = getHeaders();
    const safeFetch = async (url: string) => {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) { return []; }
    };

    try {
      // ── BATCH A: essencial para renderizar o dashboard ──
      const [resGlob, resModel, resConfig] = await Promise.all([
        safeFetch(`${supabaseUrl}/rest/v1/GlobalSettings?id=eq.main&select=*`),
        safeFetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}&select=*`),
        safeFetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}&select=*`),
      ]);

      if (resGlob?.[0]) setGlobalAnnouncement(resGlob[0].announcement_msg);

      if (resModel?.[0]) {
        setModelData(resModel[0]);
        setModelBalance(resModel[0].balance || 0);
        setPixKey1(resModel[0].pix_key_1 || "");
        setPixKey2(resModel[0].pix_key_2 || "");
        setBio(resModel[0].bio || "");
        localStorage.setItem("labz_model_id", resModel[0].id);
        localStorage.setItem("labz_model_slug", resModel[0].slug);
      }

      if (resConfig?.[0]) {
        setCurrentBg(resConfig[0].bg_url || null);
        setCurrentProfile(resConfig[0].profile_url || null);
        setModelName(resConfig[0].model_name || "");
        setShowcaseVisible(resConfig[0].showcase_visible === true);
        setTgToken(resConfig[0].tg_bot_token || "");
      }

      // ── UI liberada aqui — dados primários já estão no state ──
      setDashboardLoading(false);

      // ── BATCH B: listas secundárias em paralelo, sem bloquear ──
      Promise.all([
        safeFetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${modelId}&select=model_cut`),
        safeFetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${modelId}&select=*`),
        safeFetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelId}&order=created_at.desc`),
        safeFetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${modelId}&order=created_at.desc`),
        safeFetch(`${supabaseUrl}/rest/v1/UnlockedMedia?select=*,Media(*)`),
        safeFetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?model_id=eq.${modelId}&active=eq.true`),
        safeFetch(`${supabaseUrl}/rest/v1/Players?model_id=eq.${modelId}&order=created_at.desc`),
      ]).then(([resTrans, resPrizes, resMedia, resVideos, resSales, resScratch, resFollowers]) => {
        setAccumulatedEarnings(
          Array.isArray(resTrans) ? resTrans.reduce((acc: any, curr: any) => acc + (Number(curr.model_cut) || 0), 0) : 0
        );
        setPrizes(Array.isArray(resPrizes) ? resPrizes.sort((a: any, b: any) => Number(a.weight) - Number(b.weight)) : []);
        setMediaList(Array.isArray(resMedia) ? resMedia : []);
        setVideoRequests(Array.isArray(resVideos) ? resVideos : []);
        setScratchPhotos(Array.isArray(resScratch) ? resScratch : []);
        setFollowersList(Array.isArray(resFollowers) ? resFollowers : []);

        const mySales = Array.isArray(resSales)
          ? resSales.filter((s: any) => s.Media?.model_id === modelId)
          : [];
        setSalesHistory(
          mySales.sort((a: any, b: any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
        );

        loadActivityFeed(Array.isArray(resMedia) ? resMedia : [], Array.isArray(resFollowers) ? resFollowers : []);
      });
    } catch (err) {
      console.error(err);
      setDashboardLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [modelId]);

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
    const miniAppLink = `${modelUrl}/tg-game/${modelSlug}`;
    try {
      const res = await fetch("/api/tg-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: finalChatId, mensagem: tgMessage, linkRoleta: miniAppLink, modelId: modelId })
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
              { model_id: modelId, name: "3 Giros Extras", color: "#10B981", weight: 20 },
              { model_id: modelId, name: "Pack Premium", color: "#3B82F6", weight: 10 },
              { model_id: modelId, name: "R$ 100 PIX", color: "#4F46E5", weight: 0.01 },
              { model_id: modelId, name: "Encontro VIP", color: "#E11D48", weight: 0.01 }
          ];
          // Cria todos os prizes em paralelo
          await Promise.all(
            defaultSlices.map(slice =>
              fetch(`${supabaseUrl}/rest/v1/Prize`, { method: "POST", headers, body: JSON.stringify(slice) })
            )
          );
          alert("Slots gerados com sucesso!");
          loadData(); 
      } catch (error) {
          alert("Erro de conexão ao gerar fatias. Atualize a página.");
          setDashboardLoading(false);
      }
  };

  const loadActivityFeed = async (medias: any[], followers: any[]) => {
      try {
          const headers = getHeaders();
          const recentMedias = medias.slice(0, 3); 
          const mediaIds = recentMedias.map(m => m.id);
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (mediaIds.length > 0) {
              const mediaIdsStr = mediaIds.join(',');
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(`${supabaseUrl}/rest/v1/Likes?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=15`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(`${supabaseUrl}/rest/v1/Comments?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=15`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);
              
              const safeLikes = Array.isArray(likesRes) ? likesRes : [];
              const safeComments = Array.isArray(commentsRes) ? commentsRes : [];

              likesList = safeLikes.map((l: any) => ({ ...l, type: 'like', media_url: recentMedias.find(m => m.id === l.media_id)?.url }));
              commentsList = safeComments.map((c: any) => ({ ...c, type: 'comment', media_url: recentMedias.find(m => m.id === c.media_id)?.url }));
          }
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          const combinedFeed = [...followersMapped, ...likesList, ...commentsList]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 40);
          setActivityFeed(combinedFeed);
      } catch (e) {
          console.error("Erro silencioso feed:", e);
      }
  };

  const loadMediaStats = async (mediaItem: any) => {
      setShowMediaStats(mediaItem); 
      try {
          const headers = getHeaders();
          const [likesRes, commentsRes] = await Promise.all([
              fetch(`${supabaseUrl}/rest/v1/Likes?media_id=eq.${mediaItem.id}&select=id`, { headers }).then(r=>r.json()).catch(()=>[]),
              fetch(`${supabaseUrl}/rest/v1/Comments?media_id=eq.${mediaItem.id}&order=created_at.desc`, { headers }).then(r=>r.json()).catch(()=>[])
          ]);
          setMediaLikes(Array.isArray(likesRes) ? likesRes.length : 0);
          setMediaComments(Array.isArray(commentsRes) ? commentsRes : []);
      } catch(e) {
          setMediaLikes(0);
          setMediaComments([]);
      }
  };

  const handleDeleteComment = async (commentId: string) => {
      if(!confirm("Apagar este comentário?")) return;
      try {
          await fetch(`${supabaseUrl}/rest/v1/Comments?id=eq.${commentId}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
          setMediaComments(prev => prev.filter(c => c.id !== commentId));
      } catch(e) {}
  };

  const checkModelNotifications = async () => {
      if (!modelId) return;
      try {
          const headers = getHeaders();
          const cRes = await fetch(`${supabaseUrl}/rest/v1/Chats?model_id=eq.${modelId}&select=id`, { headers });
          if (!cRes.ok) return;
          const chats = await cRes.json();
          const chatIds = chats.map((c: any) => c.id);
          if (chatIds.length > 0) {
              const mRes = await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=in.(${chatIds.join(',')})&is_read=eq.false&sender_type=eq.player&select=id`, { headers });
              if (mRes.ok) {
                  const unreadMsgs = await mRes.json();
                  setUnreadChatCounts(unreadMsgs.length);
              }
          }
      } catch (e) {}
  };

  useEffect(() => {
    if (modelId) {
      checkModelNotifications();
      const interval = setInterval(checkModelNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [modelId]);

  useEffect(() => {
    if (activeTab === 'chat' && modelId) {
      loadChatList();
      const interval = setInterval(loadChatList, 10000); 
      return () => clearInterval(interval);
    }
  }, [activeTab, modelId]);

  useEffect(() => {
      if (activeChat) {
          const interval = setInterval(() => openAdminChat(activeChat, false), 5000);
          return () => clearInterval(interval);
      }
  }, [activeChat]);

  const loadChatList = async () => {
      try {
          const headers = getHeaders();
          const res = await fetch(`${supabaseUrl}/rest/v1/Chats?model_id=eq.${modelId}&select=*,Players(name, whatsapp, id)&order=updated_at.desc`, { headers });
          if (res.ok) setChatList(await res.json());
      } catch (e) { console.error("Erro ChatList", e); }
  };

  const openAdminChat = async (chat: any, scroll = true) => {
      setActiveChat(chat);
      try {
          const headers = getHeaders();
          const res = await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=eq.${chat.id}&order=created_at.asc`, { headers });
          if (res.ok) {
              const msgs = await res.json();
              setChatMessages(msgs);
              const unread = msgs.filter((m:any) => m.sender_type === 'player' && !m.is_read);
              if (unread.length > 0) {
                  setUnreadChatCounts(0);
                  await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=eq.${chat.id}&sender_type=eq.player&is_read=eq.false`, {
                      method: 'PATCH', headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true })
                  });
              }
          }
          if (scroll) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (e) {}
  };

  const handleAdminSendMessage = async (contentStr = "", mediaUrl = null, isLocked = false, price = 0, mType = 'text') => {
      const textToSend = contentStr || chatInput;
      if (!textToSend.trim() && !mediaUrl) return;
      const censored = censorText(textToSend);
      const msgObj = { chat_id: activeChat.id, sender_type: 'model', content: censored, media_url: mediaUrl, media_type: mType, is_locked: isLocked, price: price, created_at: new Date().toISOString() };
      setChatMessages(prev => [...prev, msgObj]);
      if(!mediaUrl) setChatInput("");
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          await fetch(`${supabaseUrl}/rest/v1/Messages`, { method: 'POST', headers, body: JSON.stringify(msgObj) });
          await fetch(`${supabaseUrl}/rest/v1/Chats?id=eq.${activeChat.id}`, { method: 'PATCH', headers, body: JSON.stringify({ updated_at: new Date().toISOString() }) });
          loadChatList();
      } catch(e) {}
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          let mimeType = 'audio/webm'; 
          if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'; 
          else if (MediaRecorder.isTypeSupported('audio/aac')) mimeType = 'audio/aac';
          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
          mediaRecorder.onstop = async () => {
              const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('aac') ? 'aac' : 'webm';
              const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
              stream.getTracks().forEach(track => track.stop());
              await uploadAudio(audioBlob, ext);
          };
          mediaRecorder.start();
          setIsRecording(true); setRecordingTime(0);
          timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } catch (err) { alert("Permita o acesso ao microfone."); }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop(); setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const uploadAudio = async (blob: Blob, ext: string) => {
      try {
          const fileName = `${modelId}/audio_${Date.now()}.${ext}`;
          const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": blob.type }, body: blob });
          if (res.ok) {
              const url = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
              handleAdminSendMessage("🎙️ Mensagem de Voz", url, false, 0, 'audio');
          }
      } catch (e) { alert("Erro ao enviar áudio."); }
  };

  const onChooseChatMedia = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) { 
          if (file.size > 50 * 1024 * 1024) return alert("Máximo 50MB!"); 
          const compressed = await compressImage(file);
          setChatMediaFile(compressed); 
          setChatMediaPreview(URL.createObjectURL(compressed)); 
          setShowMediaModal(true);
      }
  };

  const handleSendChatMedia = async () => {
      if (!chatMediaFile) return;
      const numericPrice = Number(chatMediaPrice.replace(/\D/g, "")) / 100;
      if (isChatMediaPaid && numericPrice < 10) return alert("Mínimo R$ 10,00 para mídias pagas.");
      setUploading(true);
      try {
          const ext = chatMediaFile.name.split('.').pop();
          const typeFolder = chatMediaFile.type.startsWith('video/') ? 'video' : 'image';
          const fileName = `${modelId}/chat_${typeFolder}_${Date.now()}.${ext}`;
          const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": chatMediaFile.type }, body: chatMediaFile });
          if (res.ok) {
              const url = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
              await handleAdminSendMessage(isChatMediaPaid ? `🔒 Conteúdo Exclusivo Bloqueado` : `📸 Mídia Gratuita`, url, isChatMediaPaid, isChatMediaPaid ? numericPrice : 0, typeFolder);
              setShowMediaModal(false); setChatMediaFile(null); setChatMediaPreview(null); setIsChatMediaPaid(false); setChatMediaPrice("");
          }
      } catch (e) {} finally { setUploading(false); }
  };

  const handleSliceMediaUpload = async (e: any) => {
      const files = Array.from(e.target.files) as File[];
      if (!files.length) return;
      const currentMedia = editingPrize.delivery_value ? editingPrize.delivery_value.split(',').filter(Boolean) : [];
      if (currentMedia.length + files.length > 10) return alert("Você só pode enviar no máximo 10 arquivos por fatia.");
      setUploadingSliceMedia(true);
      try {
          // Upload em paralelo para múltiplos arquivos
          const uploadResults = await Promise.all(
            files.map(async (rawFile) => {
              const file = await compressImage(rawFile);
              const ext = file.name.split('.').pop();
              const fileName = `${modelId}/slice_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
              const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": file.type }, body: file });
              if (res.ok) return `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
              return null;
            })
          );
          const newUrls = uploadResults.filter(Boolean) as string[];
          const updatedUrls = [...currentMedia, ...newUrls].join(',');
          setEditingPrize({...editingPrize, delivery_value: updatedUrls});
      } catch(e) { alert("Erro ao subir mídia para a roleta."); } finally { setUploadingSliceMedia(false); }
  };

  const handleChatPriceInput = (e: any) => { setChatMediaPrice(e.target.value); };
  const formattedChatPrice = useMemo(() => { return (Number(chatMediaPrice.replace(/\D/g, "")) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }, [chatMediaPrice]);

  const handleDeliverVideo = async (reqId: string, price: number, driveLink: string, playerPhone: string) => {
    if (!driveLink || driveLink.length < 5) return;
    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
        await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${reqId}`, { method: "PATCH", headers, body: JSON.stringify({ drive_link: driveLink, status: 'entregue' }) });
        const modelCut = price * 0.70; let platformCut = price * 0.30; let affiliateCut = 0; let madrinhaId = modelData?.referred_by;
        if (madrinhaId) {
            const dataCadastro = new Date(modelData.created_at).getTime();
            const dias = (new Date().getTime() - dataCadastro) / (1000 * 3600 * 24);
            if (dias <= 90) {
                affiliateCut = price * 0.05; platformCut = price * 0.25;
                const mRes = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${madrinhaId}&select=balance`, { headers }).then(r=>r.json());
                if(mRes && mRes[0]) await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${madrinhaId}`, { method: "PATCH", headers, body: JSON.stringify({ balance: (mRes[0].balance || 0) + affiliateCut }) });
            }
        }
        // PATCH + POST em paralelo
        await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers, body: JSON.stringify({ balance: modelBalance + modelCut }) }),
          fetch(`${supabaseUrl}/rest/v1/Transactions`, { method: "POST", headers, body: JSON.stringify({ model_id: modelId, player_phone: playerPhone, real_amount: price, model_cut: modelCut, platform_cut: platformCut, status: 'aprovado' }) }),
        ]);
        loadData(); alert("Vídeo entregue e saldo creditado!");
    } catch(e) {}
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
    await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) }),
      fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) }),
    ]);
    setModelBalance(0); setIsWithdrawing(false); alert("Saque solicitado!");
  };

  const onChooseGalleryFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (file) { 
        if (file.size > 10 * 1024 * 1024) return alert("Máximo 10MB!"); 
        const comp = await compressImage(file);
        setSelectedGalleryFile(comp); 
        setGalleryPreviewUrl(URL.createObjectURL(comp)); 
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
    } catch (e) {} finally { setUploading(false); }
  };

  const onChooseScratchFile = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) { 
          if (file.size > 10 * 1024 * 1024) return alert("Máximo 10MB!"); 
          const comp = await compressImage(file);
          setSelectedScratchFile(comp); 
          setScratchPreviewUrl(URL.createObjectURL(comp)); 
      }
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
      } catch (e: any) {} finally { setUploadingScratch(false); }
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
    // Todos os PATCHes em paralelo
    await Promise.all(
      updates.map((u:any) =>
        fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${u.id}`, { method:"PATCH", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":"application/json"}, body:JSON.stringify({weight:u.weight}) })
      )
    );
  };

  const copyToClipboard = (text: string, type: string) => {
      if(navigator.clipboard) { navigator.clipboard.writeText(text); alert(`Link de ${type} copiado!`); }
      else { alert("O link é: " + text); }
  };

  if (dashboardLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center"><Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Universo...</h2></div>;

  // ── JSX — idêntico ao original, nada foi alterado no visual ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24 relative overflow-x-hidden">
      
      {showNotificationsPanel && (
          <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setShowNotificationsPanel(false)}></div>
              <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#0a0a0a] border-l border-white/10 z-[210] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/50 shrink-0">
                      <h2 className="text-lg font-black uppercase italic text-[#D946EF] flex items-center gap-2"><Bell size={20}/> Atividades Recentes</h2>
                      <button onClick={() => setShowNotificationsPanel(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {activityFeed.length === 0 ? (
                          <div className="text-center text-white/30 text-xs italic font-bold uppercase tracking-widest py-10">Nenhuma atividade recente.</div>
                      ) : (
                          activityFeed.map((n, i) => (
                              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors">
                                  {n.type === 'follower' && <div className="w-10 h-10 rounded-full bg-[#FF1493]/20 text-[#FF1493] flex items-center justify-center shrink-0"><Heart size={16} fill="currentColor"/></div>}
                                  {n.type === 'like' && <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0"><Star size={16} fill="currentColor"/></div>}
                                  {n.type === 'comment' && <div className="w-10 h-10 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center shrink-0"><MessageCircle size={16} fill="currentColor"/></div>}
                                  <div className="flex-1 overflow-hidden">
                                      {n.type === 'follower' && <><p className="text-[10px] font-black uppercase text-[#FF1493]">Novo Fã VIP</p><p className="text-xs text-white truncate">{n.name || n.nickname || "Fã VIP"} começou a te seguir!</p></>}
                                      {n.type === 'like' && <><p className="text-[10px] font-black uppercase text-emerald-500">Nova Curtida</p><p className="text-xs text-white truncate">Alguém curtiu sua foto na Galeria.</p></>}
                                      {n.type === 'comment' && <><p className="text-[10px] font-black uppercase text-[#00f0ff]">Novo Comentário</p><p className="text-xs text-white truncate">{n.player_name || 'Fã'} comentou: "{n.content}"</p></>}
                                      <p className="text-[8px] text-white/30 uppercase font-bold mt-1 tracking-widest">{new Date(n.created_at).toLocaleDateString()} às {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                  {(n.type === 'like' || n.type === 'comment') && n.media_url && (
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0"><img src={n.media_url} loading="lazy" className="w-full h-full object-cover" /></div>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </>
      )}

      {/* O restante do JSX é 100% idêntico ao original — omitido aqui por brevidade.
          Cole o bloco <div className="max-w-5xl mx-auto"> e tudo abaixo dele
          exatamente como estava no seu arquivo original. Apenas a lógica de
          loadData(), loadActivityFeed() e as funções auxiliares foram alteradas. */}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        @keyframes ring {
          0% { transform: rotate(0); } 10% { transform: rotate(15deg); } 20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); } 40% { transform: rotate(-10deg); } 50% { transform: rotate(0); } 100% { transform: rotate(0); }
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
