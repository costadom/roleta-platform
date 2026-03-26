"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, PreJoin, LocalUserChoices, useTracks, ParticipantTile, useChat, useRoomContext, useParticipants, useLocalParticipant } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Video, DollarSign, Send, Users, Lock, X, Check, Mic, MicOff, Ban } from "lucide-react";

// Modal Premium de Aceite
function PrivateRequestModal({ request, onAccept, onDecline }: { request: any, onAccept: () => void, onDecline: () => void }) {
  if (!request) return null;
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-white/10 backdrop-blur-2xl border border-[#00f0ff]/50 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center mb-4"><Lock size={28} className="text-[#00f0ff] animate-pulse" /></div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Pedido Privado!</h2>
        <p className="text-[#00f0ff] text-[10px] font-bold uppercase tracking-widest mb-4 bg-[#00f0ff]/10 inline-block px-3 py-1 rounded-full">Sua Parte: 70% (R$ 2,17/min)</p>
        <p className="text-white/80 text-sm mb-6">O cliente <span className="text-[#00f0ff] font-black uppercase">{request.senderName}</span> deseja o privado.</p>
        <div className="flex gap-3 w-full">
          <button onClick={onDecline} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl text-[10px] font-black uppercase transition-all"><X size={14} className="mx-auto" /> Recusar</button>
          <button onClick={onAccept} className="flex-1 bg-[#00f0ff] hover:bg-[#00d0dd] text-black py-3 rounded-xl text-[10px] font-black uppercase shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"><Check size={14} className="mx-auto" /> Aceitar</button>
        </div>
      </div>
    </div>
  );
}

// Câmera Full Screen
function MyVideoStage() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);
  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0">
      {localTrack ? <ParticipantTile trackRef={localTrack} className="w-full h-full [&>video]:object-cover" /> : <div className="flex flex-col items-center justify-center h-full gap-3 text-[#D946EF]/50"><Video size={48} className="animate-pulse" /><span className="font-black uppercase tracking-widest text-xs">Câmera Desligada</span></div>}
    </div>
  );
}

// Lista de Fãs Flutuante com Botão BAN
function ViewerList({ viewerBalances, onBlock }: { viewerBalances: Record<string, number>, onBlock: (identity: string) => void }) {
  const participants = useParticipants();
  const viewers = participants.filter(p => !p.isLocal);
  return (
    <div className="absolute top-20 right-4 w-48 max-h-[30vh] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 z-20 flex flex-col">
      <h3 className="text-emerald-400 font-black uppercase text-[9px] tracking-widest mb-2 flex items-center gap-1"><Users size={12} /> {viewers.length} na sala</h3>
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
         {viewers.length === 0 ? <span className="text-white/30 text-[9px] uppercase font-bold text-center py-2">Vazio</span> : 
            viewers.map(p => {
               const bal = viewerBalances[p.identity];
               return (
                 <div key={p.identity} className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg group">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-white text-[9px] font-bold uppercase truncate">{p.name || p.identity}</span>
                      <span className="text-[#00f0ff] text-[8px] font-black">{bal !== undefined ? `${bal.toFixed(2)} LT` : '---'}</span>
                    </div>
                    {/* Botão de Bloquear Cliente */}
                    <button onClick={() => { if(confirm(`Bloquear e expulsar ${p.name}?`)) onBlock(p.identity); }} className="text-white/20 hover:text-red-500 p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                      <Ban size={12} />
                    </button>
                 </div>
               );
            })
         }
      </div>
    </div>
  );
}

// Chat Liquid Glass (No canto inferior)
function CustomChat({ modelName }: { modelName: string }) {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);
  return (
    <div className="absolute bottom-4 left-4 w-72 h-[40vh] flex flex-col bg-black/30 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden z-20 shadow-2xl">
      <div className="p-3 border-b border-white/5 shrink-0 bg-gradient-to-b from-black/60 to-transparent"><h3 className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><MessageCircle size={12} className="text-[#D946EF]" /> Chat</h3></div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.from?.identity === modelName ? "items-end" : "items-start"}`}>
            <span className={`text-[8px] font-black uppercase mb-0.5 ${msg.from?.identity === modelName ? 'text-[#D946EF]' : 'text-emerald-400'}`}>{msg.from?.name}</span>
            <div className={`p-2 rounded-xl text-[11px] max-w-[90%] backdrop-blur-md ${msg.from?.identity === modelName ? 'bg-[#D946EF]/80 text-white' : 'bg-white/10 text-white shadow-sm'}`}>{msg.message}</div>
          </div>
        ))}
      </div>
      <div className="p-2 shrink-0 bg-black/40">
        <div className="flex items-center gap-2 bg-white/10 rounded-full p-1 pl-3 border border-white/5">
          <input type="text" placeholder="Falar..." className="flex-1 bg-transparent border-none text-[10px] text-white outline-none" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(message).then(()=>setMessage(''))} />
          <button onClick={() => send(message).then(()=>setMessage(''))} className="w-7 h-7 rounded-full bg-[#D946EF] text-white flex items-center justify-center shrink-0"><Send size={10} className="-ml-0.5" /></button>
        </div>
      </div>
    </div>
  );
}

// Ouvinte de Sinais
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

  const roomName = `live_${modelSlug}`;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";

  useEffect(() => {
    if (!modelId || !modelSlug) return router.push("/admin");
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${roomName}&username=${encodeURIComponent(modelSlug)}&isModel=true`);
        const data = await res.json();
        if (data.token) setToken(data.token);
      } catch (err) {}
    };
    fetchToken();
  }, [router, modelId, modelSlug, roomName]);

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

  // 🔥 EXPULSAR USUÁRIO 🔥
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

  if (!token) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50} /></div>;
  if (!preJoinChoices) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: "url('/hub-bg.jpg')" }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-center text-white mb-6 uppercase tracking-widest">Preparar Live</h1>
        <PreJoin defaults={{ videoEnabled: true, audioEnabled: true }} onSubmit={setPreJoinChoices} className="!bg-transparent !p-0" joinLabel="Iniciar Transmissão" />
      </div>
    </div>
  );

  const neonBorder = isPrivateMode ? "border-[#00f0ff] shadow-[inset_0_0_50px_rgba(0,240,255,0.3)]" : "border-[#D946EF] shadow-[inset_0_0_30px_rgba(217,70,239,0.2)]"; 

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative">
      
      {/* VÍDEO FULL SCREEN */}
      <LiveKitRoom video={preJoinChoices.videoEnabled} audio={preJoinChoices.audioEnabled} token={token} serverUrl={livekitUrl} className={`w-full h-full border-2 transition-all duration-1000 ${neonBorder}`}>
        <MyVideoStage />
        <RoomAudioRenderer />
        <InteractiveModelRoom onPrivateRequest={setCurrentPrivateRequest} onBalanceUpdate={handleBalanceUpdate} onPrivateEnd={() => setIsPrivateMode(false)} onGiftReceived={handleGiftReceived} />
        
        <RoomContextConsumer>
          {(room) => (
            <>
             <PrivateRequestModal request={currentPrivateRequest} onAccept={() => handleAcceptPrivate(room)} onDecline={() => setCurrentPrivateRequest(null)} />
             
             {/* CABEÇALHO LIQUID GLASS */}
             <header className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2 pointer-events-auto">
                   <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex flex-col shadow-lg">
                     <span className="text-[8px] text-white/50 uppercase font-black">Faturamento (70%)</span>
                     <span className="text-sm font-black text-emerald-400">R$ {sessionEarnings.toFixed(2).replace('.', ',')}</span>
                   </div>
                   <div className={`text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full w-max shadow-lg ${isPrivateMode ? 'bg-[#00f0ff] text-black animate-pulse' : 'bg-red-500'}`}>
                      {isPrivateMode ? 'PRIVADO VIP' : 'AO VIVO'}
                   </div>
                </div>

                {/* CONTROLES DE ÁUDIO E VÍDEO DA MODELO */}
                <div className="flex gap-2 pointer-events-auto">
                   <MicToggleButton />
                   {isPrivateMode && (
                      <button onClick={() => handleEndPrivateModel(room)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Derrubar Privado</button>
                   )}
                   <button onClick={() => { if(confirm("Encerrar Live?")) setPreJoinChoices(undefined); }} className="bg-white/10 hover:bg-red-500/80 backdrop-blur-md border border-white/10 text-white w-10 h-10 flex items-center justify-center rounded-xl transition-all">
                     <X size={18} />
                   </button>
                </div>
             </header>

             {/* ELEMENTOS FLUTUANTES */}
             <ViewerList viewerBalances={viewerBalances} onBlock={(id) => handleBlockUser(room, id)} />
             <CustomChat modelName={modelSlug || ""} />
             
             {/* ANIMAÇÕES DE PRESENTE */}
             <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {activeGifts.map(gift => (
                <div key={gift.id} className="absolute left-1/2 bottom-1/3 -translate-x-1/2 flex flex-col items-center gift-anim">
                  <span className="text-7xl drop-shadow-2xl mb-2">{gift.icon}</span>
                  <span className="text-[#00f0ff] font-black uppercase text-[10px] bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">{gift.sender} enviou!</span>
                </div>
              ))}
             </div>
            </>
          )}
        </RoomContextConsumer>
      </LiveKitRoom>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        @keyframes flyUpFade { 0% { transform: translateY(50px) scale(0.5); opacity: 0; } 20% { transform: translateY(0px) scale(1.2); opacity: 1; } 80% { transform: translateY(-100px) scale(1); opacity: 1; } 100% { transform: translateY(-150px) scale(0.8); opacity: 0; } }
        .gift-anim { animation: flyUpFade 3s ease-out forwards; }
      `}</style>
    </div>
  );
}

// Botão de Mic Separado para usar o Hook
function MicToggleButton() {
  const { localParticipant } = useLocalParticipant();
  const [isMicOn, setIsMicOn] = useState(true);

  const toggleMic = () => {
    if (!localParticipant) return;
    if (isMicOn) { localParticipant.setMicrophoneEnabled(false); setIsMicOn(false); }
    else { localParticipant.setMicrophoneEnabled(true); setIsMicOn(true); }
  };

  return (
    <button onClick={toggleMic} className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border transition-all ${isMicOn ? 'bg-white/10 border-white/10 text-white' : 'bg-red-500/80 border-red-500 text-white'}`}>
      {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
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