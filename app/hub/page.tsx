"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, 
  Wallet, User, Image as ImageIcon, MessageCircle, Send, Lock, Gift, Mic, Copy, CheckCircle, Bell, Radio, Coins
} from "lucide-react";

// 🔥 FUNÇÃO DE CENSURA ANTI-FUGA 🔥
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
  forbiddenPatterns.forEach(pattern => {
    filteredText = filteredText.replace(pattern, " [⚠️ DADOS PROTEGIDOS] ");
  });
  return filteredText;
};

export default function PlayerPersonalHub() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);
  
  // Saldos e Associações
  const [associations, setAssociations] = useState<any[]>([]); 
  const [liveTokens, setLiveTokens] = useState<number>(0);
  const [initialTokensCheck, setInitialTokensCheck] = useState<number>(0);

  const [videoOrders, setVideoOrders] = useState<any[]>([]);
  const [unlockedGallery, setUnlockedGallery] = useState<any[]>([]);
  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  // Notificações
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [currentChatModel, setCurrentChatModel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sistema PIX Global (Chat, Mídia, Presentes e LiveTokens)
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; qrCodeCopiaCola: string; txId: string; value: number; type: string; msgId?: string; giftMsg?: string } | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number>(10);
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); 

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBellClick = () => {
      if (totalUnread > 0) {
          alert(`Você tem ${totalUnread} mensagem(ns) nova(s) no chat! Clique no botão de Chat das suas musas para ler.`);
      } else {
          alert("Nenhuma mensagem nova no momento.");
      }
  };

  const checkNotifications = async (playerIds: string[]) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          const cRes = await fetch(`${supabaseUrl}/rest/v1/Chats?player_id=in.(${playerIds.join(',')})&select=id,model_id`, { headers });
          if (!cRes.ok) return;
          const chats = await cRes.json();
          const chatIds = chats.map((c: any) => c.id);
          
          if (chatIds.length > 0) {
              const mRes = await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=in.(${chatIds.join(',')})&is_read=eq.false&sender_type=eq.model&select=chat_id`, { headers });
              if (mRes.ok) {
                  const unreadMsgs = await mRes.json();
                  const counts: Record<string, number> = {};
                  unreadMsgs.forEach((msg: any) => {
                      const chat = chats.find((c: any) => c.id === msg.chat_id);
                      if (chat) counts[chat.model_id] = (counts[chat.model_id] || 0) + 1;
                  });
                  setUnreadCounts(counts);
              }
          }
      } catch (e) {}
  };

  useEffect(() => {
    async function loadData() {
      try {
        const logged = localStorage.getItem("labz_player_logged") === "true";
        const phone = localStorage.getItem("labz_player_phone");
        if (!logged || !phone) { router.push('/'); return; }
        setPlayerPhone(phone);

        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        const [pRes, mRes, cRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (!pRes.ok) return;
        const pData = await pRes.json();
        const mData = await mRes.json();
        const cData = await cRes.json();

        // Pega o saldo global de lives (Basta pegar da primeira linha do player)
        if (pData.length > 0) {
            setLiveTokens(pData[0].live_tokens || 0);
        }

        const getInfo = (mId: string) => {
            const m = mData.find((x:any) => x.id === mId);
            const c = cData.find((x:any) => x.model_id === mId);
            return { slug: m?.slug, model_name: c?.model_name, profile_url: c?.profile_url, model_id: mId, live_status: m?.live_status };
        };

        // Associações Reais (Apenas onde ele tem conta)
        const assocData = pData.map((p:any) => ({ ...p, modelInfo: getInfo(p.model_id) })).filter((p:any) => p.modelInfo.model_name);
        setAssociations(assocData);

        const ids = pData.map((p:any) => p.id).filter((id:any) => id && id.length > 20);

        if (ids.length > 0) {
            checkNotifications(ids); 
            setInterval(() => checkNotifications(ids), 10000); 

            const [vRes, uRes] = await Promise.all([
                fetch(`${supabaseUrl}/rest/v1/VideoRequests?player_id=in.(${ids.join(',')})&select=*`, { headers }),
                fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=in.(${ids.join(',')})&select=*`, { headers })
            ]);

            let vData = vRes.ok ? await vRes.json() : [];
            let uData = uRes.ok ? await uRes.json() : [];

            setVideoOrders(vData.map((v:any) => ({ ...v, modelInfo: getInfo(v.model_id) })).filter((v:any) => v.status !== 'pendente'));

            const mIds = uData.map((u:any) => u.media_id).filter(Boolean);
            if (mIds.length > 0) {
                const mediaRes = await fetch(`${supabaseUrl}/rest/v1/Media?id=in.(${mIds.join(',')})&select=*`, { headers });
                const mediaData = await mediaRes.json();
                setUnlockedGallery(uData.map((u:any) => {
                    const mObj = mediaData.find((mx:any) => mx.id === u.media_id);
                    return mObj ? { ...u, Media: { ...mObj, modelInfo: getInfo(mObj.model_id) } } : null;
                }).filter(Boolean));
            }
        }
      } catch (e) { console.error("Erro Hub:", e); } finally { setInitialLoading(false); }
    }
    loadData();
  }, [router, supabaseUrl, supabaseKey]);

  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (pixData && !paymentSuccess && pixTimeLeft > 0) {
        timer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
      }
      return () => clearInterval(timer);
  }, [pixData, paymentSuccess, pixTimeLeft]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  // 🔥 LÓGICA DO CHAT 🔥
  const openChat = async (modelInfo: any, playerId: string) => {
      setCurrentChatModel({ ...modelInfo, player_id: playerId });
      setChatOpen(true);
      fetchChatMessages(modelInfo.model_id, playerId, true);
  };

  const fetchChatMessages = async (modelId: string, playerId: string, isFirstLoad = false) => {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        const chatRes = await fetch(`${supabaseUrl}/rest/v1/Chats?model_id=eq.${modelId}&player_id=eq.${playerId}`, { headers });
        const chatData = await chatRes.json();
        let chatId = "";

        if (chatData.length > 0) {
            chatId = chatData[0].id;
            const msgRes = await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=eq.${chatId}&order=created_at.asc`, { headers });
            if (msgRes.ok) {
                const msgs = await msgRes.json();
                setMessages(msgs);
                
                const unread = msgs.filter((m:any) => m.sender_type === 'model' && !m.is_read);
                if (unread.length > 0) {
                    setUnreadCounts(prev => ({ ...prev, [modelId]: 0 }));
                    await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=eq.${chatId}&sender_type=eq.model&is_read=eq.false`, {
                        method: 'PATCH', headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true })
                    });
                }
            }
        } else {
            const newChatRes = await fetch(`${supabaseUrl}/rest/v1/Chats`, {
                method: 'POST', headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
                body: JSON.stringify({ model_id: modelId, player_id: playerId })
            });
            const newChatData = await newChatRes.json();
            if(newChatData[0]) chatId = newChatData[0].id;
        }

        setCurrentChatModel((prev: any) => ({ ...prev, chat_id: chatId }));
        if(isFirstLoad) setTimeout(scrollToBottom, 100);
      } catch (e) {}
  };

  useEffect(() => {
      let interval: any;
      if (chatOpen && currentChatModel?.model_id && currentChatModel?.player_id) {
          interval = setInterval(() => { fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, false); }, 4000);
      }
      return () => clearInterval(interval);
  }, [chatOpen, currentChatModel]);

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !currentChatModel?.chat_id) return;
      const censoredText = censorText(newMessage); 
      const msgObj = { chat_id: currentChatModel.chat_id, sender_type: 'player', content: censoredText, media_type: 'text', created_at: new Date().toISOString() };
      setMessages(prev => [...prev, msgObj]); setNewMessage(""); setTimeout(scrollToBottom, 100);

      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          await fetch(`${supabaseUrl}/rest/v1/Messages`, { method: 'POST', headers, body: JSON.stringify(msgObj) });
          await fetch(`${supabaseUrl}/rest/v1/Chats?id=eq.${currentChatModel.chat_id}`, { method: 'PATCH', headers, body: JSON.stringify({ updated_at: new Date().toISOString() }) });
      } catch(e) {}
  };

  // 🔥 GERADOR UNIVERSAL DE PIX (LIVETOKENS, PRESENTES E MÍDIA) 🔥
  const generatePix = async (value: number, type: 'live_tokens' | 'gift' | 'chat_media', msgId?: string, giftMsg = "") => {
      setGeneratingPix(true);
      setPixTimeLeft(600); 
      try {
          const headersAuth = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
          let playerIdToUse = null;

          // Se for LiveTokens, pega qualquer ID do jogador. Se for chat, tem que ser o ID daquela sala.
          if (type === 'live_tokens') {
              const pRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone!)}&select=id`, { headers: headersAuth });
              playerIdToUse = (await pRes.json())[0]?.id;
          } else {
              playerIdToUse = currentChatModel?.player_id;
              await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
                method: 'POST', headers: headersAuth,
                body: JSON.stringify({ player_phone: playerPhone, model_name: `${currentChatModel.model_name} (${type})`, amount: value, status: 'pendente' })
              }).catch(() => {});
          }

          if (!playerIdToUse) throw new Error("Erro de ID de jogador");

          const response = await fetch('/api/checkout/hub', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  amount: value, 
                  userId: playerIdToUse,
                  type: type,
                  modelId: currentChatModel?.model_id, // Pode ser null pra LiveTokens globais
                  mediaId: msgId 
              }),
          });
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Erro API Pix");

          if (data.qr_code_base64 || data.qrCodeBase64) {
              setPixData({ 
                  qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, 
                  qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, 
                  txId: data.id || data.transaction_id,
                  value: value,
                  type: type,
                  msgId: msgId,
                  giftMsg: giftMsg
              });
              if(type === 'live_tokens') { setInitialTokensCheck(liveTokens); setShowShopModal(false); }
              if(type === 'gift') setShowGiftModal(false);
              setShowPixModal(true);
          }
      } catch (error: any) { alert(`Falha: ${error.message}`); } finally { setGeneratingPix(false); }
  };

  // 🔥 POLLING DE PIX (Múltiplas Frentes) 🔥
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (pixData && !paymentSuccess && playerPhone) {
          interval = setInterval(async () => {
              try {
                  const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
                  
                  // Verifica Mídia do Chat
                  if (pixData.type === 'chat_media' && pixData.msgId) {
                      const res = await fetch(`${supabaseUrl}/rest/v1/Messages?id=eq.${pixData.msgId}&select=is_unlocked`, { headers });
                      const data = await res.json();
                      if (data && data[0]?.is_unlocked) {
                          clearInterval(interval); setPaymentSuccess(true);
                          setTimeout(() => { setShowPixModal(false); setPixData(null); setPaymentSuccess(false); fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, true); }, 2500);
                      }
                  } 
                  // Verifica Presente VIP
                  else if (pixData.type === 'gift') {
                      const res = await fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${currentChatModel?.model_id}&player_phone=eq.${encodeURIComponent(playerPhone)}&real_amount=eq.${pixData.value}&order=created_at.desc&limit=1`, { headers });
                      const data = await res.json();
                      if (data && data.length > 0) {
                          clearInterval(interval); setPaymentSuccess(true);
                          setTimeout(() => { setShowPixModal(false); setPixData(null); setPaymentSuccess(false); fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, true); }, 2500);
                      }
                  }
                  // Verifica Compra de LiveTokens
                  else if (pixData.type === 'live_tokens') {
                      const res = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone)}&select=live_tokens`, { headers });
                      const data = await res.json();
                      const currentTokens = data[0]?.live_tokens || 0;
                      if (currentTokens > initialTokensCheck) {
                          setLiveTokens(currentTokens);
                          clearInterval(interval); setPaymentSuccess(true);
                          setTimeout(() => { setShowPixModal(false); setPixData(null); setPaymentSuccess(false); }, 3000);
                      }
                  }
              } catch(e) {}
          }, 4000); 
      }
      return () => clearInterval(interval);
  }, [pixData, paymentSuccess, currentChatModel, playerPhone, initialTokensCheck, supabaseUrl, supabaseKey]);

  const handleCopyPix = () => {
      if (pixData?.qrCodeCopiaCola) { navigator.clipboard.writeText(pixData.qrCodeCopiaCola); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (initialLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Acessando Universo Privado...</h2></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white font-sans pb-24 relative overflow-x-hidden">
      
      {/* HEADER LIQUID GLASS DA LABZSEXY */}
      <header className="fixed top-0 left-0 w-full h-20 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 z-[100] px-4 sm:px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
             <button onClick={() => router.push('/vitrine')} className="p-2 sm:p-3 bg-white/5 rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all mr-2"><ArrowLeft size={18}/></button>
             <div className="flex flex-col">
                 <h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter drop-shadow-md">MEU <span className="text-white">HUB VIP</span></h1>
                 <p className="text-[9px] text-white/40 uppercase font-black tracking-widest hidden sm:block">LabzSexy • Área Restrita</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
              
              {/* 🔥 BOTÃO DE COMPRAR LIVETOKENS GLOBAL 🔥 */}
              <button onClick={() => setShowShopModal(true)} className="flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-3 sm:px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:bg-[#00f0ff] hover:text-black transition-all group">
                 <Radio size={14} className="text-[#00f0ff] group-hover:text-black animate-pulse" />
                 <div className="flex flex-col items-start">
                     <span className="font-black text-[10px] sm:text-xs leading-none">{liveTokens.toFixed(2).replace('.', ',')} LT</span>
                     <span className="text-[7px] font-black uppercase tracking-widest opacity-70 leading-none">Compre Tokens de Lives</span>
                 </div>
              </button>

              <div className="relative cursor-pointer hidden sm:block bg-white/5 p-2.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors" onClick={handleBellClick}>
                  <Bell size={18} className={totalUnread > 0 ? "text-[#D946EF] animate-pulse" : "text-white/50"} />
                  {totalUnread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{totalUnread}</span>}
              </div>
              
              <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[9px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
          </div>
      </header>

      <main className={`max-w-7xl mx-auto p-4 sm:p-8 mt-28 transition-all ${chatOpen ? 'blur-sm brightness-50' : ''}`}>
        
        <section className="mb-16">
            <h2 className="text-sm font-black uppercase text-white/50 mb-6 flex items-center gap-3 tracking-widest pl-2"><Wallet size={18} className="text-[#D946EF]"/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => {
                    const unread = unreadCounts[assoc.modelInfo?.model_id] || 0;
                    const isOnline = assoc.modelInfo?.live_status === 'online' || assoc.modelInfo?.live_status === 'vip';

                    return (
                    <div key={assoc.id} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#D946EF]/40 transition-all min-h-[160px]">
                        
                        {/* 🔥 BOLINHA DE STATUS AO VIVO 🔥 */}
                        {isOnline && (
                           <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                               <span className={`w-2 h-2 rounded-full animate-pulse ${assoc.modelInfo.live_status === 'vip' ? 'bg-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,0.8)]' : 'bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`}></span>
                               <span className={`text-[8px] font-black uppercase tracking-widest ${assoc.modelInfo.live_status === 'vip' ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>{assoc.modelInfo.live_status === 'vip' ? 'VIP' : 'Ao Vivo'}</span>
                           </div>
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 flex items-center justify-center bg-black/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                                {assoc.modelInfo?.profile_url ? <img src={assoc.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-[#D946EF]"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-[#D946EF] uppercase tracking-widest mb-1 truncate">{assoc.modelInfo?.model_name}</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter truncate drop-shadow-md">{assoc.credits} CR</h3>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 relative z-10 pt-4 border-t border-white/10">
                            <button onClick={() => router.push(`/game/${assoc.modelInfo?.slug}`)} className="col-span-2 bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white border-none py-4 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Gamepad2 size={16}/> Jogar Roleta</button>
                            <button onClick={() => openChat(assoc.modelInfo, assoc.id)} className="relative bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><MessageCircle size={14}/> Chat {unread > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0a0a] animate-bounce">{unread}</span>}</button>
                            <button onClick={() => router.push(`/profile/${assoc.modelInfo?.slug}`)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub Vip</button>
                        </div>
                    </div>
                ) }) : <div className="py-24 text-center text-white/20 italic font-black uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem] col-span-full">Nenhuma musa associada ainda.</div>}
            </div>
        </section>

        <section className="mb-16">
            <h2 className="text-sm font-black uppercase text-white/50 mb-6 flex items-center gap-3 tracking-widest pl-2"><Video size={18} className="text-[#D946EF]"/> Vídeos Encomendados</h2>
            <div className="grid gap-6">
                {videoOrders.length > 0 ? videoOrders.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[3rem] flex flex-col md:flex-row justify-between gap-6 shadow-2xl relative overflow-hidden group hover:border-[#D946EF]/30 transition-all">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden shrink-0 hidden sm:flex items-center justify-center bg-white/5 shadow-inner">
                                    {req.modelInfo?.profile_url ? <img src={req.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-white/30"/>}
                                </div>
                                <div>
                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase mb-1 inline-block border ${req.status === 'pago' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : req.status === 'aceito' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : req.status === 'entregue' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                        {req.status === 'pago' ? 'Aguardando Musa' : req.status === 'aceito' ? 'Em Produção' : req.status === 'recusado' ? 'Recusado' : 'Entregue!'}
                                    </span>
                                    <div className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Para: <span className="text-white">{req.modelInfo?.model_name}</span> • {req.duration} Min • R$ {req.price?.toFixed(2)}</div>
                                </div>
                            </div>
                            <p className="text-sm italic text-white/70 leading-relaxed font-medium bg-white/5 border border-white/10 p-5 rounded-2xl">"{req.description}"</p>
                        </div>
                        <div className="min-w-[220px] flex flex-col justify-center gap-3">
                            {req.status === 'entregue' ? <a href={req.drive_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#D946EF] text-white py-5 rounded-2xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-all flex items-center justify-center gap-2"><Play size={16} fill="currentColor"/> Assistir Agora</a> : <div className="text-white/40 text-[10px] font-black uppercase text-center py-5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Aguardando Entrega</div>}
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/20 italic font-black uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem]">Nenhum vídeo encomendado.</div>}
            </div>
        </section>

        <section className="mb-12">
            <h2 className="text-sm font-black uppercase text-white/50 mb-6 flex items-center gap-3 tracking-widest pl-2"><Camera size={18} className="text-[#D946EF]"/> Coleção VIP</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {unlockedGallery.length > 0 ? unlockedGallery.map((item: any) => (
                    <div key={item.id} onClick={() => { setViewingMedia(item.Media); setLiked(false); }} className="flex flex-col gap-3 group cursor-pointer">
                        <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl group-hover:border-[#D946EF]/50 transition-all">
                            <img src={item.Media?.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 border border-white/10 shadow-lg"><User size={10} className="text-[#D946EF]"/> {item.Media?.modelInfo?.model_name}</div>
                        </div>
                    </div>
                )) : <div className="py-24 text-center text-white/20 italic font-black uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem] col-span-full">Sua galeria está vazia.</div>}
            </div>
        </section>
      </main>

      {/* LOJA DE LIVETOKENS (MODAL) */}
      {showShopModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[500] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/5 border border-white/10 p-3 rounded-full"><X size={18} /></button>
          
          <div className="w-20 h-20 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
              <Coins size={36} className="text-[#00f0ff]" />
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Tokens de <span className="text-[#00f0ff]">Lives</span></h2>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed max-w-sm">Adicione saldo para assistir shows privados e enviar presentes ao vivo.</p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => generatePix(pkg.p, 'live_tokens')} disabled={generatingPix} className="flex items-center justify-between bg-[#0a0a0a] border border-white/10 p-5 rounded-[2rem] hover:border-[#00f0ff]/50 transition-all shadow-xl disabled:opacity-50 group">
                <span className="text-white font-black uppercase text-sm tracking-widest group-hover:text-[#00f0ff] transition-colors">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-5 py-2 rounded-xl font-black text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)]">{generatingPix ? <Loader2 size={14} className="animate-spin" /> : `${pkg.p} LT (R$ ${pkg.p})`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PIX BLINDADO (Serve para tudo) */}
      {showPixModal && pixData && (
          <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 sm:p-10 rounded-[3.5rem] w-full max-w-md shadow-2xl relative text-center">
                  {!paymentSuccess && <button onClick={() => { setShowPixModal(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white bg-white/5 border border-white/10 p-2 rounded-full"><X size={16}/></button>}
                  
                  {paymentSuccess ? (
                      <div className="py-10 animate-in zoom-in duration-500">
                          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]"><CheckCircle size={50} className="text-black"/></div>
                          <h2 className="text-3xl font-black uppercase italic text-emerald-500 mb-2">Pago!</h2>
                          <p className="text-[10px] text-white/60 uppercase font-black tracking-widest">{pixData.type === 'live_tokens' ? 'Tokens Adicionados.' : pixData.type === 'gift' ? 'Presente Enviado.' : 'Mídia Desbloqueada.'}</p>
                      </div>
                  ) : (
                      <>
                          <h2 className={`text-2xl font-black uppercase italic mb-6 ${pixData.type === 'live_tokens' ? 'text-[#00f0ff]' : 'text-[#D946EF]'}`}>Pagamento VIP</h2>
                          <div className="bg-white p-4 rounded-[2rem] mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                              {generatingPix ? <Loader2 className="animate-spin text-black" size={30} /> : <img src={pixData.qrCodeBase64.includes('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} className="w-full h-full object-contain rounded-xl" />}
                          </div>
                          <p className="text-3xl font-black text-white mb-6">R$ {pixData.value.toFixed(2)}</p>
                          <div className={`mb-6 flex items-center justify-center gap-2 font-black font-mono text-xl animate-pulse ${pixData.type === 'live_tokens' ? 'text-[#00f0ff]' : 'text-[#FFD700]'}`}>⏱ {formatTime(pixTimeLeft)}</div>
                          <button onClick={handleCopyPix} className={`w-full flex items-center justify-center gap-3 text-white py-5 rounded-2xl font-black uppercase text-xs mb-4 shadow-2xl transition-all active:scale-95 ${pixData.type === 'live_tokens' ? 'bg-[#00f0ff] text-black shadow-[#00f0ff]/30' : 'bg-[#D946EF] shadow-[#D946EF]/30'}`}>
                              {copied ? <CheckCircle size={18} className="text-black" /> : <Copy size={18} />} {copied ? "Copiado!" : "Copiar Código PIX"}
                          </button>
                          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-center gap-3">
                              <Loader2 size={16} className={`animate-spin ${pixData.type === 'live_tokens' ? 'text-[#00f0ff]' : 'text-[#D946EF]'}`} />
                              <span className={`text-[9px] uppercase font-black tracking-widest ${pixData.type === 'live_tokens' ? 'text-[#00f0ff]' : 'text-[#D946EF]'}`}>Aguardando Sistema...</span>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* MODAL DE CHAT VIP */}
      {chatOpen && currentChatModel && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setChatOpen(false)}></div>
              <div className="relative w-full max-w-lg h-[85vh] sm:h-[700px] bg-[#0a0a0a] border border-white/10 sm:rounded-[3rem] rounded-t-[3rem] flex flex-col shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-10 duration-300">
                  <div className="px-6 py-5 bg-[#0a0a0a]/90 border-b border-white/5 flex items-center justify-between backdrop-blur-xl z-20">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D946EF]/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]"><img src={currentChatModel.profile_url} className="w-full h-full object-cover" /></div>
                          <div>
                              <p className="text-sm font-black text-white uppercase tracking-widest">{currentChatModel.model_name}</p>
                              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Chat Seguro</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <button onClick={() => setShowGiftModal(true)} className="p-3 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500 hover:text-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"><Gift size={18}/></button>
                          <button onClick={() => setChatOpen(false)} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#050505] to-[#0a0a0a] custom-scrollbar">
                      {messages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender_type === 'player' ? 'items-end' : 'items-start'}`}>
                              {msg.is_gift ? (
                                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-700/20 border border-amber-500/30 p-5 rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(245,158,11,0.15)] max-w-[80%] backdrop-blur-md">
                                      <Gift size={36} className="text-amber-400 mb-3 drop-shadow-md"/>
                                      <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest">Presente VIP</p>
                                      <p className="text-2xl font-black text-white mt-1 mb-2">R$ {msg.price?.toFixed(2)}</p>
                                      {msg.content && <p className="text-xs text-white/80 italic font-medium">"{msg.content}"</p>}
                                  </div>
                              ) : (
                                  <div className={`max-w-[85%] p-4 text-sm rounded-3xl shadow-lg ${msg.sender_type === 'player' ? 'bg-gradient-to-br from-[#D946EF] to-[#a832b8] text-white rounded-tr-sm' : 'bg-white/5 backdrop-blur-md text-white rounded-tl-sm border border-white/10'}`}>
                                      {msg.content && msg.media_type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                      {msg.media_type === 'audio' && msg.media_url && (<div className="flex flex-col gap-2"><span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 opacity-70"><Mic size={12}/> Áudio Exclusivo</span><audio controls src={msg.media_url} className="h-10 w-48 outline-none" /></div>)}
                                      {(msg.media_type === 'image' || msg.media_type === 'video') && msg.media_url && (
                                          <div className="mt-2">
                                              {msg.is_locked && !msg.is_unlocked ? (
                                                  <div onClick={() => generatePix(msg.price, 'chat_media', msg.id)} className="relative aspect-square w-48 sm:w-56 rounded-2xl overflow-hidden border border-[#D946EF]/50 bg-black flex flex-col items-center justify-center text-center cursor-pointer group shadow-xl hover:border-[#D946EF] transition-all">
                                                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=400&q=80')] bg-cover opacity-20 group-hover:scale-110 transition-transform duration-700"></div>
                                                      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl group-hover:backdrop-blur-lg transition-all"></div>
                                                      <Lock size={32} className="text-[#D946EF] relative z-10 mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                                                      <p className="text-[10px] font-black uppercase text-white relative z-10 tracking-widest mb-3">Mídia Trancada</p>
                                                      <button className="relative z-10 bg-[#D946EF] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(217,70,239,0.4)]">Desbloquear R$ {msg.price?.toFixed(2)}</button>
                                                  </div>
                                              ) : (
                                                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 p-1">
                                                      {msg.media_type === 'video' ? <video src={msg.media_url} controls className="max-h-64 w-full object-cover rounded-xl" /> : <img src={msg.media_url} onClick={() => setViewingMedia({ url: msg.media_url, caption: msg.content, modelInfo: currentChatModel })} className="max-h-64 w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity" />}
                                                      {msg.is_unlocked && <div className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase p-2 mt-1 rounded-lg text-center flex items-center justify-center gap-1.5"><CheckCircle size={12}/> Comprado</div>}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              )}
                              <span className="text-[8px] text-white/30 mt-1.5 px-2 font-bold uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>

                  <div className="p-5 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1.5 pl-5 focus-within:border-[#D946EF]/50 focus-within:bg-white/10 transition-all shadow-inner">
                          <input type="text" placeholder="Digite sua mensagem VIP..." className="flex-1 bg-transparent border-none text-sm text-white outline-none placeholder:text-white/30 py-2" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/>
                          <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:scale-100"><Send size={18} className="-ml-0.5" /></button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL PRESENTE */}
      {showGiftModal && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-[#0a0a0a] border border-amber-500/30 p-8 rounded-[3rem] w-full max-w-md shadow-2xl relative">
                  <button onClick={() => setShowGiftModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white bg-white/5 p-2 rounded-full border border-white/10"><X size={16}/></button>
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                          <Gift size={36} className="text-amber-500"/>
                      </div>
                      <h2 className="text-2xl font-black uppercase text-white italic tracking-tighter">Mimar a <span className="text-amber-500">Musa</span></h2>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest mt-2">Envie um presente na hora para o chat</p>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          {[ { name: "Beijo Doce 💋", value: 10 }, { name: "Drink Especial 🍸", value: 30 }, { name: "Lingerie Nova 👙", value: 50 }, { name: "Patrocínio VIP 👑", value: 150 } ].map((gift) => (
                              <button key={gift.value} onClick={() => setSelectedGift(gift.value)} className={`p-4 rounded-3xl border flex flex-col items-center justify-center text-center transition-all ${selectedGift === gift.value ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-105' : 'bg-black/50 border-white/10 text-white/50 hover:border-amber-500/50 hover:bg-amber-500/5'}`}>
                                  <span className="text-[10px] font-black uppercase mb-2 tracking-widest">{gift.name}</span>
                                  <span className="text-lg font-black">R$ {gift.value},00</span>
                              </button>
                          ))}
                      </div>
                      <input type="text" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Deixe uma mensagem (opcional)..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500 focus:bg-white/10 transition-all placeholder:text-white/30" />
                      <button onClick={() => generatePix(selectedGift, 'gift', undefined, giftMessage)} disabled={generatingPix} className="w-full bg-amber-500 text-black py-6 rounded-2xl font-black uppercase text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-amber-400 mt-2">
                          {generatingPix ? <Loader2 className="animate-spin" size={18}/> : <><Gift size={18}/> Enviar Presente VIP</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* VIEWING MEDIA MODAL */}
      {viewingMedia && (
          <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full border border-white/10 transition-colors z-[310]"><X size={20}/></button>
             <div className="relative max-w-3xl w-full h-[65vh] sm:h-[75vh] flex items-center justify-center mb-8">
                 <img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-white/5" />
             </div>
             <div className="flex flex-col items-center gap-5 text-center max-w-md w-full bg-black/50 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                <button onClick={() => setLiked(!liked)} className={`p-4 rounded-full transition-all shadow-2xl border ${liked ? 'bg-red-500 text-white border-red-400 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                    <Heart size={28} fill={liked ? "currentColor" : "none"} />
                </button>
                <div>
                    <p className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><ShieldCheck size={12}/> {viewingMedia.modelInfo?.model_name}</p>
                    <p className="text-sm italic text-white/90 leading-relaxed font-medium">"{viewingMedia.caption}"</p>
                </div>
             </div>
          </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
