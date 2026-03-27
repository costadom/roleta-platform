"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, PreJoin, LocalUserChoices, useTracks, ParticipantTile, useChat, useRoomContext, useParticipants, useLocalParticipant, VideoTrack } from "@livekit/components-react";
import { Track, RoomEvent, VideoPresets, TrackPublishDefaults } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, Send, Users, Lock, X, Check, Mic, MicOff, Ban, ChevronDown, ChevronUp, DollarSign, Video, Sparkles } from "lucide-react";

const BAD_WORDS = ["puta", "vadia", "buceta", "caralho", "porra", "merda", "fuder", "foder", "cuzinho", "cu", "pau", "piroca", "rola", "putinha", "safada"];
const filterText = (text: string) => {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, "***");
  });
  return filtered;
};

function PrivateRequestModal({ request, onAccept, onDecline }: { request: any, onAccept: () => void, onDecline: () => void }) {
  if (!request) return null;
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-[#0a0a0a] border border-[#ff0055]/50 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,0,85,0.4)]">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#ff0055]/20 border border-[#ff0055] flex items-center justify-center mb-4"><Lock size={28} className="text-[#ff0055] animate-pulse" /></div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Pedido Privado!</h2>
        <p className="text-[#ff0055] text-[10px] font-bold uppercase tracking-widest mb-4 bg-[#ff0055]/10 inline-block px-3 py-1 rounded-full border border-[#ff0055]/30">Sua Parte: 70% (R$ 2,17/min)</p>
        <p className="text-white/80 text-sm mb-6">O fã <span className="text-[#ff0055] font-black uppercase">{request.senderName}</span> quer ir pro VIP.</p>
        <div className="flex gap-3 w-full">
          <button onClick={onDecline} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-4 rounded-xl text-[12px] font-black uppercase transition-all">Recusar</button>
          <button onClick={onAccept} className="flex-1 bg-gradient-to-r from-[#ff0055] to-[#c20042] text-white py-4 rounded-xl text-[12px] font-black uppercase shadow-[0_0_20px_rgba(255,0,85,0.5)] hover:scale-105 active:scale-95 transition-all">Aceitar</button>
        </div>
      </div>
    </div>
  );
}

function MyVideoStage() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);
  return (
    // 🔥 CORREÇÃO DE LAYOUT: Container preto centralizado 🔥
    <div className="absolute inset-0 w-full h-full bg-black z-0 flex items-center justify-center overflow-hidden">
      {localTrack ? (
          // 🔥 object-contain garante que a imagem não estica e aparece inteira 🔥
          <VideoTrack trackRef={localTrack} className="w-full h-full object-contain max-w-full max-h-full" />
      ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#D946EF]/50"><Video size={48} className="animate-pulse" /></div>
      )}
    </div>
  );
}

function ViewerList({ viewerBalances, onBlock }: { viewerBalances: Record<string, number>, onBlock: (identity: string) => void }) {
  const participants = useParticipants();
  const viewers = participants.filter(p => !p.isLocal);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="absolute top-20 right-4 w-48 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-20 flex flex-col overflow-hidden transition-all duration-300 shadow-2xl">
      <div onClick={() => setIsMinimized(!isMinimized)} className="p-3 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10">
        <h3 className="text-[#00f0ff] font-black uppercase text-[10px] tracking-widest flex items-center gap-1.5"><Users size={12} /> {viewers.length} na sala</h3>
        {isMinimized ? <ChevronDown size={14} className="text-white/50" /> : <ChevronUp size={14} className="text-white/50" />}
      </div>
      {!isMinimized && (
        <div className="flex flex-col gap-2 p-2 max-h-[30vh] overflow-y-auto custom-scrollbar bg-black/50">
           {viewers.length === 0 ? <span className="text-white/30 text-[9px] uppercase font-bold text-center py-4 italic">Nenhum fã na sala</span> : 
              viewers.map(p => {
                 const bal = viewerBalances[p.identity];
                 return (
                   <div key={p.identity} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 group hover:border-[#D946EF]/50 transition-all">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-white text-[10px] font-bold uppercase truncate">{p.name || p.identity}</span>
                        <span className="text-[#00f0ff] text-[9px] font-black">{bal !== undefined ? `${bal.toFixed(2)} LT` : 'Calculando...'}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm(`Expulsar ${p.name}?`)) onBlock(p.identity); }} className="text-white/20 hover:text-red-500 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                        <Ban size={14} />
                      </button>
                   </div>
                 );
              })
           }
        </div>
      )}
    </div>
  );
}

function CustomChat({ modelName }: { modelName: string }) {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);
  
  const handleSend = () => {
     if (!message.trim()) return;
     const safeMessage = filterText(message);
     send(safeMessage).then(() => setMessage(''));
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:w-80 h-[50vh] flex flex-col justify-end z-20 pointer-events-none">
      <div className="overflow-y-auto p-2 space-y-3 custom-scrollbar pointer-events-auto mask-image-top mb-4 flex flex-col justify-end" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => {
          const isMe = msg.from?.name?.toLowerCase() === modelName.toLowerCase() || msg.from?.identity?.toLowerCase() === modelName.toLowerCase();
          return (
            <div key={i} className="flex flex-col items-start drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className={`text-[10px] font-black uppercase mb-0.5 tracking-widest ${isMe ? 'text-[#ff0055] drop-shadow-md' : 'text-[#00f0ff] drop-shadow-md'}`}>
                {isMe ? '👑 MUSA (VOCÊ)' : msg.from?.name}
              </span>
              <span className="text-[13px] text-white font-medium drop-shadow-lg leading-tight bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full p-1 pl-5 shrink-0 shadow-2xl">
        <input 
          type="text" 
          placeholder="Falar com os fãs..." 
          className="flex-1 bg-transparent border-none text-[14px] text-white outline-none placeholder:text-white/40 py-2" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
        />
        <button onClick={handleSend} disabled={!message.trim()} className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50 hover:bg-[#f062ff] transition-all"><Send size={14} className="-ml-0.5" /></button>
      </div>

      <style jsx>{`.mask-image-top { mask-image: linear-gradient(to bottom, transparent, black 15%); }`}</style>
    </div>
  );
}

function InteractiveModelRoom({ onPrivateRequest, onBalanceUpdate, onPrivateEnd, onGiftReceived }: { onPrivateRequest: (req: any) => void, onBalanceUpdate: (identity: string, balance: number, deducted: number) => void, onPrivateEnd: () => void, onGiftReceived: (data: any) => void }) {
  const room = useRoomContext();
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "PRIVATE_REQUEST") onPrivateRequest(data);
        if (data.type === "BALANCE_UPDATE") onBalanceUpdate(data.senderIdentity, data.currentBalance, data.deductedAmount);
        if (data.type === "PRIVATE_ENDED") onPrivateEnd();
        if (data.type === "GIFT") {
           onBalanceUpdate(data.senderIdentity, data.currentBalance, data.giftPrice);
           onGiftReceived(data); 
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, onPrivateRequest, onBalanceUpdate, onPrivateEnd, onGiftReceived]);
  return null;
}

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelSlug, setModelSlug] = useState<string | null>(null);

  const [token, setToken] = useState("");
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [currentPrivateRequest, setCurrentPrivateRequest] = useState<any>(null);
  
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [viewerBalances, setViewerBalances] = useState<Record<string, number>>({});
  const [activeGifts, setActiveGifts] = useState<{id: number, icon: string, sender: string}[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showBrilhe, setShowBrilhe] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const urlId = searchParams.get("model");
    const urlSlug = searchParams.get("slug");
    
    const localId = localStorage.getItem("labz_model_id");
    const localSlug = localStorage.getItem("labz_model_slug");

    const finalId = urlId || localId;
    const finalSlug = urlSlug || localSlug;

    if (!finalId || !finalSlug) {
        alert("Acesso negado. Faça login no seu painel primeiro.");
        router.push("/admin");
        return;
    }
    
    sessionStorage.setItem('current_model_id', finalId);
    sessionStorage.setItem('current_model_slug', finalSlug);
    
    setModelId(finalId);
    setModelSlug(finalSlug);
  }, [router, searchParams]);

  const currentModelId = searchParams.get("model") || (typeof window !== 'undefined' ? localStorage.getItem("labz_model_id") : null);
  const currentModelSlug = searchParams.get("slug") || (typeof window !== 'undefined' ? localStorage.getItem("labz_model_slug") : null);

  const setModelStatus = async (status: string) => {
    if (!currentModelId) return;
    try {
        await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${currentModelId}`, {
            method: 'PATCH',
            headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ live_status: status }),
            keepalive: true
        });
    } catch(e) {}
  };

  useEffect(() => {
    const handleUnload = () => { setModelStatus('offline'); };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload); 
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      setModelStatus('offline'); 
    };
  }, [currentModelId]);

  useEffect(() => {
    if (!currentModelId || !currentModelSlug) return;
    
    setModelStatus('offline');

    const fetchToken = async () => {
      try {
        const safeRoom = `live_${currentModelSlug.toLowerCase()}`;
        const res = await fetch(`/api/livekit/token?room=${safeRoom}&username=${encodeURIComponent(currentModelSlug)}&isModel=true`);
        const data = await res.json();
        if (data.token) setToken(data.token);
      } catch (err) {}
    };
    fetchToken();
  }, [currentModelId, currentModelSlug]);

  const startLive = (choices: LocalUserChoices) => {
    setCountdown(3);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => {
      setCountdown(null); 
      setShowBrilhe(true); 
      setPreJoinChoices(choices); 
      setModelStatus('online'); 
      setTimeout(() => setShowBrilhe(false), 2000); 
    }, 3000);
  };

  const handleAcceptPrivate = async (roomContext: any) => {
    setIsPrivateMode(true);
    setModelStatus('vip'); 
    const payload = JSON.stringify({ type: "PRIVATE_ACCEPTED", targetClient: currentPrivateRequest.senderName });
    try { await roomContext.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch (e) {}
    setCurrentPrivateRequest(null);
  };

  const handleEndPrivateModel = async (roomContext: any) => {
    setIsPrivateMode(false);
    setModelStatus('online'); 
    const payload = JSON.stringify({ type: "PRIVATE_ENDED", targetClient: "all" });
    try { await roomContext.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch (e) {}
  };

  const handleBlockUser = async (roomContext: any, targetIdentity: string) => {
    const payload = JSON.stringify({ type: "BLOCK_USER", targetClientIdentity: targetIdentity });
    try { await roomContext.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch (e) {}
  };

  const handleBalanceUpdate = useCallback((identity: string, currentBalance: number, deductedAmount: number) => {
    setViewerBalances(prev => ({ ...prev, [identity]: currentBalance }));
    if (deductedAmount > 0) setSessionEarnings(prev => prev + (deductedAmount * 0.70));
  }, []);

  const handleGiftReceived = useCallback((data: any) => {
    const newGift = { id: Date.now(), icon: data.giftIcon, sender: data.senderName };
    setActiveGifts(prev => [...prev, newGift]);
    setTimeout(() => { setActiveGifts(prev => prev.filter(g => g.id !== newGift.id)); }, 3000);
  }, []);

  if (!currentModelId || !currentModelSlug) {
      return (
          <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-6 text-center">
              <Lock size={50} className="text-red-500 mb-4" />
              <h1 className="text-white text-xl font-black uppercase tracking-widest mb-2">Acesso Negado</h1>
              <p className="text-white/50 text-xs uppercase mb-6">Você precisa acessar o estúdio através do seu Painel de Modelo.</p>
              <button onClick={() => router.push('/admin')} className="bg-[#D946EF] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px]">Ir para o Painel</button>
          </div>
      );
  }

  if (!token) return <div className="h-[100dvh] bg-black flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] mb-4" size={50} /><span className="text-[#D946EF] font-black uppercase text-[10px] tracking-widest animate-pulse">Preparando Estúdio...</span></div>;

  if (!preJoinChoices && countdown === null && !showBrilhe) return (
    <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=1000&q=80')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>
      
      <div className="relative z-10 w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-[0_0_60px_rgba(217,70,239,0.15)] flex flex-col items-center">
        
        <div className="w-20 h-20 bg-black/50 border border-[#D946EF]/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(217,70,239,0.3)] animate-pulse">
            <span className="text-4xl drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] text-[#D946EF]">🔱</span>
        </div>
        
        <h1 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-tighter italic">Studio <span className="text-[#D946EF]">Ao Vivo</span></h1>
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-10 text-center">Teste sua câmera e microfone antes de entrar.</p>
        
        <div className="w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-inner bg-black">
           {/* 🔥 TENTATIVA DE FORÇAR QUALIDADE NO PREJOIN 🔥 */}
           <PreJoin 
             defaults={{ videoEnabled: true, audioEnabled: true }} 
             onSubmit={startLive} 
             className="!bg-transparent !p-0 custom-prejoin" 
             joinLabel="🔴 INICIAR TRANSMISSÃO" 
           />
        </div>
        
        <button onClick={() => router.push(`/admin/dashboard?model=${currentModelId}&slug=${currentModelSlug}`)} className="mt-8 text-white/30 hover:text-white uppercase font-black text-[10px] tracking-widest flex items-center gap-2 transition-colors">
            <ArrowLeft size={14}/> Voltar para o Painel
        </button>

      </div>
    </div>
  );

  if (countdown !== null) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.2)_0%,rgba(0,0,0,1)_70%)]"></div>
      <div className="absolute inset-0 flex items-center justify-center z-50">
         <span className="text-[200px] font-black text-white drop-shadow-[0_0_80px_rgba(217,70,239,1)] animate-ping">{countdown}</span>
      </div>
    </div>
  );

  const neonBorder = isPrivateMode ? "border-[#ff0055] shadow-[inset_0_0_50px_rgba(255,0,85,0.4)]" : "border-black"; 

  // 🔥 CONFIGURAÇÕES DE ALTA QUALIDADE PARA TRANSMISSÃO 🔥
  const trackPublishDefaults: TrackPublishDefaults = {
    videoEncoding: VideoPresets.h1080.encoding, // Tenta 1080p. O LiveKit ajusta se a net for ruim.
    simulcast: true, // Importante para entregar qualidade diferente conforme a net do fã
    screenShareEncoding: VideoPresets.h1080_fps30.encoding,
  };

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative">
      {showBrilhe && (
        <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none bg-black/60 backdrop-blur-sm">
          <h1 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_50px_rgba(255,255,255,1)] animate-pulse flex items-center gap-4">
              <Sparkles size={60} className="text-[#D946EF]" /> BRILHE!
          </h1>
        </div>
      )}

      {preJoinChoices && (
        // 🔥 APLICANDO HQ NA ROOM 🔥
        <LiveKitRoom 
          video={preJoinChoices.videoEnabled} 
          audio={preJoinChoices.audioEnabled} 
          token={token} 
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud"} 
          publishDefaults={trackPublishDefaults} // 🔥 Aplica HQ aqui
          className={`w-full h-full transition-all duration-1000 ${neonBorder} border-4 box-border`}
        >
          <MyVideoStage />
          <RoomAudioRenderer />
          <InteractiveModelRoom onPrivateRequest={setCurrentPrivateRequest} onBalanceUpdate={handleBalanceUpdate} onPrivateEnd={() => setIsPrivateMode(false)} onGiftReceived={handleGiftReceived} />
          
          <RoomContextConsumer>
            {(room) => (
              <>
               <PrivateRequestModal request={currentPrivateRequest} onAccept={() => handleAcceptPrivate(room)} onDecline={() => setCurrentPrivateRequest(null)} />
               
               <header className="absolute top-6 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-3 pointer-events-auto">
                     <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-[1.5rem] flex flex-col shadow-2xl min-w-[150px]">
                       <span className="text-[9px] text-white/60 uppercase font-black tracking-widest mb-1 flex items-center gap-1.5"><DollarSign size={10} className="text-emerald-400"/> Faturamento (70%)</span>
                       <span className="text-xl font-black text-emerald-400 leading-none">R$ {sessionEarnings.toFixed(2).replace('.', ',')}</span>
                     </div>
                     <div className={`text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-full w-max shadow-xl flex items-center gap-2 border ${isPrivateMode ? 'bg-[#ff0055]/20 border-[#ff0055] text-[#ff0055] shadow-[0_0_20px_rgba(255,0,85,0.4)] animate-pulse' : 'bg-[#D946EF]/20 border-[#D946EF] text-[#D946EF] shadow-[0_0_20px_rgba(217,70,239,0.3)]'}`}>
                        {isPrivateMode ? <><Lock size={12}/> VIP ATIVO</> : <><div className="w-2 h-2 rounded-full bg-[#D946EF] animate-pulse"></div> AO VIVO</>}
                     </div>
                  </div>

                  <div className="flex flex-col gap-3 items-end pointer-events-auto">
                     <div className="flex gap-2">
                        <MicToggleButton />
                        
                        <button onClick={() => { 
                            if(confirm("Encerrar Live e voltar pro Painel?")) { 
                                setModelStatus('offline'); 
                                setPreJoinChoices(undefined); 
                                setSessionEarnings(0); 
                                router.push(`/admin/dashboard?model=${currentModelId}&slug=${currentModelSlug}`);
                            } 
                        }} className="bg-black/60 hover:bg-red-600 backdrop-blur-xl border border-white/10 text-white w-12 h-12 flex items-center justify-center rounded-[1rem] transition-all shadow-xl group">
                          <X size={20} className="group-hover:scale-110 transition-transform" />
                        </button>

                     </div>
                     {isPrivateMode && (
                        <button onClick={() => handleEndPrivateModel(room)} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-xl border border-red-500/50 transition-all flex items-center gap-2">
                           <Lock size={12}/> Derrubar Privado
                        </button>
                     )}
                  </div>
               </header>

               <ViewerList viewerBalances={viewerBalances} onBlock={(id) => handleBlockUser(room, id)} />
               <CustomChat modelName={currentModelSlug || ""} />
               
               <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex items-center justify-center">
                {activeGifts.map(gift => (
                  <div key={gift.id} className="flex flex-col items-center gift-anim absolute">
                    <span className="text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-2">{gift.icon}</span>
                    <span className="text-white font-black uppercase text-[12px] bg-gradient-to-r from-[#ff0055] to-[#c20042] px-6 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(255,0,85,0.4)] border border-white/20">{gift.sender} enviou!</span>
                  </div>
                ))}
               </div>
              </>
            )}
          </RoomContextConsumer>
        </LiveKitRoom>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        
        /* 🔥 Customiza o botão vermelho horroroso padrão do LiveKit 🔥 */
        .custom-prejoin button {
            background: #D946EF !important;
            border-radius: 1rem !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            box-shadow: 0 0 20px rgba(217,70,239,0.4) !important;
        }
        .custom-prejoin button:hover { background: #f062ff !important; }

        @keyframes flyUpFade { 0% { transform: translateY(100px) scale(0.5); opacity: 0; } 20% { transform: translateY(0px) scale(1.2); opacity: 1; } 80% { transform: translateY(-150px) scale(1); opacity: 1; } 100% { transform: translateY(-200px) scale(0.8); opacity: 0; } }
        .gift-anim { animation: flyUpFade 3.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

function MicToggleButton() {
  const { localParticipant } = useLocalParticipant();
  const [isMicOn, setIsMicOn] = useState(true);

  const toggleMic = () => {
    if (!localParticipant) return;
    if (isMicOn) { localParticipant.setMicrophoneEnabled(false); setIsMicOn(false); }
    else { localParticipant.setMicrophoneEnabled(true); setIsMicOn(true); }
  };

  return (
    <button onClick={toggleMic} className={`w-12 h-12 flex items-center justify-center rounded-[1rem] backdrop-blur-xl border transition-all shadow-xl ${isMicOn ? 'bg-black/60 border-white/10 text-white' : 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse'}`}>
      {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
    </button>
  );
}

function RoomContextConsumer({ children }: { children: (room: any) => React.ReactNode }) {
  const room = useRoomContext();
  return <>{children(room)}</>;
}

export default function ModelStudio() {
  return <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={40}/></div>}><StudioContent /></Suspense>;
}
