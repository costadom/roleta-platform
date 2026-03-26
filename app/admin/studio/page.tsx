"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, PreJoin, LocalUserChoices, useTracks, ParticipantTile, useChat, useRoomContext, useParticipants } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Video, DollarSign, Send, Users, Lock, X, Check } from "lucide-react";

function PrivateRequestModal({ request, onAccept, onDecline }: { request: any, onAccept: () => void, onDecline: () => void }) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-[#00f0ff] rounded-[2rem] p-10 max-w-lg w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#00f0ff]/10 border-2 border-[#00f0ff] flex items-center justify-center mb-6"><Lock size={36} className="text-[#00f0ff] animate-pulse" /></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Pedido de Show Privado!</h2>
          <p className="text-[#00f0ff] text-xs font-bold uppercase tracking-widest mb-6 bg-[#00f0ff]/10 px-4 py-1 rounded-full">Sua Parte: 70% (R$ 2,17/min)</p>
          <p className="text-white/80 text-lg mb-10">O cliente <span className="text-[#00f0ff] font-black uppercase bg-[#00f0ff]/10 px-2.5 py-1 rounded-md text-base">{request.senderName}</span> deseja o privado.</p>
          <div className="grid grid-cols-2 gap-5 w-full">
            <button onClick={onDecline} className="flex items-center justify-center gap-2 bg-white/5 text-white/70 hover:text-white py-4 rounded-full text-sm font-black uppercase"><X size={18} /> Recusar</button>
            <button onClick={onAccept} className="flex items-center justify-center gap-2 bg-[#00f0ff] text-black py-4 rounded-full text-sm font-black uppercase shadow-[0_0_20px_rgba(0,240,255,0.5)]"><Check size={18} /> Aceitar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyVideoStage() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);
  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {localTrack ? <ParticipantTile trackRef={localTrack} className="w-full h-full [&>video]:object-cover" /> : <div className="flex flex-col items-center gap-3 text-[#D946EF]/50"><Video size={48} className="animate-pulse" /><span className="font-black uppercase tracking-widest text-xs">Câmera Desligada</span></div>}
    </div>
  );
}

function ViewerList({ viewerBalances }: { viewerBalances: Record<string, number> }) {
  const participants = useParticipants();
  const viewers = participants.filter(p => !p.isLocal);
  return (
    <div className="p-4 border-b border-white/5 bg-[#050505] shrink-0">
      <h3 className="text-emerald-400 font-black uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2"><Users size={14} /> Espectadores ({viewers.length})</h3>
      <div className="flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
         {viewers.length === 0 ? <span className="text-white/30 text-[10px] uppercase font-bold">Nenhum fã na sala.</span> : 
            viewers.map(p => {
               const hasBalance = viewerBalances[p.identity] !== undefined;
               return (
                 <div key={p.identity} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-white text-[10px] font-bold uppercase truncate max-w-[120px]">{p.name || p.identity}</span>
                    <span className="text-[#00f0ff] text-[10px] font-black tracking-widest bg-[#00f0ff]/10 px-2 py-0.5 rounded-sm">
                      {hasBalance ? `${viewerBalances[p.identity].toFixed(2).replace('.', ',')} LT` : 'Sincronizando...'}
                    </span>
                 </div>
               );
            })
         }
      </div>
    </div>
  );
}

function CustomChat({ modelName }: { modelName: string }) {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-black/50 shrink-0"><h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest"><MessageCircle size={16} className="inline mr-2" /> Bate-papo VIP</h3></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.from?.identity === modelName ? "items-end" : "items-start"}`}>
            <span className={`text-[10px] font-black uppercase ${msg.from?.identity === modelName ? 'text-[#D946EF]' : 'text-emerald-400'}`}>{msg.from?.name}</span>
            <div className={`p-3 rounded-2xl text-sm max-w-[90%] mt-1 ${msg.from?.identity === modelName ? 'bg-[#D946EF] text-white' : 'bg-white/10 text-white'}`}>{msg.message}</div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-black border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4">
          <input type="text" className="flex-1 bg-transparent border-none text-xs text-white outline-none" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(message).then(()=>setMessage(''))} />
          <button onClick={() => send(message).then(()=>setMessage(''))} className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center shrink-0"><Send size={16} /></button>
        </div>
      </div>
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
           onBalanceUpdate(data.senderIdentity, data.currentBalance, data.giftPrice); // Cobra o presente e dá 70% pra ela
           onGiftReceived(data); // Dispara a animação
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
  const [error, setError] = useState("");
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
        else setError("Erro ao gerar token.");
      } catch (err) { setError("Falha na conexão."); }
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

  const handleBalanceUpdate = useCallback((identity: string, currentBalance: number, deductedAmount: number) => {
    setViewerBalances(prev => ({ ...prev, [identity]: currentBalance }));
    if (deductedAmount > 0) {
      const modelShare = deductedAmount * 0.70; 
      setSessionEarnings(prev => prev + modelShare);
    }
  }, []);

  const handleGiftReceived = useCallback((data: any) => {
    const newGift = { id: Date.now(), icon: data.giftIcon, sender: data.senderName };
    setActiveGifts(prev => [...prev, newGift]);
    setTimeout(() => { setActiveGifts(prev => prev.filter(g => g.id !== newGift.id)); }, 3000);
  }, []);

  if (error) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  if (!token) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50} /></div>;
  
  if (!preJoinChoices) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#D946EF]/30 rounded-[3rem] p-12"><PreJoin defaults={{ videoEnabled: true, audioEnabled: true }} onSubmit={setPreJoinChoices} className="!bg-transparent !p-0" joinLabel="Iniciar Transmissão" /></div>
    </div>
  );

  const neonClass = isPrivateMode ? "border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.7)]" : "border-[#D946EF] shadow-[0_0_50px_rgba(217,70,239,0.4)]"; 

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      
      {/* Camada de Animação dos Presentes da Modelo */}
      <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden">
        {activeGifts.map(gift => (
          <div key={gift.id} className="absolute left-1/2 bottom-1/4 -translate-x-1/2 flex flex-col items-center gift-anim">
            <span className="text-6xl drop-shadow-2xl mb-2">{gift.icon}</span>
            <span className="text-[#00f0ff] font-black uppercase text-[10px] bg-black/60 px-3 py-1 rounded-full">{gift.sender} enviou!</span>
          </div>
        ))}
      </div>

      <header className="h-20 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <button onClick={() => { if(confirm("Encerrar e voltar para a preparação?")) setPreJoinChoices(undefined); }} className="bg-red-500/10 text-red-500 px-4 py-3 rounded-full text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition">
           <ArrowLeft size={14} className="inline mr-2" /> Encerrar
        </button>
        <div className="bg-emerald-500/20 px-6 py-2 rounded-2xl flex items-center gap-4">
           <DollarSign size={24} className="text-emerald-400" />
           <div className="flex flex-col">
             <span className="text-[9px] text-emerald-400 uppercase">Seus Ganhos (70%)</span>
             <span className="text-xl font-black text-white">R$ {sessionEarnings.toFixed(2).replace('.', ',')}</span>
           </div>
        </div>
      </header>
      
      <main className="flex-1 relative flex overflow-hidden">
        <LiveKitRoom video={preJoinChoices.videoEnabled} audio={preJoinChoices.audioEnabled} token={token} serverUrl={livekitUrl} className="flex flex-col lg:flex-row h-full w-full">
          
          <InteractiveModelRoom onPrivateRequest={setCurrentPrivateRequest} onBalanceUpdate={handleBalanceUpdate} onPrivateEnd={() => setIsPrivateMode(false)} onGiftReceived={handleGiftReceived} />
          
          <RoomContextConsumer>
            {(room) => (
              <>
               <PrivateRequestModal request={currentPrivateRequest} onAccept={() => handleAcceptPrivate(room)} onDecline={() => setCurrentPrivateRequest(null)} />
               
               <div className="flex-1 p-4 flex flex-col bg-[#050505] relative overflow-hidden">
                  <div className="absolute top-10 left-10 z-30 flex items-center gap-3">
                     <div className={`text-white text-[10px] font-black uppercase px-4 py-2 rounded-full ${isPrivateMode ? 'bg-[#00f0ff] text-black shadow-lg shadow-[#00f0ff]/50 animate-pulse' : 'bg-red-500'}`}>
                        {isPrivateMode ? 'PRIVADO VIP ATIVO' : 'AO VIVO'}
                     </div>
                     {isPrivateMode && (
                        <button onClick={() => handleEndPrivateModel(room)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg">
                           Derrubar Privado
                        </button>
                     )}
                  </div>
                  <div className={`w-full h-full relative rounded-[2.5rem] overflow-hidden border-4 transition-all duration-1000 ${neonClass}`}><MyVideoStage /></div>
               </div>
              </>
            )}
          </RoomContextConsumer>

          <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-full z-20">
             <ViewerList viewerBalances={viewerBalances} />
             <CustomChat modelName={modelSlug || ""} />
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
      <style jsx global>{`
        @keyframes flyUpFade { 
           0% { transform: translateY(50px) scale(0.5); opacity: 0; } 
           20% { transform: translateY(0px) scale(1.2); opacity: 1; } 
           80% { transform: translateY(-100px) scale(1); opacity: 1; } 
           100% { transform: translateY(-150px) scale(0.8); opacity: 0; } 
        }
        .gift-anim { animation: flyUpFade 3s ease-out forwards; }
      `}</style>
    </div>
  );
}

function RoomContextConsumer({ children }: { children: (room: any) => React.ReactNode }) {
  const room = useRoomContext();
  return <>{children(room)}</>;
}

export default function ModelStudio() {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}><StudioContent /></Suspense>;
}