"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, PreJoin, LocalUserChoices, useTracks, ParticipantTile, useChat, useRoomContext, useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, Send, Users, Lock, X, Check, Mic, MicOff, Ban, ChevronDown, ChevronUp, DollarSign, Video } from "lucide-react";

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
      <div className="bg-black border border-[#ff0055]/50 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,0,85,0.4)]">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#ff0055]/20 border border-[#ff0055] flex items-center justify-center mb-4"><Lock size={28} className="text-[#ff0055] animate-pulse" /></div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Pedido Privado!</h2>
        <p className="text-[#ff0055] text-[10px] font-bold uppercase tracking-widest mb-4 bg-[#ff0055]/10 inline-block px-3 py-1 rounded-full">Sua Parte: 70% (R$ 2,17/min)</p>
        <p className="text-white/80 text-sm mb-6">O fã <span className="text-[#ff0055] font-black uppercase">{request.senderName}</span> quer ir pro VIP.</p>
        <div className="flex gap-3 w-full">
          <button onClick={onDecline} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-4 rounded-xl text-[12px] font-black uppercase transition-all">Recusar</button>
          <button onClick={onAccept} className="flex-1 bg-[#ff0055] text-white py-4 rounded-xl text-[12px] font-black uppercase shadow-[0_0_20px_rgba(255,0,85,0.5)] transition-all">Aceitar</button>
        </div>
      </div>
    </div>
  );
}

function MyVideoStage() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);
  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] z-0">
      {localTrack ? <ParticipantTile trackRef={localTrack} className="w-full h-full [&>video]:object-cover" /> : <div className="flex flex-col items-center justify-center h-full gap-3 text-[#D946EF]/50"><Video size={48} className="animate-pulse" /></div>}
    </div>
  );
}

function ViewerList({ viewerBalances, onBlock }: { viewerBalances: Record<string, number>, onBlock: (identity: string) => void }) {
  const participants = useParticipants();
  const viewers = participants.filter(p => !p.isLocal);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="absolute top-20 right-4 w-48 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl z-20 flex flex-col overflow-hidden transition-all duration-300">
      <div onClick={() => setIsMinimized(!isMinimized)} className="p-3 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10">
        <h3 className="text-emerald-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-1"><Users size={12} /> {viewers.length} na sala</h3>
        {isMinimized ? <ChevronDown size={14} className="text-white/50" /> : <ChevronUp size={14} className="text-white/50" />}
      </div>
      {!isMinimized && (
        <div className="flex flex-col gap-2 p-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
           {viewers.length === 0 ? <span className="text-white/30 text-[9px] uppercase font-bold text-center py-2">Vazio</span> : 
              viewers.map(p => {
                 const bal = viewerBalances[p.identity];
                 return (
                   <div key={p.identity} className="flex items-center justify-between bg-white/5 p-2 rounded-lg group">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-white text-[10px] font-bold uppercase truncate">{p.name || p.identity}</span>
                        <span className="text-[#00f0ff] text-[9px] font-black">{bal !== undefined ? `${bal.toFixed(2)} LT` : '---'}</span>
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

// 🔥 CHAT CORRIGIDO PARA IDENTIFICAR A MODELO 🔥
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
          // Confere se quem enviou foi a modelo pelo slug
          const isMe = msg.from?.name?.toLowerCase() === modelName.toLowerCase() || msg.from?.identity?.toLowerCase() === modelName.toLowerCase();
          
          return (
            <div key={i} className="flex flex-col items-start drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <span className={`text-[10px] font-black uppercase mb-0.5 ${isMe ? 'text-[#ff0055] drop-shadow-md' : 'text-emerald-400 drop-shadow-md'}`}>
                {isMe ? '👑 VOCÊ' : msg.from?.name}
              </span>
              <span className="text-[13px] text-white font-medium drop-shadow-lg leading-tight">
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full p-1 pl-4 shrink-0">
        <input 
          type="text" 
          placeholder="Falar com os fãs..." 
          className="flex-1 bg-transparent border-none text-[16px] text-white outline-none placeholder:text-white/50 py-2" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
        />
        <button onClick={handleSend} className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 shadow-lg"><Send size={14} className="-ml-0.5" /></button>
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
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [token, setToken] = useState("");
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [currentPrivateRequest, setCurrentPrivateRequest] = useState<any>(null);
  
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [viewerBalances, setViewerBalances] = useState<Record<string, number>>({});
  const [activeGifts, setActiveGifts] = useState<{id: number, icon: string, sender: string}[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showBrilhe, setShowBrilhe] = useState(false);

  useEffect(() => {
    if (!modelId || !modelSlug) return router.push("/admin");
    const fetchToken = async () => {
      try {
        const safeRoom = `live_${modelSlug.toLowerCase()}`;
        const res = await fetch(`/api/livekit/token?room=${safeRoom}&username=${encodeURIComponent(modelSlug)}&isModel=true`);
        const data = await res.json();
        if (data.token) setToken(data.token);
      } catch (err) {}
    };
    fetchToken();
  }, [router, modelId, modelSlug]);

  const startLive = (choices: LocalUserChoices) => {
    setCountdown(3);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => {
      setCountdown(null); setShowBrilhe(true); setPreJoinChoices(choices); 
      setTimeout(() => setShowBrilhe(false), 2000); 
    }, 3000);
  };

  const handleAcceptPrivate = async (roomContext: any) => {
    setIsPrivateMode(true);
    const payload = JSON.stringify({ type: "PRIVATE_ACCEPTED", targetClient: currentPrivateRequest.senderName });
    try { await roomContext.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch (e) {}
    setCurrentPrivateRequest(null);
  };

  const handleEndPrivateModel = async (roomContext: any) => {
    setIsPrivateMode(false);
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

  if (!token) return <div className="h-[100dvh] bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50} /></div>;

  if (!preJoinChoices && countdown === null && !showBrilhe) return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-6 bg-cover bg-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-center text-white mb-6 uppercase tracking-widest">Preparar Live</h1>
        <PreJoin defaults={{ videoEnabled: true, audioEnabled: true }} onSubmit={startLive} className="!bg-transparent !p-0" joinLabel="Iniciar Transmissão" />
      </div>
    </div>
  );

  if (countdown !== null) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
         <span className="text-[150px] font-black text-white drop-shadow-[0_0_50px_rgba(217,70,239,0.8)] animate-ping">{countdown}</span>
      </div>
    </div>
  );

  const neonBorder = isPrivateMode ? "border-[#ff0055] shadow-[inset_0_0_50px_rgba(255,0,85,0.4)]" : "border-black"; 

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative">
      {showBrilhe && (
        <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
          <h1 className="text-6xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_50px_rgba(255,255,255,1)] animate-pulse">Brilhe!</h1>
        </div>
      )}

      {preJoinChoices && (
        <LiveKitRoom video={preJoinChoices.videoEnabled} audio={preJoinChoices.audioEnabled} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud"} className={`w-full h-full transition-all duration-1000 ${neonBorder} border-2`}>
          <MyVideoStage />
          <RoomAudioRenderer />
          <InteractiveModelRoom onPrivateRequest={setCurrentPrivateRequest} onBalanceUpdate={handleBalanceUpdate} onPrivateEnd={() => setIsPrivateMode(false)} onGiftReceived={handleGiftReceived} />
          
          <RoomContextConsumer>
            {(room) => (
              <>
               <PrivateRequestModal request={currentPrivateRequest} onAccept={() => handleAcceptPrivate(room)} onDecline={() => setCurrentPrivateRequest(null)} />
               
               <header className="absolute top-6 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                  <div className="flex flex-col gap-2 pointer-events-auto">
                     <div className="bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl flex flex-col shadow-lg min-w-[140px]">
                       <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">Faturamento (70%)</span>
                       <span className="text-lg font-black text-emerald-400 leading-none mt-1">R$ {sessionEarnings.toFixed(2).replace('.', ',')}</span>
                     </div>
                     <div className={`text-white text-[10px] font-black uppercase px-4 py-2 rounded-full w-max shadow-lg flex items-center gap-2 ${isPrivateMode ? 'bg-[#ff0055] shadow-[#ff0055]/50 animate-pulse' : 'bg-[#D946EF]'}`}>
                        {isPrivateMode ? <><Lock size={12}/> VIP ATIVO</> : <><div className="w-2 h-2 rounded-full bg-white animate-pulse"></div> AO VIVO</>}
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end pointer-events-auto">
                     <div className="flex gap-2">
                        <MicToggleButton />
                        <button onClick={() => { if(confirm("Encerrar Live?")) { setPreJoinChoices(undefined); setSessionEarnings(0); } }} className="bg-black/60 hover:bg-red-600 backdrop-blur-md border border-white/10 text-white w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg">
                          <X size={20} />
                        </button>
                     </div>
                     {isPrivateMode && (
                        <button onClick={() => handleEndPrivateModel(room)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg border border-red-400">Derrubar Privado</button>
                     )}
                  </div>
               </header>

               <ViewerList viewerBalances={viewerBalances} onBlock={(id) => handleBlockUser(room, id)} />
               <CustomChat modelName={modelSlug || ""} />
               
               <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden flex items-center justify-center">
                {activeGifts.map(gift => (
                  <div key={gift.id} className="flex flex-col items-center gift-anim absolute">
                    <span className="text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-2">{gift.icon}</span>
                    <span className="text-white font-black uppercase text-[12px] bg-[#ff0055] px-4 py-2 rounded-full backdrop-blur-md shadow-lg">{gift.sender} enviou!</span>
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
    <button onClick={toggleMic} className={`w-12 h-12 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all shadow-lg ${isMicOn ? 'bg-black/60 border-white/10 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
      {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );
}

function RoomContextConsumer({ children }: { children: (room: any) => React.ReactNode }) {
  const room = useRoomContext();
  return <>{children(room)}</>;
}

export default function ModelStudio() {
  return <Suspense fallback={<div className="h-screen bg-black" />}><StudioContent /></Suspense>;
}