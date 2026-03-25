"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, Clock, 
  Wallet, HelpCircle, Heart, User, Image as ImageIcon, MessageCircle, Send, Lock, Gift, Mic, Copy, CheckCircle, Bell
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
  const [pixData, setPixData] = useState<{ qrcode: string; qrcodeUrl: string; value: number; msgId?: string; isGift?: boolean; giftMsg?: string } | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [copied, setCopied] = useState(false);

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
      } catch (e) { console.error(e); }
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

        const getInfo = (mId: string) => {
            const m = mData.find((x:any) => x.id === mId);
            const c = cData.find((x:any) => x.model_id === mId);
            return { slug: m?.slug, model_name: c?.model_name, profile_url: c?.profile_url, model_id: mId };
        };

        const assocData = pData.map((p:any) => ({ ...p, modelInfo: getInfo(p.model_id) }));
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
  }, [router]);

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
      } catch (e) { console.error("Erro Chat", e); }
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
      const msgObj = {
          chat_id: currentChatModel.chat_id,
          sender_type: 'player',
          content: censoredText,
          media_type: 'text',
          created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, msgObj]);
      setNewMessage("");
      setTimeout(scrollToBottom, 100);

      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          await fetch(`${supabaseUrl}/rest/v1/Messages`, { method: 'POST', headers, body: JSON.stringify(msgObj) });
          await fetch(`${supabaseUrl}/rest/v1/Chats?id=eq.${currentChatModel.chat_id}`, { method: 'PATCH', headers, body: JSON.stringify({ updated_at: new Date().toISOString() }) });
      } catch(e) { console.error("Erro envio", e) }
  };

  const handleGiftPriceInput = (e: any) => { setGiftAmount(e.target.value.replace(/\D/g, "")); };
  const formattedGiftAmount = useMemo(() => { return (Number(giftAmount) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }, [giftAmount]);

  const generatePix = async (value: number, msgId?: string, isGift = false, giftMsg = "") => {
      setGeneratingPix(true);
      try {
          const response = await fetch('/api/checkout/pix', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: value, description: isGift ? `Presente VIP LabzSexy` : `Desbloqueio de Mídia VIP` }),
          });
          
          if (!response.ok) throw new Error("Erro API Pix");
          const data = await response.json();
          
          setPixData({ qrcode: data.qrcode, qrcodeUrl: data.qrcodeUrl, value, msgId, isGift, giftMsg });
          if(isGift) setShowGiftModal(false);
          setShowPixModal(true);
      } catch (error) {
          // 🔥 CORREÇÃO AQUI: APENAS AVISA O ERRO, SEM REDIRECIONAR PRO WHATSAPP 🔥
          alert("Ocorreu um erro ao gerar a chave PIX no momento. Por favor, tente novamente em instantes.");
      } finally { setGeneratingPix(false); }
  };

  const confirmPayment = async () => {
      if (!pixData || !currentChatModel) return;
      setCheckingPayment(true);
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          
          // 🔥 LÓGICA MASTER DE AFILIADO E REPASSE 70/30 🔥
          const processPaymentLogic = async () => {
              const modelRes = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${currentChatModel.model_id}&select=balance,referred_by,created_at`, { headers });
              const mData = await modelRes.json();
              if (mData && mData[0]) {
                  const modelData = mData[0];
                  let modelCut = pixData.value * 0.70;
                  let platformCut = pixData.value * 0.30;
                  let affiliateCut = 0;

                  if (modelData.referred_by) {
                      const dataCadastro = new Date(modelData.created_at).getTime();
                      const dias = (new Date().getTime() - dataCadastro) / (1000 * 3600 * 24);
                      if (dias <= 90) {
                          affiliateCut = pixData.value * 0.05; 
                          platformCut = pixData.value * 0.25;
                          const mRes = await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelData.referred_by}&select=balance`, { headers }).then(r=>r.json());
                          if(mRes && mRes[0]) {
                              await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelData.referred_by}`, { method: "PATCH", headers, body: JSON.stringify({ balance: (mRes[0].balance || 0) + affiliateCut }) });
                          }
                      }
                  }

                  await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${currentChatModel.model_id}`, { method: 'PATCH', headers, body: JSON.stringify({ balance: (modelData.balance || 0) + modelCut }) });
                  await fetch(`${supabaseUrl}/rest/v1/Transactions`, { method: 'POST', headers, body: JSON.stringify({ model_id: currentChatModel.model_id, player_phone: playerPhone, real_amount: pixData.value, model_cut: modelCut, platform_cut: platformCut, status: 'aprovado' }) });
              }
          };

          if (pixData.isGift) {
              await fetch(`${supabaseUrl}/rest/v1/Messages`, {
                  method: 'POST', headers,
                  body: JSON.stringify({ chat_id: currentChatModel.chat_id, sender_type: 'player', content: pixData.giftMsg, is_gift: true, price: pixData.value })
              });
              await processPaymentLogic();
              alert("Presente enviado com sucesso!");
          } else if (pixData.msgId) {
              await fetch(`${supabaseUrl}/rest/v1/Messages?id=eq.${pixData.msgId}`, { method: 'PATCH', headers, body: JSON.stringify({ is_unlocked: true }) });
              await processPaymentLogic();
              alert("Mídia desbloqueada com sucesso!");
          }

          setShowPixModal(false); setPixData(null);
          fetchChatMessages(currentChatModel.model_id, currentChatModel.player_id, true);
      } catch (e) { alert("Erro ao confirmar. Chame o suporte."); } finally { setCheckingPayment(false); }
  };

  const handleCopyPix = () => {
      if (pixData?.qrcode) { navigator.clipboard.writeText(pixData.qrcode); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (initialLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic animate-pulse">Acessando Universo Privado...</h2></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      <header className="fixed top-0 left-0 w-full h-20 bg-black/70 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
          <button onClick={() => router.push('/vitrine')} className="p-3 bg-white/5 rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center"><h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter">MEU <span className="text-white">HUB VIP</span></h1><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p></div>
          <div className="flex items-center gap-4">
              {/* 🔥 SINO COM ONCLICK 🔥 */}
              <div className="relative cursor-pointer" onClick={handleBellClick}>
                  <Bell size={20} className={totalUnread > 0 ? "text-[#D946EF] animate-pulse" : "text-white/30"} />
                  {totalUnread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black">{totalUnread}</span>}
              </div>
              <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="hidden sm:block px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
          </div>
      </header>

      <main className={`max-w-7xl mx-auto p-6 sm:p-10 mt-28 transition-all ${chatOpen ? 'blur-sm brightness-50' : ''}`}>
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={18}/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => {
                    const unread = unreadCounts[assoc.modelInfo?.model_id] || 0;
                    return (
                    <div key={assoc.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#D946EF]/30 transition-all min-h-[140px]">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 flex items-center justify-center bg-black/50">
                                {assoc.modelInfo?.profile_url ? <img src={assoc.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-[#D946EF]"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest mb-1 truncate">{assoc.modelInfo?.model_name || 'Musa'}</p>
                                <h3 className="text-2xl font-black text-white tracking-tighter truncate">{assoc.credits} CR</h3>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 relative z-10 pt-4 border-t border-white/5">
                            <button onClick={() => router.push(`/game/${assoc.modelInfo?.slug}`)} className="col-span-2 bg-[#D946EF]/10 text-[#D946EF] border border-[#D946EF]/30 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-[#D946EF] hover:text-white transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={14}/> Jogar</button>
                            
                            <button onClick={() => openChat(assoc.modelInfo, assoc.id)} className="relative bg-[#D946EF] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-1.5">
                                <MessageCircle size={14}/> Chat
                                {unread > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-bounce">{unread}</span>}
                            </button>
                            
                            <button onClick={() => router.push(`/profile/${assoc.modelInfo?.slug}`)} className="bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub</button>
                        </div>
                    </div>
                ) }) : <div className="py-12 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada ainda.</div>}
            </div>
        </section>

        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Video size={18}/> Meus Vídeos Encomendados</h2>
            <div className="grid gap-6">
                {videoOrders.length > 0 ? videoOrders.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 shadow-xl relative overflow-hidden hover:border-white/10 transition-all">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full border border-[#D946EF]/30 overflow-hidden shrink-0 hidden sm:flex items-center justify-center bg-white/5">
                                    {req.modelInfo?.profile_url ? <img src={req.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-white/30"/>}
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${req.status === 'pago' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : req.status === 'aceito' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : req.status === 'entregue' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {req.status === 'pago' ? 'Aguardando Musa' : req.status === 'aceito' ? 'Em Produção' : req.status === 'recusado' ? 'Recusado' : 'Entregue!'}
                                    </span>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Para: <span className="text-white">{req.modelInfo?.model_name}</span> • {req.duration} Min • R$ {req.price?.toFixed(2)}</div>
                                </div>
                            </div>
                            <p className="text-sm italic text-white/70 leading-relaxed font-medium bg-black/40 p-4 rounded-2xl border border-white/5">"{req.description}"</p>
                        </div>
                        <div className="min-w-[220px] flex flex-col justify-center gap-3">
                            {req.status === 'entregue' ? <a href={req.drive_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20 hover:bg-[#f062ff] transition-all flex items-center justify-center gap-2"><Play size={16} fill="currentColor"/> Acessar Vídeo</a> : <div className="text-blue-400 text-[10px] font-black uppercase text-center py-4 border border-blue-500/20 rounded-xl bg-blue-500/5 flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Aguardando Entrega</div>}
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-[3rem]">Nenhum vídeo encomendado.</div>}
            </div>
        </section>

        <section className="mb-12 animate-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Camera size={18}/> Minha Coleção VIP</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {unlockedGallery.length > 0 ? unlockedGallery.map((item: any) => (
                    <div key={item.id} onClick={() => { setViewingMedia(item.Media); setLiked(false); }} className="flex flex-col gap-3 group cursor-pointer">
                        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-xl group-hover:border-[#D946EF]/50 transition-all">
                            <img src={item.Media?.url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 border border-white/10"><User size={10} className="text-[#D946EF]"/> {item.Media?.modelInfo?.model_name}</div>
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-[3rem] col-span-full">Sua galeria está vazia.</div>}
            </div>
        </section>
      </main>

      {/* 🔥 MODAL DE CHAT VIP DO CLIENTE 🔥 */}
      {chatOpen && currentChatModel && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom-full duration-300">
              <div className="absolute inset-0 bg-black/60" onClick={() => setChatOpen(false)}></div>
              
              <div className="relative w-full max-w-lg h-[85vh] sm:h-[650px] bg-[#0a0a0a] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden z-10">
                  <div className="px-6 py-4 bg-black/50 border-b border-white/5 flex items-center justify-between backdrop-blur-md z-20">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D946EF]/50">
                              <img src={currentChatModel.profile_url} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <p className="text-sm font-black text-white uppercase">{currentChatModel.model_name}</p>
                              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => setShowGiftModal(true)} className="p-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500 hover:text-white transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]" title="Enviar Presente"><Gift size={18}/></button>
                          <button onClick={() => setChatOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-[#0a0a0a] to-black custom-scrollbar">
                      <div className="text-center py-4"><span className="px-3 py-1 bg-white/5 text-white/30 text-[9px] uppercase font-black tracking-widest rounded-full">Início da Conversa Segura</span></div>
                      
                      {messages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender_type === 'player' ? 'items-end' : 'items-start'}`}>
                              
                              {msg.is_gift ? (
                                  <div className="bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(245,158,11,0.2)] max-w-xs">
                                      <Gift size={32} className="text-amber-400 mb-2"/>
                                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Presente Enviado!</p>
                                      <p className="text-xl font-black text-white mt-1">R$ {msg.price?.toFixed(2)}</p>
                                      {msg.content && <p className="text-xs italic text-white/70 mt-2">"{msg.content}"</p>}
                                  </div>
                              ) : (
                                  <div className={`max-w-[80%] p-3 text-sm rounded-2xl ${msg.sender_type === 'player' ? 'bg-[#D946EF] text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm border border-white/5 shadow-lg'}`}>
                                      
                                      {msg.content && msg.media_type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                                      {msg.media_type === 'audio' && msg.media_url && (
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 opacity-70"><Mic size={10}/> Áudio VIP</span>
                                              <audio controls src={msg.media_url} className="h-10 w-48 mt-1 outline-none" />
                                          </div>
                                      )}

                                      {(msg.media_type === 'image' || msg.media_type === 'video') && msg.media_url && (
                                          <div className="mt-2">
                                              {msg.is_locked && !msg.is_unlocked ? (
                                                  <div onClick={() => generatePix(msg.price, msg.id)} className="relative aspect-square rounded-xl overflow-hidden border border-[#D946EF]/50 bg-black flex flex-col items-center justify-center text-center cursor-pointer group shadow-lg">
                                                      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl group-hover:backdrop-blur-lg transition-all"></div>
                                                      <Lock size={32} className="text-[#D946EF] relative z-10 mb-2 group-hover:scale-110 transition-transform" />
                                                      <p className="text-[10px] font-black uppercase text-white relative z-10">Mídia Exclusiva</p>
                                                      <button className="relative z-10 mt-3 bg-[#D946EF] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20">
                                                          Desbloquear R$ {msg.price?.toFixed(2)}
                                                      </button>
                                                  </div>
                                              ) : (
                                                  <div className="rounded-xl overflow-hidden border border-white/10">
                                                      {msg.media_type === 'video' ? (
                                                          <video src={msg.media_url} controls className="max-h-60 w-full object-cover" />
                                                      ) : (
                                                          <img src={msg.media_url} onClick={() => setViewingMedia({ url: msg.media_url, caption: msg.content, modelInfo: currentChatModel })} className="max-h-60 w-full object-cover cursor-pointer" />
                                                      )}
                                                      {msg.is_unlocked && <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase p-1.5 text-center flex items-center justify-center gap-1"><CheckCircle size={10}/> Desbloqueado</div>}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              )}
                              <span className="text-[8px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-[#0a0a0a] border-t border-white/5 z-20 shadow-md">
                      <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4 focus-within:border-[#D946EF]/50 transition-all">
                          <input 
                              type="text" 
                              placeholder="Envie uma mensagem..."
                              className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30 py-2"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center shadow-lg disabled:opacity-50 hover:bg-[#f062ff] transition-all shrink-0">
                              <Send size={16} className="-ml-0.5" />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL DE ENVIAR PRESENTE 🔥 */}
      {showGiftModal && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
              <div className="bg-[#0a0a0a] border border-amber-500/30 p-8 rounded-[3rem] w-full max-w-sm shadow-2xl relative">
                  <button onClick={() => setShowGiftModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={20}/></button>
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                          <Gift size={32} className="text-amber-500"/>
                      </div>
                      <h2 className="text-xl font-black uppercase text-amber-500 italic">Mimar a Musa</h2>
                      <p className="text-[10px] text-white/50 font-bold uppercase mt-2">Envie um presente para @{currentChatModel?.slug}</p>
                  </div>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="text-[10px] font-black uppercase text-white/40 block ml-2 mb-2">Valor do Presente (Mín. R$ 10,00)</label>
                          <input 
                              type="text" 
                              value={formattedGiftAmount} 
                              onChange={handleGiftPriceInput} 
                              className="w-full bg-black border border-amber-500/50 rounded-full py-4 px-6 text-amber-400 font-black text-2xl text-center outline-none focus:border-amber-500 transition-colors" 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-white/40 block ml-2 mb-2">Mensagem (Opcional)</label>
                          <input 
                              type="text" 
                              value={giftMessage} 
                              onChange={(e) => setGiftMessage(e.target.value)} 
                              placeholder="Você é incrível! 🔥"
                              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-amber-500 transition-colors" 
                          />
                      </div>
                      <button onClick={() => {
                          const val = Number(giftAmount) / 100;
                          if(val < 10) return alert("Mínimo de R$ 10,00 para presentes.");
                          generatePix(val, undefined, true, giftMessage);
                      }} disabled={generatingPix} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black py-5 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                          {generatingPix ? <Loader2 className="animate-spin" size={18}/> : <><Gift size={18}/> Gerar PIX Presente</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 🔥 MODAL DE PAGAMENTO PIX (PPV e Presente) 🔥 */}
      {showPixModal && pixData && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 sm:p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
                  <button onClick={() => { setShowPixModal(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24}/></button>
                  <h2 className="text-2xl font-black uppercase italic mb-2 text-[#D946EF]">Pagamento VIP</h2>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-8">Liberação Automática</p>

                  <div className="bg-white p-4 rounded-[2rem] mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-6 shadow-[0_0_30px_rgba(217,70,239,0.3)] flex items-center justify-center">
                      <img src={pixData.qrcodeUrl} alt="QR Code PIX" className="w-full h-full object-contain" />
                  </div>

                  <p className="text-3xl font-black text-white mb-6">R$ {pixData.value.toFixed(2)}</p>

                  <div className="space-y-3">
                      <button onClick={handleCopyPix} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-white/10 transition-all">
                          {copied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          {copied ? "Copiado!" : "Copiar Código PIX"}
                      </button>

                      <button onClick={confirmPayment} disabled={checkingPayment} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                          {checkingPayment ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                          {checkingPayment ? "Verificando..." : "Já Fiz o Pagamento"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL DE FOTO NORMAL */}
      {viewingMedia && (
          <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[310]"><X size={24}/></button>
             <div className="relative max-w-2xl w-full h-[60vh] sm:h-[75vh] flex items-center justify-center mb-6"><img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" /></div>
             <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
                <button onClick={() => setLiked(!liked)} className={`p-4 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}><Heart size={28} fill={liked ? "currentColor" : "none"} /></button>
                <div><p className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-1">{viewingMedia.modelInfo?.model_name}</p><p className="text-sm sm:text-base italic text-white/90 leading-relaxed font-medium">"{viewingMedia.caption}"</p></div>
             </div>
          </div>
      )}
    </div>
  );
}
