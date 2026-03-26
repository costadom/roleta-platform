"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useChat, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet, X, AlertTriangle, QrCode, Copy, ShoppingCart, Coins } from "lucide-react";

const GIFTS = [
  { id: 1, name: "Rosa", icon: "🌹", price: 5.00 },
  { id: 2, name: "Drink", icon: "🍸", price: 15.00 },
  { id: 3, name: "Coroa VIP", icon: "👑", price: 50.00 },
];

function ToastNotification({ message, onClose }: { message: string | null, onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-[#00f0ff] text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center gap-3 animate-bounce">
      {message}
      <button onClick={onClose} className="bg-black/20 p-1 rounded-full hover:bg-black/40"><X size={12} /></button>
    </div>
  );
}

function ModelVideoFeed() {
  const tracks = useTracks([Track.Source.Camera]);
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  return (
    <div className="absolute inset-0 w-full h-full bg-black z-0">
      {remoteTrack ? <VideoTrack trackRef={remoteTrack} className="w-full h-full object-cover" /> : 
        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#D946EF]/50 z-20">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse text-center px-6">Aguardando...</span>
        </div>}
    </div>
  );
}

function InteractiveRoom({ clientName, initialBalance }: { clientName: string, initialBalance: number }) {
  const room = useRoomContext();
  const router = useRouter();
  const roomRef = useRef(room);
  
  const balanceRef = useRef(initialBalance);
  const [balance, setBalance] = useState(initialBalance);
  
  const [requestingPrivate, setRequestingPrivate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isPrivateShow, setIsPrivateShow] = useState(false);
  const isPrivateRef = useRef(false);

  const publicSecRef = useRef(0);
  const privateSecRef = useRef(0);

  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [pixTimeLeft, setPixTimeLeft] = useState(180);

  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [activeGifts, setActiveGifts] = useState<{id: number, icon: string, sender: string}[]>([]);

  // Anti-Print Obscure State
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => { roomRef.current = room; }, [room]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

  const triggerGiftAnimation = (icon: string, sender: string) => {
    const newGift = { id: Date.now(), icon, sender };
    setActiveGifts(prev => [...prev, newGift]);
    setTimeout(() => { setActiveGifts(prev => prev.filter(g => g.id !== newGift.id)); }, 3000);
  };

  const syncBalanceWithModel = useCallback((currentBal: number, deducted: number) => {
    if (!roomRef.current?.localParticipant) return;
    const payload = JSON.stringify({ type: "BALANCE_UPDATE", senderIdentity: roomRef.current.localParticipant.identity, senderName: clientName, currentBalance: currentBal, deductedAmount: deducted });
    try { roomRef.current.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch(e) {}
  }, [clientName]);

  useEffect(() => { setTimeout(() => syncBalanceWithModel(balanceRef.current, 0), 2000); }, [syncBalanceWithModel]);

  // Escuta Sinais da Modelo + Anti Ban
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "PRIVATE_ACCEPTED" && data.targetClient === clientName) {
          setIsPrivateShow(true); isPrivateRef.current = true; privateSecRef.current = 0; setRequestingPrivate(false);
          showToast("Privado Iniciado! Azul Neon Ativado!");
        }
        if (data.type === "PRIVATE_ENDED" && (data.targetClient === clientName || data.targetClient === "all")) {
          setIsPrivateShow(false); isPrivateRef.current = false;
          showToast("A modelo encerrou o Show Privado.");
        }
        if (data.type === "GIFT") triggerGiftAnimation(data.giftIcon, data.senderName);
        
        // 🔥 SISTEMA DE BANIMENTO 🔥
        if (data.type === "BLOCK_USER" && data.targetClientIdentity === roomRef.current.localParticipant.identity) {
           alert("Você foi removido desta sala pela modelo.");
           router.push('/hub');
        }

      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clientName, router]);

  // Motor de Cobrança
  useEffect(() => {
    const timer = setInterval(() => {
      let deducted = 0;
      if (isPrivateRef.current) {
        privateSecRef.current += 1;
        if (privateSecRef.current > 0 && privateSecRef.current % 60 === 0) deducted = 3.10;
      } else {
        publicSecRef.current += 1;
        if (publicSecRef.current > 0 && publicSecRef.current % 20 === 0) deducted = 0.50;
      }

      if (deducted > 0) {
        balanceRef.current -= deducted; setBalance(balanceRef.current); syncBalanceWithModel(balanceRef.current, deducted);
      }

      if ((isPrivateRef.current && balanceRef.current < 3.10) || (!isPrivateRef.current && balanceRef.current < 0.50)) {
         if (!showShopModal && !showPixModal) setShowShopModal(true); 
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [syncBalanceWithModel, showShopModal, showPixModal]);

  // Cronômetro PIX
  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0) pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    else if (pixTimeLeft === 0) { setShowPixModal(false); router.push('/hub'); }
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft, router]);

  // Truque Anti-Print (Visibilidade)
  useEffect(() => {
    const handleVisibility = () => setIsBlurred(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleBuyPackage = (amount: number) => { setSelectedPackage(amount); setShowShopModal(false); setShowPixModal(true); setPixTimeLeft(180); };
  const simulatePaymentWebhook = () => { balanceRef.current += selectedPackage; setBalance(balanceRef.current); setShowPixModal(false); syncBalanceWithModel(balanceRef.current, 0); showToast(`PIX Confirmado!`); };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (balanceRef.current < gift.price) { showToast("LiveTokens insuficientes."); setShowGiftMenu(false); return setShowShopModal(true); }
    balanceRef.current -= gift.price; setBalance(balanceRef.current); setShowGiftMenu(false);
    const payload = JSON.stringify({ type: "GIFT", senderIdentity: roomRef.current.localParticipant.identity, senderName: clientName, giftIcon: gift.icon, giftPrice: gift.price });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    triggerGiftAnimation(gift.icon, "Você");
  };

  const handleRequestPrivate = async () => {
    if (balanceRef.current < 6.20) { showToast("Mínimo R$ 6,20 (2 min)."); return setShowShopModal(true); }
    setRequestingPrivate(true);
    const payload = JSON.stringify({ type: "PRIVATE_REQUEST", senderName: clientName });
    try { await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); showToast("Aguardando aceite..."); setTimeout(() => setRequestingPrivate(false), 20000); } catch (e) { setRequestingPrivate(false); }
  };

  const handleEndPrivateClient = () => {
    let penalty = 0;
    if (privateSecRef.current < 60) penalty = 6.20; 
    else if (privateSecRef.current < 120) penalty = 3.10; 
    if (penalty > 0) {
      if (!confirm(`Sair antes de 2min cobrará o restante (R$ ${penalty.toFixed(2)}). Sair?`)) return;
      balanceRef.current -= penalty; setBalance(balanceRef.current); syncBalanceWithModel(balanceRef.current, penalty);
    }
    const payload = JSON.stringify({ type: "PRIVATE_ENDED", senderName: clientName });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    setIsPrivateShow(false); isPrivateRef.current = false; privateSecRef.current = 0;
  };

  const neonClass = isPrivateShow ? "border-[#00f0ff] shadow-[inset_0_0_50px_rgba(0,240,255,0.3)]" : "border-white/10";
  const isLowBalance = (balance / (isPrivateShow ? 3.10 : 1.50)) <= 3 && balance > 0;

  return (
    <>
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
      
      <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden">
        {activeGifts.map(g => (
          <div key={g.id} className="absolute left-1/2 bottom-1/4 -translate-x-1/2 flex flex-col items-center gift-anim">
            <span className="text-6xl drop-shadow-2xl mb-2">{g.icon}</span>
            <span className="text-[#00f0ff] font-black uppercase text-[10px] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">{g.sender} enviou!</span>
          </div>
        ))}
      </div>

      {showShopModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-[90] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
          <Coins size={40} className="text-[#00f0ff] mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Comprar LiveTokens</h2>
          <p className="text-white/60 text-xs font-bold mb-8">1 LiveToken = R$ 1,00. Adicione saldo.</p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => handleBuyPackage(pkg.p)} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl">
                <span className="text-white font-black uppercase text-sm">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black text-xs">{pkg.p} LT (R$ {pkg.p})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showPixModal && (
        <div className="absolute bottom-6 left-4 right-4 z-[80] bg-black/80 backdrop-blur-2xl border border-[#00f0ff]/50 rounded-3xl p-5 flex flex-col items-center animate-slideUp">
            <div className="flex items-center justify-between w-full mb-3"><h3 className="text-[#00f0ff] font-black uppercase tracking-widest text-xs">PIX: R$ {selectedPackage},00</h3><button onClick={() => setShowPixModal(false)} className="text-white/50"><X size={16} /></button></div>
            <div className="flex w-full gap-4 items-center">
               <div className="bg-white p-2 rounded-xl shrink-0"><QrCode size={60} className="text-black" /></div>
               <div className="flex flex-col flex-1 gap-2">
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-2 rounded-full border border-white/10 text-[10px] font-black uppercase"><Copy size={12} /> Copiar Chave</button>
                 <button onClick={simulatePaymentWebhook} className="w-full bg-[#00f0ff] text-black py-2 rounded-full font-black uppercase text-[10px] shadow-lg shadow-[#00f0ff]/30">Pago (Simular)</button>
               </div>
            </div>
            <div className="mt-3 text-[#00f0ff] font-mono text-xl font-black">{Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
        </div>
      )}

      {!showShopModal && !showPixModal && isLowBalance && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-red-600/80 backdrop-blur-xl border border-red-400 px-6 py-3 rounded-full flex items-center gap-4 animate-pulse">
           <AlertTriangle size={16} className="text-white" />
           <div className="flex flex-col"><span className="text-white font-black uppercase text-[10px] tracking-widest">Tokens Acabando</span></div>
           <button onClick={() => setShowShopModal(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">+ Tokens</button>
        </div>
      )}

      {/* TELA PRINCIPAL (ANTI PRINT CLASS E BLUR) */}
      <div className={`absolute inset-0 transition-all duration-1000 select-none ${neonClass} ${isBlurred ? 'opacity-0' : 'opacity-100'}`} style={{ WebkitTouchCallout: 'none' }}>
         <ModelVideoFeed />
         
         <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
            <button onClick={() => router.push('/hub')} className="bg-black/40 backdrop-blur-md border border-white/10 text-white w-10 h-10 flex items-center justify-center rounded-xl pointer-events-auto"><ArrowLeft size={16} /></button>
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                <Wallet size={12} className="text-[#00f0ff]" />
                <span className="text-[#00f0ff] font-black text-[10px]">{balance.toFixed(2).replace('.', ',')} LT</span>
              </div>
              <button onClick={() => setShowShopModal(true)} className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black uppercase text-[9px] shadow-[0_0_15px_rgba(0,240,255,0.4)]">+ Comprar</button>
              {isPrivateShow && <div className="bg-[#00f0ff]/20 border border-[#00f0ff] px-3 py-1 rounded-full text-[#00f0ff] font-black text-[9px] uppercase tracking-widest flex items-center gap-1 animate-pulse"><Lock size={10} /> Privado VIP</div>}
            </div>
         </div>

         {/* Chat Overlay do Cliente */}
         <ClientChat clientName={clientName} />

         {/* Controles Inferiores */}
         {!showShopModal && !showPixModal && (
           <div className="absolute bottom-4 right-4 z-30 flex items-end gap-2">
              <div className="relative">
                {showGiftMenu && (
                  <div className="absolute bottom-[110%] right-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-2 animate-slideUp mb-2">
                    {GIFTS.map(g => (
                      <button key={g.id} onClick={() => handleSendGift(g)} className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-xl transition-colors w-32">
                         <span className="text-xl">{g.icon}</span>
                         <div className="flex flex-col items-start"><span className="text-white font-black text-[9px] uppercase">{g.name}</span><span className="text-[#00f0ff] font-bold text-[8px]">{g.price} LT</span></div>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowGiftMenu(!showGiftMenu)} className={`w-12 h-12 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all ${showGiftMenu ? 'bg-[#D946EF]/80 border-[#D946EF] text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-black/40 text-white border-white/10'}`}>
                  <Gift size={20} className={showGiftMenu ? "" : "text-[#D946EF]"} />
                </button>
              </div>

              {isPrivateShow ? (
                <button onClick={handleEndPrivateClient} className="h-12 flex items-center gap-2 bg-red-600/80 backdrop-blur-md border border-red-500 text-white px-5 rounded-2xl shadow-lg">
                    <X size={16} /><span className="text-[10px] font-black uppercase tracking-widest text-shadow-sm">Sair</span>
                </button>
              ) : (
                <button onClick={handleRequestPrivate} disabled={requestingPrivate} className="h-12 flex items-center gap-2 bg-[#00f0ff]/80 backdrop-blur-md border border-[#00f0ff] text-black px-5 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50">
                  {requestingPrivate ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black uppercase tracking-widest">{requestingPrivate ? 'Aguardando...' : 'Privado'}</span>
                    <span className="text-[8px] font-bold mt-0.5 opacity-80">3,10 LT/m</span>
                  </div>
                </button>
              )}
           </div>
         )}
      </div>
    </>
  );
}

function ClientChat({ clientName }: { clientName: string }) {
  const { send, chatMessages } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);
  return (
    <div className="absolute bottom-4 left-4 w-64 max-h-[35vh] flex flex-col z-20 pointer-events-none">
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar pointer-events-auto mask-image-top" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className="flex flex-col items-start">
            <span className={`text-[8px] font-black uppercase drop-shadow-md ${msg.from?.identity.includes("modelo") ? 'text-[#D946EF]' : 'text-emerald-400'}`}>{msg.from?.name || "Usuário"}</span>
            <span className="text-[11px] text-white font-medium drop-shadow-md bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-1 pl-3">
          <input type="text" placeholder="Falar..." className="flex-1 bg-transparent border-none text-[10px] text-white outline-none" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(message).then(()=>setMessage(''))} />
          <button onClick={() => send(message).then(()=>setMessage(''))} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"><Send size={12} className="-ml-0.5" /></button>
        </div>
      </div>
      <style jsx>{`.mask-image-top { mask-image: linear-gradient(to bottom, transparent, black 20%); }`}</style>
    </div>
  );
}

function LiveClientContent() {
  const router = useRouter();
  const params = useParams();
  const modelSlug = params.slug as string;
  const [token, setToken] = useState("");
  const [clientName, setClientName] = useState("");
  
  useEffect(() => {
    const initPage = async () => {
      const tempName = "Rafael_VIP"; setClientName(tempName);
      try {
        const res = await fetch(`/api/livekit/token?room=live_${modelSlug}&username=${encodeURIComponent(tempName)}&isModel=false`);
        const data = await res.json(); if (data.token) setToken(data.token);
      } catch (err) {}
    };
    if (modelSlug) initPage();
  }, [modelSlug]);

  if (!token) return <div className="h-[100dvh] bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#00f0ff]" size={50} /></div>;

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative">
      <LiveKitRoom video={false} audio={false} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ""} className="w-full h-full">
        <InteractiveRoom clientName={clientName} initialBalance={15.00} />
        <RoomAudioRenderer />
      </LiveKitRoom>
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }`}</style>
    </div>
  );
}

export default function LiveClientPage() {
  return <Suspense fallback={<div className="h-screen bg-black" />}><LiveClientContent /></Suspense>;
}