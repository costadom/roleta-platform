"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, 
  Wallet, User, MessageCircle, Send, Lock, Gift, Mic, Copy, CheckCircle, Bell, Radio
} from "lucide-react";

// Função de Censura
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
  forbiddenPatterns.forEach(pattern => { filteredText = filteredText.replace(pattern, " [⚠️ PROTEGIDO] "); });
  return filteredText;
};

export default function PlayerPersonalHub() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);
  const [associations, setAssociations] = useState<any[]>([]); 
  const [videoOrders, setVideoOrders] = useState<any[]>([]);
  const [unlockedGallery, setUnlockedGallery] = useState<any[]>([]);
  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const [chatOpen, setChatOpen] = useState(false);
  const [currentChatModel, setCurrentChatModel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedGift, setSelectedGift] = useState<number>(10);
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); 

  const [showAuthModal, setShowAuthModal] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleBellClick = () => {
      if (totalUnread > 0) alert(`Você tem ${totalUnread} mensagem(ns) nova(s) no chat!`);
      else alert("Nenhuma mensagem nova no momento.");
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
        const phone = localStorage.getItem("labz_player_phone");
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

        if (phone) setPlayerPhone(phone);

        const [pRes, mRes, cRes] = await Promise.all([
            phone ? fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=*`, { headers }) : Promise.resolve({ ok: true, json: () => [] }),
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (!pRes.ok) return;
        const pData = await pRes.json();
        const mData = await mRes.json();
        const cData = await cRes.json();

        const getInfo = (mId: string) => {
            const m = mData.find((x:any) => x.id === mId);
            const c = cData.find((x:any) => x.model_id === mId);
            return { slug: m?.slug, model_name: c?.model_name, profile_url: c?.profile_url, model_id: mId, live_status: m?.live_status };
        };

        let assocData = [];
        if (phone && pData.length > 0) {
            assocData = pData.map((p:any) => ({ ...p, modelInfo: getInfo(p.model_id) }));
        } else {
            assocData = mData.map((m: any) => ({ id: `sug_${m.id}`, model_id: m.id, credits: 0, modelInfo: getInfo(m.id) }));
        }
        setAssociations(assocData);

        if (phone && pData.length > 0) {
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
        }
      } catch (e) {} finally { setInitialLoading(false); }
    }
    loadData();
  }, [router, supabaseUrl, supabaseKey]);

  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (pixData && !paymentSuccess && pixTimeLeft > 0) timer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
  }, [pixData, paymentSuccess, pixTimeLeft]);

  const requireAuth = (callback: () => void) => {
    if (!playerPhone) setShowAuthModal(true); else callback();
  };

  const openChat = async (modelInfo: any, playerId: string) => {
      requireAuth(async () => {
          setCurrentChatModel({ ...modelInfo, player_id: playerId });
          setChatOpen(true);
          fetchChatMessages(modelInfo.model_id, playerId, true);
      });
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
            chatId = (await newChatRes.json())[0]?.id;
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

  const generatePix = async (value: number, msgId?: string, isGift = false, giftMsg = "") => {
      requireAuth(async () => {
          setGeneratingPix(true); setPixTimeLeft(600); 
          try {
              const playerId = currentChatModel?.player_id;
              if (!playerId) throw new Error("Erro de ID de jogador");

              const headersAuth = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
              await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
                method: 'POST', headers: headersAuth,
                body: JSON.stringify({ player_phone: playerPhone, model_name: `${currentChatModel.model_name} (${isGift ? 'Presente VIP' : 'Mídia Chat'})`, amount: value, status: 'pendente' })
              }).catch(() => {});

              const response = await fetch('/api/checkout/hub', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ amount: value, userId: playerId, type: isGift ? 'gift' : 'chat_media', modelId: currentChatModel.model_id, mediaId: msgId }),
              });
              const data = await response.json();

              if (!response.ok) throw new Error(data.error || "Erro API Pix");

              if (data.qr_code_base64 || data.qrCodeBase64) {
                  setPixData({ qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, txId: data.id || data.transaction_id, value: value, msgId: msgId, isGift: isGift, giftMsg: giftMsg });
                  if(isGift) setShowGiftModal(false); setShowPixModal(true);
              }
          } catch (error: any) { alert(`Falha: ${error.message}`); } finally { setGeneratingPix(false); }
      });
  };

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (pixData && !paymentSuccess) {
          interval = setInterval(async () => {
              try {
                  const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
                  if (pixData.msgId) {
                      const res = await fetch(`${supabaseUrl}/rest/v1/Messages?id=eq.${pixData.msgId}&select=is_unlocked`, { headers }).then(r=>r.json());
                      if (res && res[0]?.is_unlocked) {
                          clearInterval(interval); setPaymentSuccess(true);
                          setTimeout(() => { setShowPixModal(false); setPixData(null); setPaymentSuccess(false); fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, true); }, 2500);
                      }
                  } else if (pixData.isGift) {
                      const res = await fetch(`${supabaseUrl}/rest/v1/Transactions?model_id=eq.${currentChatModel?.model_id}&player_phone=eq.${encodeURIComponent(playerPhone || '')}&real_amount=eq.${pixData.value}&order=created_at.desc&limit=1`, { headers }).then(r=>r.json());
                      if (res && res.length > 0) {
                          clearInterval(interval); setPaymentSuccess(true);
                          setTimeout(() => { setShowPixModal(false); setPixData(null); setPaymentSuccess(false); fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, true); }, 2500);
                      }
                  }
              } catch(e) {}
          }, 4000); 
      }
      return () => clearInterval(interval);
  }, [pixData, paymentSuccess, currentChatModel, playerPhone, supabaseKey, supabaseUrl]);

  if (initialLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic animate-pulse tracking-widest">Acessando Vitrine...</h2></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white font-sans pb-24 relative">
      
      {/* MODAL DE LOGIN */}
      {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative text-center">
                  <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={20}/></button>
                  <div className="w-16 h-16 bg-[#D946EF]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><Lock size={28} className="text-[#D946EF]"/></div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Acesso Restrito</h2>
                  <p className="text-xs text-white/60 mb-8 leading-relaxed">Você precisa fazer login para acessar o painel completo, falar no chat ou jogar.</p>
                  <button onClick={() => router.push('/')} className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[11px] font-black uppercase shadow-[0_0_20px_rgba(217,70,239,0.4)]">Fazer Login ou Cadastro</button>
              </div>
          </div>
      )}

      {/* HEADER LIQUID GLASS */}
      <header className="sticky top-0 left-0 w-full h-20 bg-black/60 backdrop-blur-xl border-b border-white/10 z-[100] px-4 sm:px-6 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter drop-shadow-md">MEU <span className="text-white">HUB VIP</span></h1>
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">{playerPhone ? playerPhone : 'Modo Visitante'}</p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => router.push('/explore')} className="flex items-center gap-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-4 py-2 rounded-full hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <Radio size={14} className="animate-pulse" />
                  <span className="font-black text-[10px] uppercase tracking-widest hidden sm:block">Lives</span>
              </button>

              <div className="relative cursor-pointer hidden sm:block" onClick={handleBellClick}>
                  <Bell size={20} className={totalUnread > 0 ? "text-[#D946EF] animate-pulse" : "text-white/30"} />
                  {totalUnread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{totalUnread}</span>}
              </div>
              
              {playerPhone ? (
                 <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="hidden sm:block px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair</button>
              ) : (
                 <button onClick={() => router.push('/')} className="px-4 py-2 bg-[#D946EF] text-white rounded-full text-[10px] font-black uppercase shadow-[0_0_15px_rgba(217,70,239,0.4)]">Entrar</button>
              )}
          </div>
      </header>

      <main className={`max-w-6xl mx-auto p-4 sm:p-8 mt-6 transition-all ${chatOpen ? 'blur-sm brightness-50' : ''}`}>
        
        {/* GRID DE MODELOS MODERNIZADO */}
        <section className="mb-16">
            <h2 className="text-sm font-black uppercase text-white/60 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={16}/> Minhas Musas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => {
                    const unread = unreadCounts[assoc.modelInfo?.model_id] || 0;
                    const isOnline = assoc.modelInfo?.live_status === 'online' || assoc.modelInfo?.live_status === 'vip';
                    return (
                    <div key={assoc.id} className="bg-[#0a0a0a] border border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#D946EF]/50 transition-all min-h-[160px]">
                        
                        {isOnline && (
                           <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                               <span className={`w-2 h-2 rounded-full animate-pulse ${assoc.modelInfo.live_status === 'vip' ? 'bg-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,0.8)]' : 'bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`}></span>
                               <span className={`text-[8px] font-black uppercase tracking-widest ${assoc.modelInfo.live_status === 'vip' ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>{assoc.modelInfo.live_status === 'vip' ? 'VIP' : 'Ao Vivo'}</span>
                           </div>
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                                {assoc.modelInfo?.profile_url ? <img src={assoc.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-white/20 m-auto mt-4"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[#D946EF] uppercase tracking-widest mb-0.5 truncate">{assoc.modelInfo?.model_name || 'Musa VIP'}</p>
                                <h3 className="text-2xl font-black text-white tracking-tighter truncate">{playerPhone ? assoc.credits : '0'} CR</h3>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 relative z-10 pt-4 border-t border-white/5">
                            <button onClick={() => requireAuth(() => router.push(`/game/${assoc.modelInfo?.slug}`))} className="col-span-2 bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white py-3.5 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={16}/> Jogar e Ganhar</button>
                            <button onClick={() => openChat(assoc.modelInfo, assoc.id)} className="relative bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><MessageCircle size={14}/> Chat {unread > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0a0a] animate-bounce">{unread}</span>}</button>
                            <button onClick={() => requireAuth(() => router.push(`/profile/${assoc.modelInfo?.slug}`))} className="bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5 border border-transparent"><User size={14}/> Perfil</button>
                        </div>
                    </div>
                ) }) : <div className="py-12 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada.</div>}
            </div>
        </section>

        {/* RESTANTE DAS SEÇÕES (SÓ SE LOGADO) */}
        {playerPhone && (
            <>
            <section className="mb-16">
                <h2 className="text-sm font-black uppercase text-white/60 mb-6 flex items-center gap-3 tracking-widest"><Video size={16}/> Meus Vídeos</h2>
                <div className="grid gap-6">
                    {videoOrders.length > 0 ? videoOrders.map((req) => (
                        <div key={req.id} className="bg-[#0a0a0a] border border-white/10 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between gap-6 shadow-2xl relative overflow-hidden">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden shrink-0 hidden sm:block"><img src={req.modelInfo?.profile_url} className="w-full h-full object-cover"/></div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${req.status === 'pago' ? 'bg-blue-500/20 text-blue-400' : req.status === 'aceito' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{req.status}</span>
                                        <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Para: <span className="text-white">{req.modelInfo?.model_name}</span> • {req.duration} Min • R$ {req.price?.toFixed(2)}</div>
                                    </div>
                                </div>
                                <p className="text-sm italic text-white/70 leading-relaxed bg-white/5 p-4 rounded-xl">"{req.description}"</p>
                            </div>
                            <div className="min-w-[200px] flex flex-col justify-center">
                                {req.status === 'entregue' ? <a href={req.drive_link} target="_blank" className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[10px] font-black uppercase text-center shadow-lg"><Play size={16} className="inline mr-2"/> Acessar</a> : <div className="text-white/40 text-[10px] font-black uppercase text-center py-4 border border-dashed border-white/10 rounded-xl"><Loader2 size={14} className="animate-spin inline mr-2"/> Aguardando</div>}
                            </div>
                        </div>
                    )) : <div className="py-20 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-3xl">Nenhum pedido.</div>}
                </div>
            </section>
            </>
        )}
      </main>

      {/* MODAIS AQUI (Omitidos para brevidade, são os mesmos da versão anterior) */}
      
    </div>
  );
}
