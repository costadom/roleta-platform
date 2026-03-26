"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useChat, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, Send, Gift, Lock, Wallet, X, AlertTriangle, QrCode, Copy, Coins, VolumeX, Volume2 } from "lucide-react";

const GIFTS = [
  { id: 1, name: "Rosa", icon: "🌹", price: 5.00 },
  { id: 2, name: "Drink", icon: "🍸", price: 15.00 },
  { id: 3, name: "Coroa VIP", icon: "👑", price: 50.00 },
];

const BAD_WORDS = ["puta", "vadia", "buceta", "caralho", "porra", "merda", "fuder", "foder", "cuzinho", "cu", "pau", "piroca", "rola", "putinha", "safada"];
const filterText = (text: string) => {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, "***");
  });
  return filtered;
};

function ToastNotification({ message, onClose }: { message: string | null, onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#ff0055] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(255,0,85,0.6)] flex items-center gap-3 animate-bounce">
      {message}
      <button onClick={onClose} className="bg-black/20 p-1 rounded-full hover:bg-black/40"><X size={12} /></button>
    </div>
  );
}

function ModelVideoFeed() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }], { onlySubscribed: false });
  const remoteTrack = tracks.find(t => !t.participant.isLocal);
  
  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] z-0">
      {remoteTrack ? (
        <VideoTrack trackRef={remoteTrack as any} className="w-full h-full object-cover" /> 
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#D946EF]/50 z-20">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse text-center px-6">Conectando à Câmera...</span>
        </div>
      )}
    </div>
  );
}

function InteractiveRoom({ clientName, playerPhone, initialBalance, modelSlug }: { clientName: string, playerPhone: string, initialBalance: number, modelSlug: string }) {
  const room = useRoomContext();
  const router = useRouter();
  const roomRef = useRef(room);
  
  const balanceRef = useRef(initialBalance);
  const [balance, setBalance] = useState(initialBalance);
  const [initialBalanceCheck, setInitialBalanceCheck] = useState(initialBalance);
  
  const [requestingPrivate, setRequestingPrivate] = useState(false);
  const [showHotInvite, setShowHotInvite] = useState(false); 
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [isPrivateShow, setIsPrivateShow] = useState(false);
  const isPrivateRef = useRef(false);

  const publicSecRef = useRef(0);
  const privateSecRef = useRef(0);

  // Estados Financeiros
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);

  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [activeGifts, setActiveGifts] = useState<{id: number, icon: string, sender: string}[]>([]);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => { roomRef.current = room; }, [room]);
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

  const toggleAudio = async () => {
    if (isMuted) { await room.startAudio(); setIsMuted(false); } 
    else { setIsMuted(true); }
  };

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

  // Atualiza o saldo real se ele mudou por fora
  useEffect(() => {
    balanceRef.current = balance;
    syncBalanceWithModel(balance, 0);
  }, [balance, syncBalanceWithModel]);

  // Sincronia inicial
  useEffect(() => { setTimeout(() => syncBalanceWithModel(balanceRef.current, 0), 2000); }, [syncBalanceWithModel]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "PRIVATE_ACCEPTED" && data.targetClient === clientName) {
          setIsPrivateShow(true); isPrivateRef.current = true; privateSecRef.current = 0; 
          setRequestingPrivate(false); setShowHotInvite(false); 
          showToast("O Clima Esquentou! Privado Ativado 🔥");
        }
        if (data.type === "PRIVATE_ENDED" && (data.targetClient === clientName || data.targetClient === "all")) {
          setIsPrivateShow(false); isPrivateRef.current = false;
          showToast("O Show Privado foi encerrado.");
        }
        if (data.type === "GIFT") triggerGiftAnimation(data.giftIcon, data.senderName === clientName ? "Você" : "Alguém");
        
        if (data.type === "BLOCK_USER" && data.targetClientIdentity === roomRef.current.localParticipant.identity) {
           alert("Você foi banido da sala."); router.push('/explore');
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clientName, router]);

  // Motor de Desconto no Banco
  const deductFromDatabase = async (amount: number) => {
      try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
          await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone)}`, {
              method: 'PATCH',
              headers: headers,
              body: JSON.stringify({ live_tokens: balanceRef.current }) // Atualiza com o valor descontado
          });
      } catch(e) {}
  };

  useEffect(() => {
    const timer = setInterval(() => {
      let deducted = 0;
      if (isPrivateRef.current) {
        privateSecRef.current += 1;
        if (privateSecRef.current > 0 && privateSecRef.current % 60 === 0) deducted = 3.10;
      } else {
        publicSecRef.current += 1;
        if (publicSecRef.current > 0 && publicSecRef.current % 60 === 0) deducted = 0.35;
      }

      if (deducted > 0) {
        balanceRef.current -= deducted; 
        setBalance(balanceRef.current); 
        syncBalanceWithModel(balanceRef.current, deducted);
        deductFromDatabase(deducted); // Desconta real do banco!
      }

      if ((isPrivateRef.current && balanceRef.current < 3.10) || (!isPrivateRef.current && balanceRef.current < 0.35)) {
         if (!showShopModal && !showPixModal) setShowShopModal(true); 
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [syncBalanceWithModel, showShopModal, showPixModal, playerPhone]);

  useEffect(() => {
    const handleVisibility = () => setIsBlurred(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 🔥 GERAÇÃO DE PIX REAL DENTRO DA LIVE 🔥
  const generatePix = async (amount: number) => {
    setGeneratingPix(true);
    setPixTimeLeft(600);
    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        const pRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone)}&select=id`, { headers });
        const pData = await pRes.json();
        const playerId = pData[0]?.id;

        if (!playerId) throw new Error("Jogador não encontrado.");

        const response = await fetch('/api/checkout/hub', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, userId: playerId, type: 'live_tokens' }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro API Pix");

        if (data.qr_code_base64 || data.qrCodeBase64) {
            setPixData({ 
                qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, 
                qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, 
                value: amount
            });
            setInitialBalanceCheck(balanceRef.current);
            setShowShopModal(false);
            setShowPixModal(true);
        }
    } catch (error: any) {
        alert(`Falha ao gerar PIX: ${error.message}`);
    } finally { 
        setGeneratingPix(false); 
    }
  };

  // 🔥 POLLING DE PAGAMENTO (Checa o banco de dados) 🔥
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (showPixModal && pixData && !paymentSuccess) {
          interval = setInterval(async () => {
              try {
                  const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
                  const res = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone)}&select=live_tokens`, { headers });
                  const data = await res.json();
                  
                  const currentTokens = data[0]?.live_tokens || 0;
                  
                  if (currentTokens > initialBalanceCheck) {
                      setBalance(currentTokens);
                      balanceRef.current = currentTokens; // Sincroniza o ref
                      clearInterval(interval); 
                      setPaymentSuccess(true);
                      setTimeout(() => { 
                          setShowPixModal(false); 
                          setPixData(null); 
                          setPaymentSuccess(false); 
                      }, 3000);
                  }
              } catch(e) {}
          }, 4000); 
      }
      return () => clearInterval(interval);
  }, [showPixModal, pixData, paymentSuccess, initialBalanceCheck, playerPhone, supabaseKey, supabaseUrl]);

  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0 && !paymentSuccess) pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    else if (pixTimeLeft === 0) setShowPixModal(false);
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft, paymentSuccess]);

  const handleCopyPix = () => {
      if (pixData?.qrCodeCopiaCola) { navigator.clipboard.writeText(pixData.qrCodeCopiaCola); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (balanceRef.current < gift.price) { showToast("LiveTokens insuficientes."); setShowGiftMenu(false); return setShowShopModal(true); }
    balanceRef.current -= gift.price; 
    setBalance(balanceRef.current); 
    deductFromDatabase(gift.price); // Atualiza no banco na hora!
    setShowGiftMenu(false);

    const payload = JSON.stringify({ type: "GIFT", senderIdentity: roomRef.current.localParticipant.identity, senderName: clientName, giftIcon: gift.icon, giftPrice: gift.price });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    triggerGiftAnimation(gift.icon, "Você");
  };

  const handleRequestPrivate = async () => {
    if (balanceRef.current < 6.20) { showToast("Mínimo R$ 6,20 (2 min)."); return setShowShopModal(true); }
    setRequestingPrivate(true);
    setShowHotInvite(true); 
    
    const payload = JSON.stringify({ type: "PRIVATE_REQUEST", senderName: clientName });
    try { 
      await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true }); 
      setTimeout(() => {
        if(requestingPrivate) { setRequestingPrivate(false); setShowHotInvite(false); showToast("A modelo não respondeu."); }
      }, 20000); 
    } catch (e) { setRequestingPrivate(false); setShowHotInvite(false); }
  };

  const handleEndPrivateClient = () => {
    let penalty = 0;
    if (privateSecRef.current < 60) penalty = 6.20; 
    else if (privateSecRef.current < 120) penalty = 3.10; 
    
    if (penalty > 0) {
      if (!confirm(`Aviso: Sair antes de 2 minutos cobrará o tempo mínimo restante (R$ ${penalty.toFixed(2)}). Deseja sair mesmo assim?`)) return;
      balanceRef.current -= penalty; 
      setBalance(balanceRef.current); 
      syncBalanceWithModel(balanceRef.current, penalty);
      deductFromDatabase(penalty);
    } else {
      if (!confirm("O tempo mínimo já passou. Deseja sair do VIP sem taxas extras?")) return;
    }

    const payload = JSON.stringify({ type: "PRIVATE_ENDED", senderName: clientName });
    room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    setIsPrivateShow(false); isPrivateRef.current = false; privateSecRef.current = 0;
  };

  const neonClass = isPrivateShow ? "border-[#ff0055] shadow-[inset_0_0_50px_rgba(255,0,85,0.4)] border-2" : "border-none";
  const isLowBalance = (balance / (isPrivateShow ? 3.10 : 0.35)) <= 3 && balance > 0;

  return (
    <>
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
      
      {showHotInvite && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
           <div className="w-24 h-24 bg-[#ff0055]/20 rounded-full flex items-center justify-center mb-6 animate-pulse border border-[#ff0055]">
              <span className="text-5xl">🔥</span>
           </div>
           <h2 className="text-3xl font-black text-white uppercase tracking-widest text-shadow-sm mb-3 text-[#ff0055]">Esquentando...</h2>
           <p className="text-white/80 font-bold text-sm uppercase tracking-widest leading-relaxed">Convidando a modelo para uma<br/>conversa mais íntima</p>
           <Loader2 className="animate-spin text-[#ff0055] mt-8" size={32} />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden flex items-center justify-center">
        {activeGifts.map(g => (
          <div key={g.id} className="flex flex-col items-center gift-anim absolute">
            <span className="text-8xl drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-2">{g.icon}</span>
            <span className="text-white font-black uppercase text-[12px] bg-[#ff0055] px-4 py-2 rounded-full shadow-lg">{g.sender} enviou!</span>
          </div>
        ))}
      </div>

      {showShopModal && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[90] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
          <Coins size={40} className="text-[#00f0ff] mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Comprar LiveTokens</h2>
          <p className="text-white/60 text-xs font-bold mb-8">1 LiveToken = R$ 1,00. Adicione saldo exclusivo para Lives.</p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => generatePix(pkg.p)} disabled={generatingPix} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#00f0ff]/50 transition-all disabled:opacity-50">
                <span className="text-white font-black uppercase text-sm">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black text-xs">{generatingPix ? <Loader2 size={12} className="animate-spin inline" /> : `${pkg.p} LT (R$ ${pkg.p})`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showPixModal && pixData && (
          <div className="absolute inset-0 z-[210] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#00f0ff]/30 p-8 sm:p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
                  {!paymentSuccess && <button onClick={() => { setShowPixModal(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24}/></button>}
                  {paymentSuccess ? (
                      <div className="py-10 animate-in zoom-in duration-500"><div className="w-24 h-24 bg-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,240,255,0.6)]"><CheckCircle size={50} className="text-black"/></div><h2 className="text-3xl font-black uppercase italic text-[#00f0ff] mb-2">Pago!</h2><p className="text-xs text-white/60 uppercase font-black tracking-widest">{pixData.value} LiveTokens na Carteira.</p></div>
                  ) : (
                      <>
                          <h2 className="text-2xl font-black uppercase italic mb-2 text-[#00f0ff]">Comprar Tokens</h2>
                          <div className="bg-white p-4 rounded-[2rem] mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-6 flex items-center justify-center"><img src={pixData.qrCodeBase64.includes('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} className="w-full h-full object-contain rounded-xl" /></div>
                          <p className="text-3xl font-black text-white mb-6">R$ {pixData.value.toFixed(2)}</p>
                          <div className="mb-6 flex items-center justify-center gap-2 text-[#00f0ff] font-black font-mono text-xl animate-pulse">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                          <button onClick={handleCopyPix} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black uppercase text-xs mb-4">{copied ? <CheckCircle size={18} className="text-[#00f0ff]" /> : <Copy size={18} />} {copied ? "Copiado!" : "Copiar Chave PIX"}</button>
                          <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-4 rounded-xl flex items-center justify-center gap-3"><Loader2 size={16} className="animate-spin text-[#00f0ff]" /><span className="text-[9px] text-[#00f0ff] uppercase font-black tracking-widest">Aguardando Pagamento...</span></div>
                      </>
                  )}
              </div>
          </div>
      )}

      {!showShopModal && !showPixModal && isLowBalance && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[60] bg-red-600/90 backdrop-blur-xl border border-red-400 px-6 py-3 rounded-full flex items-center gap-4 animate-pulse w-max shadow-[0_0_30px_rgba(220,38,38,0.5)]">
           <AlertTriangle size={16} className="text-white" />
           <div className="flex flex-col"><span className="text-white font-black uppercase text-[10px] tracking-widest">Tokens Acabando</span></div>
           <button onClick={() => setShowShopModal(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">+ Tokens</button>
        </div>
      )}

      <div className={`absolute inset-0 transition-all duration-1000 select-none ${neonClass} ${isBlurred ? 'opacity-0' : 'opacity-100'}`} style={{ WebkitTouchCallout: 'none' }}>
         <ModelVideoFeed />
         
         <div className="absolute top-6 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
            <button onClick={() => router.push('/explore')} className="bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white w-10 h-10 flex items-center justify-center rounded-2xl pointer-events-auto transition-all shadow-lg"><ArrowLeft size={16} /></button>
            
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
              <button onClick={toggleAudio} className="bg-black/50 backdrop-blur-md border border-white/10 text-white w-10 h-10 flex items-center justify-center rounded-2xl shadow-lg transition-all hover:bg-white/10 mb-1">
                 {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#00f0ff]" />}
              </button>

              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-lg">
                <Wallet size={12} className={isPrivateShow ? "text-[#ff0055]" : "text-[#00f0ff]"} />
                <span className={`font-black text-[10px] ${isPrivateShow ? "text-[#ff0055]" : "text-[#00f0ff]"}`}>{balance.toFixed(2).replace('.', ',')} LT</span>
              </div>
              <button onClick={() => setShowShopModal(true)} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] shadow-lg">+ Comprar</button>
              {isPrivateShow && <div className="bg-[#ff0055] text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1 animate-pulse shadow-[0_0_15px_rgba(255,0,85,0.6)]"><Lock size={10} /> Privado Ativo</div>}
            </div>
         </div>

         {!showShopModal && !showPixModal && (
           <div className="absolute bottom-[90px] right-4 z-30 flex flex-col gap-4 items-center pointer-events-auto">
              <div className="relative">
                {showGiftMenu && (
                  <div className="absolute bottom-0 right-[120%] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex flex-col gap-2 animate-slideUp">
                    {GIFTS.map(g => (
                      <button key={g.id} onClick={() => handleSendGift(g)} className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-2xl transition-colors w-36">
                         <span className="text-2xl">{g.icon}</span>
                         <div className="flex flex-col items-start"><span className="text-white font-black text-[10px] uppercase">{g.name}</span><span className="text-[#00f0ff] font-bold text-[9px]">{g.price} LT</span></div>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowGiftMenu(!showGiftMenu)} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all border shadow-xl ${showGiftMenu ? 'bg-[#D946EF] border-[#D946EF] text-white' : 'bg-black/50 backdrop-blur-md border-white/10 text-white'}`}>
                  <Gift size={20} />
                </button>
              </div>

              {isPrivateShow ? (
                <button onClick={handleEndPrivateClient} className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 border border-red-400 text-white shadow-lg transition-all animate-pulse" title="Sair do Privado">
                    <X size={20} />
                </button>
              ) : (
                <button onClick={handleRequestPrivate} disabled={requestingPrivate} className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-[#ff0055] text-[#ff0055] shadow-[0_0_20px_rgba(255,0,85,0.4)] transition-all">
                  <Lock size={14} />
                  <span className="text-[7px] font-black uppercase mt-0.5">VIP</span>
                </button>
              )}
           </div>
         )}

         <ClientChat clientName={clientName} modelSlug={modelSlug} />
      </div>

      {!isMuted && <RoomAudioRenderer />}
    </>
  );
}

function ClientChat({ clientName, modelSlug }: { clientName: string, modelSlug: string }) {
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
    <div className="absolute bottom-4 left-4 right-20 z-20 flex flex-col justify-end h-[40vh] pointer-events-none">
      <div className="flex-1 overflow-y-auto space-y-2 pb-2 custom-scrollbar pointer-events-auto mask-image-top flex flex-col justify-end" ref={chatContainerRef}>
        {chatMessages.map((msg, i) => {
          const isMe = msg.from?.identity === clientName;
          const isModel = msg.from?.name?.toLowerCase() === modelSlug.toLowerCase() || msg.from?.identity?.toLowerCase() === modelSlug.toLowerCase();
          const displayName = isMe ? "Você" : (isModel ? modelSlug : "Fã VIP");
          
          return (
            <div key={i} className="flex flex-col items-start drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              <span className={`text-[10px] font-black uppercase mb-0.5 ${isMe ? 'text-white' : isModel ? 'text-[#ff0055] drop-shadow-md' : 'text-[#00f0ff]'}`}>
                {isModel && "👑 "} {displayName}
              </span>
              <span className="text-[13px] text-white font-medium leading-tight">
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1 pl-4 shadow-lg">
          <input 
             type="text" 
             placeholder="Falar..." 
             className="flex-1 bg-transparent border-none text-[16px] text-white outline-none placeholder:text-white/60 py-2" 
             value={message} 
             onChange={(e) => setMessage(e.target.value)} 
             onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
          />
          <button onClick={handleSend} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors shadow-md">
             <Send size={14} className="-ml-0.5" />
          </button>
        </div>
      </div>
      <style jsx>{`.mask-image-top { mask-image: linear-gradient(to bottom, transparent, black 15%); }`}</style>
    </div>
  );
}

function LiveClientContent() {
  const router = useRouter();
  const params = useParams();
  const modelSlug = params.slug as string;
  const [token, setToken] = useState("");
  const [clientName, setClientName] = useState("");
  
  // Estados para dados reais do banco
  const [playerPhone, setPlayerPhone] = useState<string>("");
  const [realBalance, setRealBalance] = useState<number | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";
  
  useEffect(() => {
    const initPage = async () => {
      try {
        const phone = localStorage.getItem("labz_player_phone");
        if (!phone) {
            alert("Você precisa fazer login para assistir a Live!");
            router.push('/explore');
            return;
        }
        
        setPlayerPhone(phone);
        const tempName = `VIP_${Math.floor(Math.random() * 1000)}`; 
        setClientName(tempName);

        // Puxa o saldo real do banco para iniciar a live
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        const pRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=live_tokens`, { headers });
        const pData = await pRes.json();
        const startBalance = pData[0]?.live_tokens || 0;
        setRealBalance(startBalance);

        // Gera token do LiveKit
        const safeRoom = `live_${modelSlug.toLowerCase()}`;
        const res = await fetch(`/api/livekit/token?room=${safeRoom}&username=${encodeURIComponent(tempName)}&isModel=false`);
        const data = await res.json(); 
        if (data.token) setToken(data.token);

      } catch (err) {}
    };
    if (modelSlug) initPage();
  }, [modelSlug, router, supabaseKey, supabaseUrl]);

  if (!token || realBalance === null) return <div className="h-[100dvh] bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#00f0ff]" size={50} /></div>;

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden relative">
      <LiveKitRoom video={false} audio={false} token={token} serverUrl={LIVEKIT_URL} className="w-full h-full">
        {/* Agora o componente recebe o saldo Real e o telefone do usuário Real! */}
        <InteractiveRoom clientName={clientName} playerPhone={playerPhone} initialBalance={realBalance} modelSlug={modelSlug} />
      </LiveKitRoom>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        @keyframes flyUpFade { 0% { transform: translateY(100px) scale(0.5); opacity: 0; } 20% { transform: translateY(0px) scale(1.2); opacity: 1; } 80% { transform: translateY(-150px) scale(1); opacity: 1; } 100% { transform: translateY(-200px) scale(0.8); opacity: 0; } }
        .gift-anim { animation: flyUpFade 3.5s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default function LiveClientPage() {
  return <Suspense fallback={<div className="h-screen bg-black" />}><LiveClientContent /></Suspense>;
}
