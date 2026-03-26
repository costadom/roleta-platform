"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useChat, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet, X, AlertTriangle, QrCode, Copy, ShoppingCart, Coins } from "lucide-react";

// Tabela de Presentes
const GIFTS = [
  { id: 1, name: "Rosa", icon: "🌹", price: 5.00 },
  { id: 2, name: "Drink", icon: "🍸", price: 15.00 },
  { id: 3, name: "Coroa VIP", icon: "👑", price: 50.00 },
];

function ToastNotification({ message, onClose }: { message: string | null, onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#00f0ff] text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center gap-3 animate-bounce">
      {message}
      <button onClick={onClose} className="bg-black/20 p-1 rounded-full hover:bg-black/40"><X size={12} /></button>
    </div>
  );
}

function ModelVideoFeed() {
  const tracks = useTracks([Track.Source.Camera]);
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {remoteTrack ? <VideoTrack trackRef={remoteTrack} className="w-full h-full object-cover" /> : 
        <div className="flex flex-col items-center gap-4 text-[#D946EF]/50 z-20">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse text-center px-6">Aguardando transmissão...</span>
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

  // Loja & PIX
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [pixTimeLeft, setPixTimeLeft] = useState(180);

  // Presentes
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [activeGifts, setActiveGifts] = useState<{id: number, icon: string, sender: string}[]>([]);

  useEffect(() => { roomRef.current = room; }, [room]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

  // Dispara a animação flutuante na tela
  const triggerGiftAnimation = (icon: string, sender: string) => {
    const newGift = { id: Date.now(), icon, sender };
    setActiveGifts(prev => [...prev, newGift]);
    setTimeout(() => { setActiveGifts(prev => prev.filter(g => g.id !== newGift.id)); }, 3000);
  };

  const syncBalanceWithModel = useCallback((currentBal: number, deducted: number) => {
    if (!roomRef.current?.localParticipant) return;
    const payload = JSON.stringify({
      type: "BALANCE_UPDATE",
      senderIdentity: roomRef.current.localParticipant.identity,
      senderName: clientName,
      currentBalance: currentBal,
      deductedAmount: deducted
    });
    try { roomRef.current.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); } catch(e) {}
  }, [clientName]);

  useEffect(() => { setTimeout(() => syncBalanceWithModel(balanceRef.current, 0), 2000); }, [syncBalanceWithModel]);

  // Escuta Sinais da Modelo
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "PRIVATE_ACCEPTED" && data.targetClient === clientName) {
          setIsPrivateShow(true);
          isPrivateRef.current = true;
          privateSecRef.current = 0; 
          setRequestingPrivate(false);
          showToast("Privado Iniciado! Azul Neon Ativado!");
        }
        if (data.type === "PRIVATE_ENDED" && (data.targetClient === clientName || data.targetClient === "all")) {
          setIsPrivateShow(false);
          isPrivateRef.current = false;
          showToast("A modelo encerrou o Show Privado.");
        }
        // Se outro cliente mandou presente, a gente vê a animação também!
        if (data.type === "GIFT") {
           triggerGiftAnimation(data.giftIcon, data.senderName);
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clientName]);

  // 🔥 MOTOR DE COBRANÇA DO TEMPO 🔥
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
        balanceRef.current -= deducted;
        setBalance(balanceRef.current);
        syncBalanceWithModel(balanceRef.current, deducted);
      }

      if ((isPrivateRef.current && balanceRef.current < 3.10) || (!isPrivateRef.current && balanceRef.current < 0.50)) {
         if (!showShopModal && !showPixModal) setShowShopModal(true); 
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [syncBalanceWithModel, showShopModal, showPixModal]);

  // Cronômetro do PIX
  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0) pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    else if (pixTimeLeft === 0) { setShowPixModal(false); router.push('/hub'); }
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft, router]);

  // 🔥 COMPRAR PACOTES 🔥
  const handleBuyPackage = (amount: number) => {
    setSelectedPackage(amount);
    setShowShopModal(false);
    setShowPixModal(true);
    setPixTimeLeft(180);
  };

  const simulatePaymentWebhook = () => {
    balanceRef.current += selectedPackage; 
    setBalance(balanceRef.current);
    setShowPixModal(false);
    syncBalanceWithModel(balanceRef.current, 0); 
    showToast(`PIX Confirmado! R$ ${selectedPackage} adicionados.`);
  };

  // 🔥 ENVIAR PRESENTE 🔥
  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (balanceRef.current < gift.price) {
      showToast("LiveTokens insuficientes. Recarregue!");
      setShowGiftMenu(false);
      setShowShopModal(true);
      return;
    }

    // Debita o saldo
    balanceRef.current -= gift.price;
    setBalance(balanceRef.current);
    setShowGiftMenu(false);

    // Envia o sinal do presente para a sala inteira (e pra modelo ganhar os 70%)
    const payload = JSON.stringify({
      type: "GIFT",
      senderIdentity: roomRef.current.localParticipant.identity,
      senderName: clientName,
      giftName: gift.name,
      giftIcon: gift.icon,
      giftPrice: gift.price,
      currentBalance: balanceRef.current
    });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });

    // Mostra a animação pra mim
    triggerGiftAnimation(gift.icon, "Você");
    showToast(`Você enviou um(a) ${gift.name}!`);
  };

  // Pedir Privado e Sair
  const handleRequestPrivate = async () => {
    if (balanceRef.current < 6.20) {
      showToast("Mínimo exigido: R$ 6,20 (2 minutos). Recarregue.");
      return setShowShopModal(true);
    }
    setRequestingPrivate(true);
    const payload = JSON.stringify({ type: "PRIVATE_REQUEST", senderName: clientName, timestamp: Date.now() });
    try {
      await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      showToast("Aguardando aceite...");
      setTimeout(() => setRequestingPrivate(false), 20000); 
    } catch (error) { setRequestingPrivate(false); }
  };

  const handleEndPrivateClient = () => {
    let penalty = 0;
    if (privateSecRef.current < 60) penalty = 6.20; 
    else if (privateSecRef.current < 120) penalty = 3.10; 

    if (penalty > 0) {
      if (!confirm(`Sair antes dos 2 minutos mínimos cobrará o restante (R$ ${penalty.toFixed(2)}). Deseja sair?`)) return;
      balanceRef.current -= penalty;
      setBalance(balanceRef.current);
      syncBalanceWithModel(balanceRef.current, penalty);
    }

    const payload = JSON.stringify({ type: "PRIVATE_ENDED", senderName: clientName });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    
    setIsPrivateShow(false);
    isPrivateRef.current = false;
    privateSecRef.current = 0;
    showToast("Você encerrou o Show Privado.");
  };

  const neonClass = isPrivateShow ? "border-[#00f0ff] shadow-[0_0_50px_rgba(0,240,255,0.7)]" : "border-[#D946EF] shadow-[0_0_50px_rgba(217,70,239,0.4)]";
  const isLowBalance = (balance / (isPrivateShow ? 3.10 : 1.50)) <= 3 && balance > 0;

  return (
    <>
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
      
      {/* Camada de Animação dos Presentes */}
      <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden">
        {activeGifts.map(gift => (
          <div key={gift.id} className="absolute left-1/2 bottom-1/4 -translate-x-1/2 flex flex-col items-center gift-anim">
            <span className="text-6xl drop-shadow-2xl mb-2">{gift.icon}</span>
            <span className="text-[#00f0ff] font-black uppercase text-[10px] bg-black/60 px-3 py-1 rounded-full">{gift.sender} enviou!</span>
          </div>
        ))}
      </div>

      {/* 🔥 VITRINE DE LIVETOKENS 🔥 */}
      {showShopModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[90] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
          <Coins size={40} className="text-[#00f0ff] mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Comprar LiveTokens</h2>
          <p className="text-white/60 text-xs font-bold mb-8">1 LiveToken = R$ 1,00. Adicione saldo à sua carteira.</p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => handleBuyPackage(pkg.p)} className="flex items-center justify-between bg-white/10 hover:bg-white/20 border border-[#00f0ff]/30 p-4 rounded-2xl transition-all">
                <span className="text-white font-black uppercase text-sm">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black text-xs">{pkg.p} Tokens (R$ {pkg.p})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PIX */}
      {showPixModal && (
        <div className="absolute bottom-6 left-4 right-4 z-[80] bg-black/90 backdrop-blur-xl border border-[#00f0ff] rounded-3xl p-5 flex flex-col items-center shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-slideUp">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-[#00f0ff] font-black uppercase tracking-widest text-xs">PIX: R$ {selectedPackage},00</h3>
              <button onClick={() => setShowPixModal(false)} className="text-white/50"><X size={16} /></button>
            </div>
            <div className="flex w-full gap-4 items-center">
               <div className="bg-white p-2 rounded-xl shrink-0"><QrCode size={60} className="text-black" /></div>
               <div className="flex flex-col flex-1 gap-2">
                 <button className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-2 rounded-full border border-white/10 text-[10px] font-black uppercase"><Copy size={12} /> Copiar Chave</button>
                 <button onClick={simulatePaymentWebhook} className="w-full bg-[#00f0ff] text-black py-2 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#00f0ff]/30">Pago (Simular)</button>
               </div>
            </div>
            <div className="mt-3 text-[#00f0ff] font-mono text-xl font-black">{Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
        </div>
      )}

      {/* Aviso de Créditos Acabando */}
      {!showShopModal && !showPixModal && isLowBalance && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] bg-red-600/90 backdrop-blur-md border border-red-400 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse">
           <AlertTriangle size={16} className="text-white" />
           <div className="flex flex-col"><span className="text-white font-black uppercase text-[10px] tracking-widest">Tokens Acabando</span></div>
           <button onClick={() => setShowShopModal(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase hover:scale-105">+ Tokens</button>
        </div>
      )}

      <div className={`w-full h-full relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-black border-4 transition-all duration-1000 ${neonClass}`}>
         <ModelVideoFeed />
         
         {/* TOP BAR: Carteira + Botão de Comprar Fixo */}
         <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
              <Wallet size={14} className="text-[#00f0ff]" />
              <span className="text-[#00f0ff] font-black text-[10px]">{balance.toFixed(2).replace('.', ',')} LT</span>
            </div>
            <button onClick={() => setShowShopModal(true)} className="bg-[#00f0ff] text-black px-3 py-2 rounded-full font-black uppercase text-[9px] shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform">
               + Comprar
            </button>
         </div>

         {isPrivateShow && (
           <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-[#00f0ff]/20 border border-[#00f0ff] px-4 py-2 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)]">
             <Lock size={12} className="text-[#00f0ff]" />
             <span className="text-[#00f0ff] font-black text-[10px] uppercase tracking-widest">Privado</span>
           </div>
         )}
         <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none"></div>

         {!showShopModal && !showPixModal && (
           <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end pointer-events-none">
              
              {/* MENU DE PRESENTES */}
              <div className="relative pointer-events-auto">
                {showGiftMenu && (
                  <div className="absolute bottom-[110%] left-0 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex gap-3 animate-slideUp mb-3">
                    {GIFTS.map(g => (
                      <button key={g.id} onClick={() => handleSendGift(g)} className="flex flex-col items-center gap-1 hover:bg-white/10 p-2 rounded-xl transition-colors">
                         <span className="text-2xl">{g.icon}</span>
                         <span className="text-white font-black text-[8px] uppercase">{g.name}</span>
                         <span className="text-[#00f0ff] font-bold text-[8px]">{g.price} LT</span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowGiftMenu(!showGiftMenu)} className={`w-14 h-14 flex items-center justify-center rounded-full transition-all border ${showGiftMenu ? 'bg-[#D946EF] border-[#D946EF] text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}>
                  <Gift size={24} className={showGiftMenu ? "" : "text-[#D946EF]"} />
                </button>
              </div>

              {/* BOTÃO DE PRIVADO / SAIR */}
              <div className="pointer-events-auto flex gap-3">
                {isPrivateShow ? (
                  <button onClick={handleEndPrivateClient} className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-7 py-4 rounded-full shadow-lg transition-all">
                      <X size={20} />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-black uppercase tracking-widest text-shadow-sm">Sair do Privado</span>
                      </div>
                  </button>
                ) : (
                  <button onClick={handleRequestPrivate} disabled={requestingPrivate} className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white px-7 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50">
                    {requestingPrivate ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} className="animate-pulse" />}
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-xs font-black uppercase tracking-widest text-shadow-sm">{requestingPrivate ? 'Aguardando...' : 'Chamar Privado'}</span>
                      <span className="text-[9px] text-white/90 uppercase font-bold mt-0.5">3,10 LT / min</span>
                    </div>
                  </button>
                )}
              </div>
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
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-white/5 bg-black/50 shrink-0"><h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest"><MessageCircle size={16} className="inline mr-2" /> Bate-papo da Sala</h3></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.from?.identity === clientName ? "items-end" : "items-start"}`}>
            <span className={`text-[10px] font-black uppercase ${msg.from?.identity.includes("modelo") ? 'text-[#D946EF]' : 'text-emerald-400'}`}>{msg.from?.name || "Usuário"}</span>
            <div className={`p-3 rounded-2xl text-sm max-w-[90%] mt-1 ${msg.from?.identity === clientName ? 'bg-white/10 text-white' : msg.from?.identity.includes("modelo") ? 'bg-[#D946EF]/20 border border-[#D946EF]/50 text-white' : 'bg-black text-white'}`}>{msg.message}</div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-black border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4">
          <input type="text" placeholder="Mande uma mensagem..." className="flex-1 bg-transparent border-none text-xs text-white outline-none" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(message).then(()=>setMessage(''))} />
          <button onClick={() => send(message).then(()=>setMessage(''))} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 shrink-0"><Send size={16} className="-ml-0.5" /></button>
        </div>
      </div>
    </div>
  );
}

function LiveClientContent() {
  const router = useRouter();
  const params = useParams();
  const modelSlug = params.slug as string;
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState("");
  const roomName = `live_${modelSlug}`; 
  
  useEffect(() => {
    const initPage = async () => {
      const tempName = "Rafael_VIP";
      setClientName(tempName);
      try {
        const resToken = await fetch(`/api/livekit/token?room=${roomName}&username=${encodeURIComponent(tempName)}&isModel=false`);
        const dataToken = await resToken.json();
        if (dataToken.token) setToken(dataToken.token);
        else setError("Erro ao gerar acesso.");
      } catch (err) { setError("Falha na conexão."); }
    };
    if (modelSlug) initPage();
  }, [modelSlug, roomName]);

  if (error) return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10"><X size={50} className="text-red-500 mb-4" /><p>{error}</p></div>;
  if (!token) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50} /></div>;

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      <header className="h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
        <button onClick={() => router.push('/hub')} className="text-white/50 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase"><ArrowLeft size={14} /> Hub</button>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>
          <h1 className="text-white font-black uppercase tracking-widest text-sm">{modelSlug} <span className="text-[#D946EF] italic">AO VIVO</span></h1>
        </div>
      </header>
      <main className="flex-1 relative flex overflow-hidden">
        <LiveKitRoom video={false} audio={false} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud"} className="flex flex-col lg:flex-row h-full w-full">
          <div className="flex-1 p-2 sm:p-4 flex flex-col bg-[#050505] relative overflow-hidden">
             {/* Teste com 15 LiveTokens para dar margem */}
             <InteractiveRoom clientName={clientName} initialBalance={15.00} />
          </div>
          <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-[45vh] lg:h-full z-20 bg-[#0a0a0a]">
             <ClientChat clientName={clientName} />
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
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

export default function LiveClientPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}><LiveClientContent /></Suspense>;
}