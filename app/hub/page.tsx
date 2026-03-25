"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, Clock, 
  Wallet, HelpCircle, Heart, User, Image as ImageIcon, MessageCircle, Send, Lock
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

  // 🔥 ESTADOS DO CHAT 🔥
  const [chatOpen, setChatOpen] = useState(false);
  const [currentChatModel, setCurrentChatModel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Rola o chat para baixo
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const logged = localStorage.getItem("labz_player_logged") === "true";
        const phone = localStorage.getItem("labz_player_phone");
        if (!logged || !phone) { router.push('/'); return; }
        setPlayerPhone(phone);

        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        // 🚀 OTIMIZAÇÃO DE CARREGAMENTO: BUSCA TUDO DE UMA VEZ 🚀
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
            // 🚀 SEGUNDA BUSCA PARALELA 🚀
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

  // 🔥 FUNÇÕES DO CHAT 🔥
  const openChat = async (modelInfo: any, playerId: string) => {
      setCurrentChatModel({ ...modelInfo, player_id: playerId });
      setChatOpen(true);
      
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        
        // 1. Busca a sala ou cria
        const chatRes = await fetch(`${supabaseUrl}/rest/v1/Chats?model_id=eq.${modelInfo.model_id}&player_id=eq.${playerId}`, { headers });
        const chatData = await chatRes.json();
        
        let chatId = "";

        if (chatData.length > 0) {
            chatId = chatData[0].id;
            // 2. Busca mensagens
            const msgRes = await fetch(`${supabaseUrl}/rest/v1/Messages?chat_id=eq.${chatId}&order=created_at.asc`, { headers });
            if (msgRes.ok) setMessages(await msgRes.json());
        } else {
            // Cria sala nova
            const newChatRes = await fetch(`${supabaseUrl}/rest/v1/Chats`, {
                method: 'POST', headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
                body: JSON.stringify({ model_id: modelInfo.model_id, player_id: playerId })
            });
            const newChatData = await newChatRes.json();
            if(newChatData[0]) chatId = newChatData[0].id;
        }

        setCurrentChatModel(prev => ({ ...prev, chat_id: chatId }));
        setTimeout(scrollToBottom, 100);
      } catch (e) { console.error("Erro Chat", e); }
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !currentChatModel?.chat_id) return;
      
      const censoredText = censorText(newMessage); // 🛡️ APLICA A CENSURA 🛡️
      const msgObj = {
          chat_id: currentChatModel.chat_id,
          sender_type: 'player',
          content: censoredText,
          created_at: new Date().toISOString()
      };

      // Otimista (mostra na tela antes de salvar no banco)
      setMessages(prev => [...prev, msgObj]);
      setNewMessage("");
      setTimeout(scrollToBottom, 100);

      try {
          await fetch(`${supabaseUrl}/rest/v1/Messages`, {
              method: 'POST',
              headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
              body: JSON.stringify(msgObj)
          });
      } catch(e) { console.error("Erro envio", e) }
  };

  if (initialLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic animate-pulse">Acessando Universo Privado...</h2></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      <header className="fixed top-0 left-0 w-full h-20 bg-black/70 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
          <button onClick={() => router.push('/vitrine')} className="p-3 bg-white/5 rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center"><h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter">MEU <span className="text-white">HUB VIP</span></h1><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p></div>
          <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
      </header>

      <main className={`max-w-7xl mx-auto p-6 sm:p-10 mt-28 transition-all ${chatOpen ? 'blur-sm brightness-50' : ''}`}>
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={18}/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => (
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
                        {/* 🔥 BOTÕES OTIMIZADOS 🔥 */}
                        <div className="grid grid-cols-2 gap-2 relative z-10 pt-4 border-t border-white/5">
                            <button onClick={() => router.push(`/game/${assoc.modelInfo?.slug}`)} className="col-span-2 bg-[#D946EF]/10 text-[#D946EF] border border-[#D946EF]/30 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-[#D946EF] hover:text-white transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={14}/> Jogar</button>
                            <button onClick={() => openChat(assoc.modelInfo, assoc.id)} className="bg-[#D946EF] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-1.5"><MessageCircle size={14}/> Chat</button>
                            <button onClick={() => router.push(`/profile/${assoc.modelInfo?.slug}`)} className="bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub</button>
                        </div>
                    </div>
                )) : <div className="py-12 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada ainda.</div>}
            </div>
        </section>

        {/* ... (SEÇÕES DE VÍDEO E GALERIA CONTINUAM IGUAIS) ... */}
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

      {/* 🔥 MODAL DE CHAT VIP 🔥 */}
      {chatOpen && currentChatModel && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom-full duration-300">
              {/* Fundo clicável para fechar */}
              <div className="absolute inset-0 bg-black/60" onClick={() => setChatOpen(false)}></div>
              
              <div className="relative w-full max-w-lg h-[85vh] sm:h-[600px] bg-[#0a0a0a] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden z-10">
                  {/* Header do Chat */}
                  <div className="px-6 py-4 bg-black/50 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D946EF]/50">
                              <img src={currentChatModel.profile_url} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <p className="text-sm font-black text-white uppercase">{currentChatModel.model_name}</p>
                              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online</p>
                          </div>
                      </div>
                      <button onClick={() => setChatOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"><X size={18}/></button>
                  </div>

                  {/* Corpo do Chat */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0a0a0a] to-black">
                      <div className="text-center py-4"><span className="px-3 py-1 bg-white/5 text-white/30 text-[9px] uppercase font-black tracking-widest rounded-full">Início da Conversa Segura</span></div>
                      
                      {messages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.sender_type === 'player' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[80%] p-3 text-sm rounded-2xl ${msg.sender_type === 'player' ? 'bg-[#D946EF] text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm border border-white/5'}`}>
                                  {/* SE FOR TEXTO NORMAL */}
                                  {msg.content && <p className="leading-relaxed">{msg.content}</p>}

                                  {/* SE FOR FOTO BLOQUEADA (PPV) - Preparação para o futuro */}
                                  {msg.is_locked && !msg.is_unlocked && (
                                      <div className="mt-2 relative rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center bg-black border border-[#D946EF]/30 p-4 text-center cursor-pointer group">
                                          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl group-hover:backdrop-blur-md transition-all"></div>
                                          <Lock size={30} className="text-[#D946EF] relative z-10 mb-2" />
                                          <p className="text-[10px] font-black uppercase text-white relative z-10">Conteúdo Privado</p>
                                          <p className="text-sm font-black text-[#D946EF] relative z-10 mt-1">R$ {msg.price?.toFixed(2)}</p>
                                      </div>
                                  )}

                                  {/* SE FOR FOTO DESBLOQUEADA */}
                                  {msg.media_url && (!msg.is_locked || msg.is_unlocked) && (
                                      <img src={msg.media_url} className="mt-2 rounded-xl max-w-full" />
                                  )}
                              </div>
                              <span className="text-[8px] text-white/20 mt-1 px-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Input do Chat */}
                  <div className="p-4 bg-black/50 border-t border-white/5 backdrop-blur-md">
                      <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4 focus-within:border-[#D946EF]/50 transition-all">
                          <input 
                              type="text" 
                              placeholder="Envie uma mensagem..."
                              className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30"
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

      {/* MODAL DE FOTO NORMAL (MANTIDO) */}
      {viewingMedia && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
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
