// @ts-nocheck
"use client";

import React, { useEffect, useState, Suspense, useMemo, Component, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


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
  
  const [activeTab, setActiveTab] = useState<"finance" | "sammy" | "marketing" | "hub" | "gallery" | "sales" | "video_requests" | "vitrine" | "players" | "raspadinha" | "chat" | "followers">("finance");
  
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
  const sammyChatEndRef = useRef<HTMLDivElement>(null);
  
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

  
  const [sammyMessages, setSammyMessages] = useState([
    { id: 'msg-1', role: 'assistant', content: `Oi, eu sou a Sammy! 💅✨ Vi que você acabou de chegar...\n\nEu sou a sua nova assistente de IA. Meu trabalho aqui é vender seus conteúdos no automático lá na vitrine principal da LabzSexy!\n\nPra eu conseguir os melhores clientes pra você, preciso te conhecer melhor. Me conta: como é o seu estilo, seu corpo e o que você mais gosta de gravar? 🔥` }
  ]);
  const [sammyInput, setSammyInput] = useState("");
  const [isSammyLoading, setIsSammyLoading] = useState(false);

  const handleSammySubmit = async (e?: any) => {
      if(e) e.preventDefault();
      if (!sammyInput?.trim() || isSammyLoading) return;
      
      const userMsg = { id: Date.now().toString(), role: 'user', content: sammyInput };
      const newMessages = [...sammyMessages, userMsg];
      
      setSammyMessages(newMessages);
      setSammyInput("");
      setIsSammyLoading(true);

      try {
          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: newMessages, modelSlug: modelSlug })
          });
          const data = await res.json();
          
          if (!res.ok || data.error) throw new Error(data.error || "A Chave da IA falhou.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
          alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
      }
  };

  const handleFinishSammyTraining = async () => {
      if (isSammyLoading) return;
      setSavingHub(true);
      setIsSammyLoading(true);

      const userMsg = { id: Date.now().toString(), role: 'user', content: '[SISTEMA]: A modelo clicou no botão "Finalizar Treinamento". Por favor, confirme para ela que você absorveu as informações e que o perfil dela está otimizado.' };
      const newMessages = [...sammyMessages, userMsg];
      setSammyMessages(newMessages);
      
      try {
          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: newMessages, modelSlug: modelSlug })
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || "Erro de conexão.");
          
          setSammyMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }]);
      } catch (error: any) {
           alert("❌ ALERTA DA SAMMY: " + error.message);
      } finally {
          setIsSammyLoading(false);
          setSavingHub(false);
      }
  };

useEffect(() => {
      if (activeTab === "sammy") {
          setTimeout(() => sammyChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
  }, [sammyMessages, activeTab]);

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
        setDashboardLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [modelId]);

  const loadActivityFeed = async (medias: any[], scratches: any[], followers: any[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          const recentMedias = medias.slice(0, 15); 
          const recentScratches = scratches.slice(0, 15);
          const allMediaItems = [...recentMedias, ...recentScratches];
          
          // Regex rigorosa para pegar APENAS UUIDs da Galeria
          const validMediaIds = recentMedias.map(m => m.id).filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
          
          let likesList: any[] = []; let commentsList: any[] = [];
          
          if (validMediaIds.length > 0) {
              // MÁGICA AQUI: Envolve cada ID com "%22" (aspas na URL)
              const mediaIdsStr = validMediaIds.join(','); 
              
              const [likesRes, commentsRes] = await Promise.all([
                  fetch(`${supabaseUrl}/rest/v1/Likes?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
                  fetch(`${supabaseUrl}/rest/v1/Comments?media_id=in.(${mediaIdsStr})&order=created_at.desc&limit=20`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
              ]);
              
              const findImageUrl = (mId: string) => {
                 const item = allMediaItems.find(m => m.id === mId || m.photo_url === mId);
                 return item?.url || item?.photo_url || null;
              }

              likesList = (Array.isArray(likesRes) ? likesRes : []).map((l: any) => ({ ...l, type: 'like', media_url: findImageUrl(l.media_id) }));
              commentsList = (Array.isArray(commentsRes) ? commentsRes : []).map((c: any) => ({ ...c, type: 'comment', media_url: findImageUrl(c.media_id) }));
          }
          
          const followersMapped = (followers || []).map(f => ({ ...f, type: 'follower' }));
          let combinedFeed = [...followersMapped, ...likesList, ...commentsList]
             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             
          const clearedAt = localStorage.getItem('notifications_cleared_at');
          if (clearedAt) {
              combinedFeed = combinedFeed.filter(item => new Date(item.created_at).getTime() > Number(clearedAt));
          }
             
          setActivityFeed(combinedFeed.slice(0, 50));
      } catch (err) { console.error('Erro feed:', err); }
  };

  const clearActivityFeed = async () => {
    if (!confirm("Isso irá ocultar todas as notificações atuais da sua tela. Continuar?")) return;
    
    // Adiciona todos os itens atuais na lista de ocultos (Como o GPT sugeriu)
    const currentTimestamps = activityFeed.map(item => item.created_at);
    const stored = localStorage.getItem('hidden_notifications');
    const hiddenTimestamps = stored ? JSON.parse(stored) : [];
    
    const updated = [...hiddenTimestamps, ...currentTimestamps];
    localStorage.setItem('hidden_notifications', JSON.stringify(updated));
    
    setActivityFeed([]);
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
    } catch (error) { alert("Erro ao salvar o Token."); }
    setSavingToken(false);
  };

  const handleSendTelegramBroadcast = async () => {
    if (!tgGroupId || !tgMessage) return alert("Preencha o Link do Grupo e a Mensagem.");
    
    setSendingTg(true); 
    setTgStatus("");

    let finalChatId = tgGroupId?.trim();
    if (finalChatId.includes("t.me/")) {
        const slugStr = finalChatId.split("t.me/")[1].split("/")[0].split("?")[0];
        if (slugStr.startsWith("+") || slugStr.startsWith("joinchat")) {
             setTgStatus("❌ Erro: Não use Link de Convite (+...). Para grupos privados, use o ID Numérico (-100...).");
             setSendingTg(false); return;
        }
        finalChatId = "@" + slugStr;
    } else if (!finalChatId.startsWith("-") && !finalChatId.startsWith("@")) {
        finalChatId = "@" + finalChatId;
    }

    try {
      const res = await fetch("/api/tg-post", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: finalChatId, mensagem: tgMessage, modelId: modelId })
      });
      const data = await res.json();
      if (data.success) setTgStatus(`✅ Disparo de sucesso para ${finalChatId}!`);
      else setTgStatus(`❌ Erro: ${data.error}`);
    } catch (e) { setTgStatus("❌ Erro de conexão ao disparar."); }
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
          for (const slice of defaultSlices) {
              await fetch(`${supabaseUrl}/rest/v1/Prize`, { method: "POST", headers, body: JSON.stringify(slice) });
          }
          alert("Slots gerados com sucesso!");
          loadData(); 
      } catch (error) { alert("Erro de conexão ao gerar fatias. Atualize a página."); setDashboardLoading(false); }
  };

  const loadMediaStats = async (mediaItem: any) => {
      setShowMediaStats(mediaItem); 
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          const [likesRes, commentsRes] = await Promise.all([
              fetch(`${supabaseUrl}/rest/v1/Likes?media_id=eq.${mediaItem.id}&select=id`, { headers }).then(r=>r.json()).catch(()=>[]),
              fetch(`${supabaseUrl}/rest/v1/Comments?media_id=eq.${mediaItem.id}&order=created_at.desc`, { headers }).then(r=>r.json()).catch(()=>[])
          ]);
          setMediaLikes(Array.isArray(likesRes) ? likesRes.length : 0);
          setMediaComments(Array.isArray(commentsRes) ? commentsRes : []);
      } catch(e) { setMediaLikes(0); setMediaComments([]); }
  }

  const handleDeleteComment = async (commentId: string) => {
      if(!confirm("Apagar este comentário?")) return;
      try {
          await fetch(`${supabaseUrl}/rest/v1/Comments?id=eq.${commentId}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
          setMediaComments(prev => prev.filter(c => c.id !== commentId));
      } catch(e) {}
  }

  const checkModelNotifications = async () => {
      if (!modelId) return;
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
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
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          const res = await fetch(`${supabaseUrl}/rest/v1/Chats?model_id=eq.${modelId}&select=*,Players(name, whatsapp, id)&order=updated_at.desc`, { headers });
          if (res.ok) setChatList(await res.json());
      } catch (e) {}
  };

  const openAdminChat = async (chat: any, scroll = true) => {
      setActiveChat(chat);
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
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
      if (!textToSend?.trim() && !mediaUrl) return;
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
          const newUrls = [];
          for (const rawFile of files) {
              const file = await compressImage(rawFile);
              const ext = file.name.split('.').pop();
              const fileName = `${modelId}/slice_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
              const res = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": file.type }, body: file });
              if (res.ok) newUrls.push(`${supabaseUrl}/storage/v1/object/public/assets/${fileName}`);
          }
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
        await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers, body: JSON.stringify({ balance: modelBalance + modelCut }) });
        await fetch(`${supabaseUrl}/rest/v1/Transactions`, { method: "POST", headers, body: JSON.stringify({ model_id: modelId, player_phone: playerPhone, real_amount: price, model_cut: modelCut, platform_cut: platformCut, status: 'aprovado' }) });
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
    await fetch(`${supabaseUrl}/rest/v1/Withdrawals`, { method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model_id: modelId, amount: modelBalance - 1 }) });
    await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ balance: 0, last_withdrawal: new Date().toISOString() }) });
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
    await Promise.all(updates.map((u:any) => fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${u.id}`, { method:"PATCH", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":"application/json"}, body:JSON.stringify({weight:u.weight}) })));
  };

  const copyToClipboard = (text: string, type: string) => {
      if(navigator.clipboard) { navigator.clipboard.writeText(text); alert(`Link de ${type} copiado!`); }
      else { alert("O link é: " + text); }
  };

  if (dashboardLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center"><Loader2 className="animate-spin text-[#FF1493] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Universo...</h2></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans pb-24 relative overflow-x-hidden">
      
      {showNotificationsPanel && (
          <>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setShowNotificationsPanel(false)}></div>
              <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#0a0a0a] border-l border-white/10 z-[210] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-black/50 shrink-0">
                      <div className="flex items-center justify-between">
                          <h2 className="text-lg font-black uppercase italic text-[#D946EF] flex items-center gap-2"><Bell size={20}/> Atividades Recentes</h2>
                          <button onClick={() => setShowNotificationsPanel(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                      </div>
                      
                      {activityFeed.length > 0 && (
                          <button 
                              onClick={clearActivityFeed} 
                              disabled={clearingFeed}
                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                              {clearingFeed ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                              Limpar Notificações
                          </button>
                      )}
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

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => isSuper ? router.push('/admin/super') : (localStorage.clear(), router.push('/admin'))} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white bg-white/5 px-4 py-2 rounded-xl transition-all"> {isSuper ? "Voltar Master" : "Sair"} </button>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push(`/admin/studio`)} className="bg-[#00f0ff]/10 border border-[#00f0ff]/40 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:bg-[#00f0ff] hover:text-black transition-all group animate-pulse">
                   <Play size={16} className="text-[#00f0ff] group-hover:text-black" fill="currentColor" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff] group-hover:text-black">Ficar Ao Vivo</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-[#FF1493]/20 border border-[#FF1493]/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg hidden sm:flex">
                        <Heart size={12} className="text-[#FF1493]" fill="currentColor" />
                        <span className="text-[10px] font-black text-[#FF1493] uppercase tracking-widest">{followersList.length} Fãs</span>
                    </div>
                    <button onClick={() => setShowNotificationsPanel(true)} className="relative w-8 h-8 rounded-full bg-[#D946EF]/20 border border-[#D946EF]/50 flex items-center justify-center text-[#D946EF] hover:bg-[#D946EF] hover:text-white transition-all shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                        <Bell size={14} className="animate-ring" />
                        {activityFeed.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00f0ff] rounded-full border-2 border-black animate-pulse"></span>}
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2 group cursor-pointer border-b border-transparent hover:border-[#FFD700] transition-all pb-1 mt-2">
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

        {globalAnnouncement && (
          <div className="mb-8 bg-[#FF1493]/10 border border-[#FF1493]/30 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={40} className="text-[#FF1493] rotate-12" /></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-3 bg-[#FF1493] rounded-2xl shadow-lg shadow-[#FF1493]/20"><Bell size={20} className="text-white animate-ring" /></div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-[#FF1493] uppercase tracking-[0.2em] mb-1">Comunicado Oficial Savanah</h3>
                <p className="text-sm font-bold text-white/90 leading-relaxed italic">"{globalAnnouncement}"</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase text-white/40 tracking-widest">Menu da Musa</h2>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer text-[#D946EF]" onClick={() => { setActiveTab("chat"); }}>
                <MessageCircle size={16} className={unreadChatCounts > 0 ? "animate-pulse" : ""} /> 
                {unreadChatCounts > 0 ? `${unreadChatCounts} Chats` : "Mensagens"}
            </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
          
          <button onClick={() => setActiveTab("sammy")} className={`flex-1 min-w-[110px] py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === "sammy" ? "bg-gradient-to-r from-[#D946EF] to-[#FF1493] text-white shadow-lg shadow-[#D946EF]/30" : "text-white/30 hover:bg-white/5"}`}>
              <Sparkles size={14}/> Sammy (IA)
          </button>

          <button onClick={() => setActiveTab("finance")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "finance" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Ganhos</button>
          
          <button onClick={() => setActiveTab("marketing")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === "marketing" ? "bg-[#00f0ff] text-black shadow-lg shadow-[#00f0ff]/30" : "text-white/30 hover:bg-white/5"}`}>
              <Rocket size={14}/> TG Ads
          </button>

          <button onClick={() => setActiveTab("hub")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "hub" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Hub</button>
          <button onClick={() => setActiveTab("gallery")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "gallery" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Galeria</button>
          <button onClick={() => setActiveTab("chat")} className={`relative flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === "chat" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>
              <MessageCircle size={14}/> Chat VIP
              {unreadChatCounts > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] animate-bounce">{unreadChatCounts}</span>}
          </button>
          <button onClick={() => setActiveTab("video_requests")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "video_requests" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Vídeos</button>
          <button onClick={() => setActiveTab("sales")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "sales" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Vendas</button>
          <button onClick={() => setActiveTab("vitrine")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "vitrine" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Config. Vitrine</button>
          <button onClick={() => setActiveTab("raspadinha")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "raspadinha" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Raspadinha</button>
          <button onClick={() => setActiveTab("followers")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "followers" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Seguidores</button>
          <button onClick={() => setActiveTab("players")} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === "players" ? "bg-[#FF1493] text-white shadow-lg" : "text-white/30 hover:bg-white/5"}`}>Gerir Fãs</button>
        </div>

        {/* -------------------- CONTEÚDO DAS ABAS -------------------- */}

        {activeTab === "sammy" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-4 sm:p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col h-[75vh]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Sparkles size={100} className="text-[#D946EF]"/></div>
                    
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D946EF] to-[#FF1493] flex items-center justify-center shadow-lg shadow-[#D946EF]/30">
                                <Sparkles size={20} className="text-white"/>
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase italic text-white tracking-tighter">Sammy <span className="text-[#D946EF]">IA</span></h2>
                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Sua Agente de Vendas</p>
                            </div>
                        </div>
                        <button onClick={handleFinishSammyTraining} disabled={savingHub} className="bg-[#D946EF]/20 hover:bg-[#D946EF] text-[#D946EF] hover:text-white border border-[#D946EF]/50 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 active:scale-95">
                            {savingHub ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} 
                            <span className="hidden sm:inline">Finalizar Treinamento</span>
                            <span className="sm:hidden">Finalizar</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
                        {sammyMessages.map(m => (
                            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-4 text-sm rounded-2xl ${m.role === 'user' ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' : 'bg-gradient-to-br from-[#D946EF]/20 to-[#FF1493]/10 text-white rounded-tl-sm border border-[#D946EF]/30 shadow-lg'}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                </div>
                            </div>
                        ))}
                        {isSammyLoading && (
                            <div className="flex items-start">
                                <div className="bg-[#D946EF]/10 p-4 rounded-2xl rounded-tl-sm border border-[#D946EF]/20 flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin text-[#D946EF]"/> <span className="text-xs text-[#D946EF] font-black uppercase italic">Sammy está digitando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={sammyChatEndRef} />
                    </div>

                    <form onSubmit={handleSammySubmit} className="mt-4 pt-4 border-t border-white/5 relative z-10 flex gap-2">
                        <input value={sammyInput} onChange={(e) => setSammyInput(e.target.value)} placeholder="Converse com a Sammy..." className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-[#D946EF] transition-all"/>
                        <button type="submit" disabled={isSammyLoading || !sammyInput?.trim()} className="bg-gradient-to-r from-[#D946EF] to-[#FF1493] text-white w-14 rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">
                            <Send size={18} className="-ml-1"/>
                        </button>
                    </form>
                </div>
            </div>
        )}

        {activeTab === "marketing" && (
            <div className="animate-in fade-in space-y-6">
                <div className="bg-black border border-[#FFD700]/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <Key size={24} className="text-[#FFD700]"/>
                        <h2 className="text-xl font-black uppercase italic text-white">Seu Bot <span className="text-[#FFD700]">Exclusivo</span></h2>
                    </div>
                    <p className="text-xs text-white/60 mb-6 font-medium leading-relaxed max-w-2xl">
                        Vá no Telegram, pesquise por <b>@BotFather</b> e crie o seu Bot. Cole o <b>Token (API Key)</b> que ele te der aqui embaixo. É esse bot que vai entregar os prêmios no privado dos seus clientes de forma automática!
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <input 
                            type="text" 
                            placeholder="Cole seu Token aqui (Ex: 123456:AAAbbbCCC...)" 
                            value={tgToken} 
                            onChange={(e) => setTgToken(e.target.value)}
                            className="flex-1 w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs text-white outline-none focus:border-[#FFD700] transition-all"
                        />
                        <button 
                            onClick={handleSaveTgToken} 
                            disabled={savingToken}
                            className="w-full md:w-auto bg-[#FFD700] text-black px-8 py-5 rounded-2xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                        >
                            {savingToken ? <Loader2 size={16} className="animate-spin"/> : "Salvar Meu Bot"}
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#00f0ff]/30 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(0,240,255,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 rounded-full blur-[50px] pointer-events-none"></div>
                    
                    <h2 className="text-2xl font-black uppercase italic mb-2 text-white flex items-center gap-3"><Rocket size={24} className="text-[#00f0ff]"/> Disparador de <span className="text-[#00f0ff]">Iscas</span></h2>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-8">Envie a sua roleta com um botão mágico direto no seu Grupo Grátis.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-[#00f0ff] ml-2 flex items-center gap-1"><Users size={12}/> Link do Grupo</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: https://t.me/savanahof" 
                                    value={tgGroupId} onChange={(e) => setTgGroupId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#00f0ff] mt-2 transition-all" 
                                />
                                <p className="text-[8px] text-white/30 uppercase font-black mt-2 ml-2">⚠️ Você pode colar o link inteiro. Nós arrumamos pra você.</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-[#00f0ff] ml-2 mb-2 block">Textos de Alta Conversão</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => applyTemplate(1)} className="bg-white/5 hover:bg-[#00f0ff]/20 text-white/60 hover:text-[#00f0ff] border border-white/5 hover:border-[#00f0ff]/30 py-3 rounded-xl text-[9px] font-black uppercase transition-all">Lançamento</button>
                                    <button onClick={() => applyTemplate(2)} className="bg-white/5 hover:bg-[#00f0ff]/20 text-white/60 hover:text-[#00f0ff] border border-white/5 hover:border-[#00f0ff]/30 py-3 rounded-xl text-[9px] font-black uppercase transition-all">Madrugada</button>
                                    <button onClick={() => applyTemplate(3)} className="bg-white/5 hover:bg-[#00f0ff]/20 text-white/60 hover:text-[#00f0ff] border border-white/5 hover:border-[#00f0ff]/30 py-3 rounded-xl text-[9px] font-black uppercase transition-all">Sorteio Raro</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-[#00f0ff] ml-2 mb-2">Sua Mensagem</label>
                            <textarea 
                                value={tgMessage} onChange={(e) => setTgMessage(e.target.value)}
                                placeholder="Escreva a isca para os seus fãs..."
                                className="flex-1 w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-xs text-white outline-none focus:border-[#00f0ff] resize-none transition-all custom-scrollbar" 
                            />
                            
                            <button 
                                onClick={handleSendTelegramBroadcast} disabled={sendingTg}
                                className="w-full bg-[#00f0ff] text-black py-5 rounded-2xl font-black uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] flex justify-center items-center gap-2 mt-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sendingTg ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18}/> Disparar Roleta Agora</>}
                            </button>

                            {tgStatus && (
                                <div className={`p-4 rounded-xl text-[10px] font-black uppercase text-center mt-4 ${tgStatus.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {tgStatus}
                                </div>
                            )}
                        </div>
                    </div>
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
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => await onChooseGalleryFile(e)} />
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
                            <img src={item.url} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#FF1493]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price.toFixed(2)}`}</div>
                            
                            <div className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-3 flex items-center justify-between gap-2 border-t border-white/10">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadMediaStats(item); }} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#FF1493]/20 text-[#FF1493] rounded-xl hover:bg-[#FF1493] hover:text-white transition-colors text-[10px] font-black uppercase">
                                    <Eye size={14}/> Ver Infos
                                </button>
                                <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if(confirm("Apagar foto?")) { await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

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
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5"><img src={sale.Media?.url} loading="lazy" className="w-full h-full object-cover"/></div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase">Fã VIP</p>
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

        {activeTab === "vitrine" && (
            <div className="space-y-6 animate-in fade-in">
                
                {prizes.length === 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center animate-pulse">
                        <AlertTriangle size={40} className="text-red-500 mb-4" />
                        <h3 className="text-xl font-black uppercase text-red-500 mb-2">A Roleta está vazia!</h3>
                        <p className="text-sm font-bold text-white/60 mb-6 max-w-lg">Ocorreu um erro no primeiro carregamento ou você apagou as fatias. A roleta não vai funcionar sem fatias cadastradas. Clique no botão abaixo para restaurar o padrão.</p>
                        <button onClick={generateDefaultPrizes} className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">
                            Gerar Fatias Padrão Agora
                        </button>
                    </div>
                )}

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
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Foto Vitrine<input type="file" accept="image/*" onChange={async (e:any) => { const f=e.target.files?.[0]; if(f) { const comp = await compressImage(f); setSelectedProfileFile(comp); setProfilePreviewUrl(URL.createObjectURL(comp)); } }} className="hidden" /></label>
                        {selectedProfileFile && <button onClick={async () => { setUploading(true); const fn=`profile_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedProfileFile.type}, body:selectedProfileFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ profile_url: url }) }); setCurrentProfile(url); setSelectedProfileFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FFD700] text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Foto Vitrine</button>}
                    </div>
                    <div className="bg-black border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center">
                        <div className="w-full h-32 mb-4 bg-black/50 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative">
                            {(bgPreviewUrl || currentBg) ? <img src={(bgPreviewUrl || currentBg) as string} className="w-full h-full object-cover" /> : <ImageIcon className="text-white/10" size={32} />}
                            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                        </div>
                        <label className="w-full bg-white/5 border border-white/20 px-5 py-3 rounded-xl text-[10px] font-black uppercase cursor-pointer mb-2 hover:bg-white/10 transition-all">Escolher Fundo Roleta<input type="file" accept="image/*" onChange={async (e:any) => { const f=e.target.files?.[0]; if(f) { const comp = await compressImage(f); setSelectedBgFile(comp); setBgPreviewUrl(URL.createObjectURL(comp)); } }} className="hidden" /></label>
                        {selectedBgFile && <button onClick={async () => { setUploading(true); const fn=`bg_${modelId}_${Date.now()}.jpg`; await fetch(`${supabaseUrl}/storage/v1/object/assets/${fn}`, { method:"POST", headers:{apikey:supabaseKey!, Authorization:`Bearer ${supabaseKey}`, "Content-Type":selectedBgFile.type}, body:selectedBgFile }); const url=`${supabaseUrl}/storage/v1/object/public/assets/${fn}`; await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${modelId}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ bg_url: url }) }); setCurrentBg(url); setSelectedBgFile(null); setUploading(false); alert("Atualizado!"); }} className="w-full bg-[#FF1493] text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">Salvar Fundo Roleta</button>}
                    </div>
                </div>
                
                {prizes.length > 0 && (
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
                )}
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
                                    <input type="file" hidden accept="image/*" onChange={async (e) => await onChooseScratchFile(e)} disabled={scratchPhotos.length >= 10} />
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
                            <img src={item.photo_url} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                            <div className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md p-3 flex items-center justify-between border-t border-white/10">
                                <div className="flex items-center gap-2 text-[#FFD700] text-[10px] font-black uppercase"><Star size={12}/> Ativa</div>
                                <button onClick={async (e) => { e.stopPropagation(); if(confirm("Apagar foto?")) { await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }); loadData(); } }} className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    )) : <div className="col-span-full py-20 text-center text-white/20 italic font-black uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem]">Vazio.</div>}
                </div>
            </div>
        )}

        {activeTab === "followers" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] mb-12 shadow-2xl relative overflow-hidden">
                    <h2 className="text-xl font-black uppercase italic mb-6 text-[#FF1493] flex items-center gap-2"><Heart size={24}/> Seus Fãs VIPs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {followersList.length > 0 ? followersList.map((fan) => (
                            <div key={fan.id} className="bg-black border border-white/5 p-6 rounded-3xl flex items-center gap-4 shadow-lg hover:border-[#FF1493]/30 transition-all">
                                <div className="w-12 h-12 rounded-full bg-[#111] border border-[#FF1493]/30 flex items-center justify-center shrink-0">
                                    <User size={20} className="text-[#FF1493]"/>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-black uppercase text-white truncate">{fan.name || fan.nickname || "Fã VIP"}</p>
                                    <p className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">Fã da Musa</p>
                                </div>
                                <button onClick={() => setActiveTab("chat")} className="p-3 bg-white/5 rounded-xl hover:bg-[#FF1493] hover:text-white transition-all text-white/50"><MessageCircle size={16}/></button>
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center text-white/20 italic font-black uppercase border border-dashed border-white/5 rounded-3xl">Ninguém está te seguindo ainda. Divulgue seu link!</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === "chat" && (
            <div className="animate-in slide-in-from-bottom-4">
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem] shadow-xl">
                    <h2 className="text-lg font-black uppercase text-[#D946EF] mb-6 flex items-center gap-3 tracking-widest"><MessageCircle size={18}/> Conversas com Fãs</h2>
                    <div className="grid gap-4">
                        {chatList.length > 0 ? chatList.map(chat => (
                            <div key={chat.id} onClick={() => openAdminChat(chat)} className="bg-black border border-white/10 p-5 rounded-3xl cursor-pointer transition-all hover:border-[#D946EF]/50 flex items-center gap-4 group shadow-lg">
                                <div className="w-12 h-12 rounded-full bg-[#111] border border-[#D946EF]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                                    <User size={24} className="text-[#D946EF]"/>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-black uppercase text-white truncate">{chat.Players?.name || chat.Players?.nickname || "Fã VIP"}</p>
                                    <p className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">Tocar para abrir conversa</p>
                                </div>
                                <button className="bg-white/5 text-white/50 p-3 rounded-xl group-hover:bg-[#D946EF] group-hover:text-white transition-all"><MessageCircle size={16}/></button>
                            </div>
                        )) : <div className="p-12 text-center text-white/20 italic font-black uppercase border border-dashed border-white/5 rounded-3xl">Nenhum cliente iniciou chat.</div>}
                    </div>
                </div>
            </div>
        )}

        {activeTab === "players" && <PlayersManager modelId={modelId} isSuperAdmin={isSuper} />}

      </div>

      {/* -------------------- MODAIS E CAMADAS FLUTUANTES -------------------- */}

      {activeTab === "chat" && activeChat && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom-full duration-300">
              <div className="absolute inset-0 bg-black/60" onClick={() => setActiveChat(null)}></div>
              <div className="relative w-full max-w-lg h-[85vh] sm:h-[650px] bg-[#0a0a0a] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden z-10">
                  <div className="px-6 py-4 bg-black/50 border-b border-white/5 flex items-center justify-between backdrop-blur-md z-10 shadow-md">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#D946EF]/20 flex items-center justify-center border border-[#D946EF]/50">
                              <User size={16} className="text-[#D946EF]"/>
                          </div>
                          <h3 className="text-xs font-black uppercase text-white">{activeChat.Players?.name || activeChat.Players?.nickname || "Fã VIP"}</h3>
                      </div>
                      <button onClick={() => setActiveChat(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-black">
                      <div className="text-center py-2"><span className="px-3 py-1 bg-white/5 text-white/30 text-[9px] uppercase font-black tracking-widest rounded-full">Início da Conversa</span></div>
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender_type === 'model' ? 'items-end' : 'items-start'}`}>
                              {msg.is_gift ? (
                                  <div className="bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(245,158,11,0.2)] max-w-xs">
                                      <Gift size={32} className="text-amber-400 mb-2 animate-bounce"/>
                                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Você recebeu um presente!</p>
                                      <p className="text-2xl font-black text-white mt-1">R$ {msg.price?.toFixed(2)}</p>
                                      {msg.content && <p className="text-xs italic text-white/70 mt-2">"{msg.content}"</p>}
                                  </div>
                              ) : (
                                  <div className={`max-w-[75%] p-3 text-sm rounded-2xl ${msg.sender_type === 'model' ? 'bg-[#D946EF] text-white rounded-tr-sm shadow-md' : 'bg-white/10 text-white rounded-tl-sm border border-white/5'}`}>
                                      {msg.content && msg.media_type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                      {msg.media_type === 'audio' && msg.media_url && (
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 opacity-70"><Mic size={10}/> Mensagem de Voz</span>
                                              <audio controls src={msg.media_url} className="h-10 w-48 mt-1 outline-none" />
                                          </div>
                                      )}
                                      {(msg.media_type === 'image' || msg.media_type === 'video') && msg.media_url && (
                                          <div className="flex flex-col mt-1">
                                              <div className="relative rounded-xl overflow-hidden border border-white/20">
                                                  {msg.media_type === 'video' ? (
                                                      <video src={msg.media_url} controls className="max-h-60 w-full object-cover" />
                                                  ) : (
                                                      <img src={msg.media_url} className="max-h-60 w-full object-cover" />
                                                  )}
                                                  {msg.is_locked && (
                                                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                                                          <Lock size={10} className="text-[#FFD700]"/> R$ {msg.price?.toFixed(2)} 
                                                          <span className={msg.is_unlocked ? 'text-emerald-400 ml-1' : 'text-red-400 ml-1'}>
                                                              ({msg.is_unlocked ? 'PAGO' : 'AGUARDANDO'})
                                                          </span>
                                                      </div>
                                                  )}
                                              </div>
                                              {msg.content && <p className="mt-2 text-xs">{msg.content}</p>}
                                          </div>
                                      )}
                                  </div>
                              )}
                              <span className="text-[8px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-[#0a0a0a] border-t border-white/5 relative shadow-md z-20">
                      <div className="flex items-center gap-2 bg-black border border-white/10 rounded-full p-2 focus-within:border-[#D946EF]/50 transition-all">
                          <button onClick={() => document.getElementById('chat-media-upload')?.click()} className="p-2 text-white/40 hover:text-[#D946EF] transition-colors rounded-full shrink-0">
                              <ImagePlus size={20} />
                              <input id="chat-media-upload" type="file" hidden accept="image/*,video/*" onChange={async (e) => await onChooseChatMedia(e)} />
                          </button>
                          {isRecording ? (
                              <div className="flex-1 flex items-center gap-2 text-[#FF1493] px-3 font-mono font-black animate-pulse">
                                  <Mic size={16}/> Gravando... {formatAudioTime(recordingTime)}
                              </div>
                          ) : (
                              <input type="text" placeholder="Digite sua resposta..." className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30 px-2 py-1" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdminSendMessage()} />
                          )}
                          <button onMouseDown={isRecording ? stopRecording : startRecording} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                              {isRecording ? <Square size={16} className="fill-current"/> : <Mic size={18} />}
                          </button>
                          {!isRecording && (
                              <button onClick={() => handleAdminSendMessage()} disabled={!chatInput?.trim()} className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center shadow-lg disabled:opacity-50 hover:bg-[#f062ff] transition-all shrink-0">
                                  <Send size={16} className="-ml-0.5" />
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL DE ESTATÍSTICAS DA MÍDIA */}
      {showMediaStats && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-center p-4 animate-in fade-in zoom-in duration-300 gap-6">
              <button onClick={() => setShowMediaStats(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full border border-white/10 transition-colors z-[510]">
                  <X size={20}/>
              </button>
              
              <div className="relative w-full md:w-1/2 h-[40vh] md:h-[85vh] flex items-center justify-center">
                  <img src={showMediaStats.url || showMediaStats.photo_url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-white/5" />
              </div>
              
              <div className="w-full md:w-1/2 max-w-md bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col h-[50vh] md:h-[85vh] overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 shrink-0 flex flex-col items-center text-center">
                      <div className="flex items-center gap-2 mb-3 bg-[#FF1493]/10 border border-[#FF1493]/30 px-4 py-2 rounded-full">
                          <Heart size={16} fill="currentColor" className="text-[#FF1493]"/>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF1493]">{mediaLikes} Curtidas</span>
                      </div>
                      {showMediaStats.caption ? (
                          <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{showMediaStats.caption}"</p>
                      ) : (
                          <p className="text-xs italic text-white/40 font-medium">Sem legenda</p>
                      )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/50">
                      <h3 className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-4">Comentários dos Fãs</h3>
                      {mediaComments.length > 0 ? mediaComments.map(c => (
                          <div key={c.id} className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm relative group">
                              <span className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-1">{c.player_name || 'Fã VIP'}</span>
                              <p className="text-xs text-white/80 leading-relaxed pr-8">{c.content}</p>
                              <button onClick={() => handleDeleteComment(c.id)} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 bg-red-500/10 text-red-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={14}/>
                              </button>
                          </div>
                      )) : (
                          <p className="text-center text-white/30 text-xs italic font-medium mt-10">Nenhum comentário nesta foto ainda.</p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL DE ENVIAR MÍDIA NO CHAT (PPV OU GRÁTIS) */}
      {showMediaModal && chatMediaPreview && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl relative">
                  <button onClick={() => { setShowMediaModal(false); setChatMediaFile(null); setChatMediaPreview(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20}/></button>
                  <h2 className="text-lg font-black uppercase text-[#D946EF] mb-6 italic text-center">Enviar Mídia Privada</h2>
                  
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 mb-6 bg-black flex items-center justify-center">
                      {chatMediaFile?.type.startsWith('video/') ? (
                          <video src={chatMediaPreview} className="w-full h-full object-cover" controls />
                      ) : (
                          <img src={chatMediaPreview} className="w-full h-full object-cover" />
                      )}
                  </div>

                  <div className="space-y-6">
                      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 cursor-pointer" onClick={() => setIsChatMediaPaid(!isChatMediaPaid)}>
                          <div>
                              <p className="text-[10px] font-black uppercase text-white">Cobrar por essa mídia?</p>
                              <p className="text-[8px] text-white/50 uppercase font-bold mt-1">Se ativado, envia com cadeado (PPV).</p>
                          </div>
                          <input type="checkbox" checked={isChatMediaPaid} readOnly className="w-5 h-5 accent-[#D946EF]" />
                      </div>

                      {isChatMediaPaid && (
                          <div className="animate-in zoom-in">
                              <label className="text-[10px] font-black uppercase text-white/40 block ml-2 mb-2">Definir Valor (Mínimo R$ 10,00)</label>
                              <input 
                                  type="text" 
                                  value={formattedChatPrice} 
                                  onChange={handleChatPriceInput} 
                                  className="w-full bg-black border border-[#D946EF] rounded-full py-4 px-6 text-white font-black text-xl text-center outline-none" 
                              />
                          </div>
                      )}

                      <button onClick={handleSendChatMedia} disabled={uploading} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                          {uploading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                          {uploading ? "Enviando..." : "Enviar para o Cliente"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL EDITAR PRÊMIO */}
      {editingPrize && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <form onSubmit={async (e) => { 
              e.preventDefault(); 
              await fetch(`${supabaseUrl}/rest/v1/Prize?id=eq.${editingPrize.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: editingPrize.name, color: editingPrize.color, delivery_type: editingPrize.delivery_type, delivery_value: editingPrize.delivery_value }) });
              setEditingPrize(null); loadData();
          }} className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[3rem] w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button type="button" onClick={() => setEditingPrize(null)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={24}/></button>
            <h2 className="text-xl font-black uppercase mb-8 text-[#FF1493] italic text-center">Editar Slot</h2>
            <div className="space-y-4">
                
                <input type="text" value={editingPrize.name} onChange={e => setEditingPrize({...editingPrize, name: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white outline-none" />
                
                <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black uppercase text-white/40">Tipo de Entrega</p>
                    <select value={editingPrize.delivery_type || 'whatsapp'} onChange={e => setEditingPrize({...editingPrize, delivery_type: e.target.value, delivery_value: ''})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none cursor-pointer">
                        <option value="whatsapp">Suporte (WhatsApp Labz)</option>
                        <option value="link">Link Direto (Telegram/Drive)</option>
                        <option value="credit">Créditos de Giro</option>
                        <option value="media">Pack de Fotos/Vídeos (Galeria VIP)</option>
                    </select>
                </div>

                {/* 1. SE ELA ESCOLHER "LINK" */}
                {editingPrize.delivery_type === 'link' && (
                    <div className="bg-white/5 p-4 rounded-2xl animate-in fade-in space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/40">URL do Prêmio (Obrigatório)</p>
                        <input type="text" placeholder="https://t.me/..." value={editingPrize.delivery_value || ''} onChange={e => setEditingPrize({...editingPrize, delivery_value: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" required />
                    </div>
                )}

                {/* 2. SE ELA ESCOLHER "CREDIT" */}
                {editingPrize.delivery_type === 'credit' && (
                    <div className="bg-white/5 p-4 rounded-2xl animate-in fade-in space-y-2">
                        <p className="text-[10px] font-black uppercase text-white/40">Quantidade de Giros Extras</p>
                        <input type="number" min="1" max="3" placeholder="Ex: 2" value={editingPrize.delivery_value || ''} onChange={e => setEditingPrize({...editingPrize, delivery_value: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" required />
                        <p className="text-[8px] uppercase text-amber-500 font-bold mt-1 text-center">Máximo permitido: 3 créditos.</p>
                    </div>
                )}

                {/* 3. SE ELA ESCOLHER "WHATSAPP" (SUPORTE) */}
                {editingPrize.delivery_type === 'whatsapp' && (
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 animate-in fade-in text-center">
                        <MessageCircle size={20} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">O cliente será redirecionado para o WhatsApp da LabzSexy para resgatar este prêmio com o suporte.</p>
                    </div>
                )}

                {/* 4. SE ELA ESCOLHER "MEDIA" (UPLOAD) */}
                {editingPrize.delivery_type === 'media' && (
                    <div className="bg-white/5 p-4 rounded-2xl space-y-3 animate-in fade-in">
                        <p className="text-[10px] font-black uppercase text-white/40 flex justify-between">
                            Mídias do Prêmio (Máx 10) 
                            <span>{editingPrize.delivery_value ? editingPrize.delivery_value.split(',').filter(Boolean).length : 0}/10</span>
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(editingPrize.delivery_value ? editingPrize.delivery_value.split(',').filter(Boolean) : []).map((url: string, i: number) => (
                                <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 shadow-md">
                                    {url.includes('.mp4') ? <video src={url} className="w-full h-full object-cover"/> : <img src={url} className="w-full h-full object-cover"/>}
                                    <button type="button" onClick={() => {
                                        const newArr = editingPrize.delivery_value.split(',').filter(Boolean);
                                        newArr.splice(i, 1);
                                        setEditingPrize({...editingPrize, delivery_value: newArr.join(',')});
                                    }} className="absolute top-0 right-0 bg-red-500 p-0.5 rounded-bl-md"><X size={10}/></button>
                                </div>
                            ))}
                        </div>

                        <label className="w-full bg-[#D946EF]/20 text-[#D946EF] py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase cursor-pointer hover:bg-[#D946EF] hover:text-white transition-colors border border-[#D946EF]/30">
                            {uploadingSliceMedia ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                            {uploadingSliceMedia ? "Subindo..." : "Adicionar Fotos/Vídeos"}
                            <input type="file" multiple accept="image/*,video/*" onChange={async (e) => await handleSliceMediaUpload(e)} className="hidden" disabled={uploadingSliceMedia} />
                        </label>
                    </div>
                )}

                <button type="submit" disabled={uploadingSliceMedia} className="w-full bg-[#FF1493] text-white py-5 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-4">
                    Salvar Modificações
                </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TUTORIAL ROLETA */}
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
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF1493]" size={40} /></div>}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
