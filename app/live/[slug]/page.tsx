"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useChat, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet, X, AlertTriangle, QrCode, Copy } from "lucide-react";

function ToastNotification({ message, onClose }: { message: string | null, onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 animate-bounce">
      {message}
      <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/40"><X size={12} /></button>
    </div>
  );
}

function ModelVideoFeed() {
  const tracks = useTracks([Track.Source.Camera]);
  const remoteTrack = tracks.find(t => !t.participant.isLocal);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {remoteTrack ? (
        <VideoTrack trackRef={remoteTrack} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-4 text-[#D946EF]/50 z-20">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse text-center px-6">Aguardando transmissão...</span>
        </div>
      )}
    </div>
  );
}

// 🔥 LÓGICA DE SALA COM COBRANÇA, PIX E SINCRONIA 🔥
function InteractiveRoom({ clientName, initialBalance }: { clientName: string, initialBalance: number }) {
  const room = useRoomContext();
  const router = useRouter();
  const roomRef = useRef(room);
  
  const balanceRef = useRef(initialBalance);
  const [balance, setBalance] = useState(initialBalance);
  
  const [requestingPrivate, setRequestingPrivate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPrivateShow, setIsPrivateShow] = useState(false);
  const [secondsInRoom, setSecondsInRoom] = useState(0);

  // Estados do PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(180); // 3 minutos para pagar

  useEffect(() => { roomRef.current = room; }, [room]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 🔥 SINCRONIZA O DINHEIRO COM A MODELO 🔥
  const syncBalanceWithModel = useCallback((currentBal: number, deducted: number) => {
    const payload = JSON.stringify({
      type: "BALANCE_UPDATE",
      senderName: clientName,
      currentBalance: currentBal,
      deductedAmount: deducted
    });
    try {
      roomRef.current.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    } catch(e) {}
  }, [clientName]);

  useEffect(() => {
    setTimeout(() => syncBalanceWithModel(balanceRef.current, 0), 2000); 
  }, [syncBalanceWithModel]);

  // Escuta o "SIM" da modelo
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "PRIVATE_ACCEPTED" && data.targetClient === clientName) {
          setIsPrivateShow(true);
          setRequestingPrivate(false);
          showToast("A Modelo Aceitou! O Show Privado Começou");
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clientName]);

  // 🔥 O MOTOR DE COBRANÇA E EXPULSÃO 🔥
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsInRoom(prev => {
        const newSec = prev + 1;
        let deducted = 0;
        
        const costPerMin = isPrivateShow ? 3.10 : 1.50; // 1.50/min é equivalente a 0.50 a cada 20s
        
        if (isPrivateShow && newSec % 60 === 0) deducted = 3.10;
        else if (!isPrivateShow && newSec % 20 === 0) deducted = 0.50;

        if (deducted > 0) {
          balanceRef.current -= deducted;
          setBalance(balanceRef.current);
          syncBalanceWithModel(balanceRef.current, deducted);
        }

        // KICK: Se o saldo for menor que a próxima cobrança
        if ((isPrivateShow && balanceRef.current < 3.10) || (!isPrivateShow && balanceRef.current < 0.50)) {
          router.push('/hub');
        }

        return newSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPrivateShow, router, syncBalanceWithModel]);

  // 🔥 CRONÔMETRO DO PIX 🔥
  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0) {
      pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    } else if (pixTimeLeft === 0) {
      setShowPixModal(false);
    }
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft]);

  // Lógica do Aviso de 3 Minutos
  const minuteCost = isPrivateShow ? 3.10 : 1.50;
  const minutesRemaining = balance / minuteCost;
  const isLowBalance = minutesRemaining <= 3 && balance > 0;

  const handleRequestPrivate = async () => {
    if (balanceRef.current < 3.10) {
      showToast("Saldo insuficiente para iniciar o privado!");
      return;
    }
    setRequestingPrivate(true);
    const payload = JSON.stringify({ type: "PRIVATE_REQUEST", senderName: clientName, timestamp: Date.now() });
    
    try {
      await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      showToast("Pedido enviado! Aguardando a modelo aceitar...");
      setTimeout(() => setRequestingPrivate(false), 20000); 
    } catch (error) {
      showToast("Erro ao enviar pedido.");
      setRequestingPrivate(false);
    }
  };

  // 🔥 SIMULADOR DE WEBHOOK DE PAGAMENTO 🔥
  const simulatePaymentWebhook = () => {
    balanceRef.current += 50.00; // Injeta R$ 50
    setBalance(balanceRef.current);
    setShowPixModal(false);
    setPixTimeLeft(180);
    syncBalanceWithModel(balanceRef.current, 0); // Avisa a modelo do novo saldo
    showToast("PIX Confirmado! R$ 50,00 adicionados.");
  };

  // MOLDURA DINÂMICA
  const neonClass = isPrivateShow 
    ? "border-[#a855f7] shadow-[0_0_50px_rgba(168,85,247,0.6)]" // ROXO NEON
    : "border-[#D946EF] shadow-[0_0_50px_rgba(217,70,239,0.4)]"; // ROSA NEON

  // Formatação de tempo do PIX
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
      
      {/* 🔥 MODAL DE PIX IN-LIVE (NÃO SAI DA TELA) 🔥 */}
      {showPixModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-6 text-center rounded-3xl sm:rounded-[2.5rem] animate-fadeIn">
          <div className="bg-[#0a0a0a] border-2 border-emerald-500 rounded-3xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <button onClick={() => setShowPixModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
            
            <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">Recarga Rápida</h3>
            <p className="text-white/60 text-xs font-bold mb-6">Continue na live sem interrupções</p>
            
            <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-4">
              <QrCode size={150} className="text-black" />
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest mb-6 transition-colors">
              <Copy size={14} /> Copiar Chave PIX
            </button>

            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">A chave expira em</span>
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-widest">{formatTime(pixTimeLeft)}</span>
            </div>

            {/* BOTÃO DEV: Para você testar o fluxo completo */}
            <button onClick={simulatePaymentWebhook} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-400 text-white py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/30">
              Simular Webhook (Pago)
            </button>
          </div>
        </div>
      )}

      {/* AVISO SUTIL DE SALDO BAIXO (< 3 MINUTOS) */}
      {!showPixModal && isLowBalance && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] bg-red-600/90 backdrop-blur-md border border-red-400 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse">
           <AlertTriangle size={16} className="text-white" />
           <div className="flex flex-col">
             <span className="text-white font-black uppercase text-[10px] tracking-widest">Créditos Acabando</span>
             <span className="text-white/80 text-[9px] font-bold">~{Math.floor(minutesRemaining)} min restantes</span>
           </div>
           <button onClick={() => setShowPixModal(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
             Recarregar
           </button>
        </div>
      )}

      <div className={`w-full h-full relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-black border-4 transition-all duration-1000 ${neonClass}`}>
         <ModelVideoFeed />
         
         <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
            <Wallet size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-black text-[10px]">R$ {balance.toFixed(2).replace('.', ',')}</span>
         </div>

         {isPrivateShow && (
           <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-purple-600 border border-purple-400 px-4 py-2 rounded-full animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]">
             <Lock size={12} className="text-white" />
             <span className="text-white font-black text-[10px] uppercase">No Privado (R$ 3,10/m)</span>
           </div>
         )}

         <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none"></div>

         <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3 bg-black/60 backdrop-blur-lg p-2 rounded-full border border-white/10 shadow-2xl">
            <button onClick={() => showToast("Em breve!")} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group border border-white/5">
              <Gift size={24} className="text-[#D946EF] group-hover:scale-110 transition-transform" />
            </button>

            {!isPrivateShow && (
              <button onClick={handleRequestPrivate} disabled={requestingPrivate} className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white px-7 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50">
                {requestingPrivate ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} className="animate-pulse" />}
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-black uppercase tracking-widest text-shadow-sm">{requestingPrivate ? 'Aguardando...' : 'Chamar Privado'}</span>
                  <span className="text-[9px] text-white/90 uppercase font-bold mt-0.5">R$ 3,10 / min</span>
                </div>
              </button>
            )}
         </div>
      </div>
      <style jsx global>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }`}</style>
    </>
  );
}

// RESTANTE DO ARQUIVO (Chat e Conexão) PERMANECE IGUAL
function ClientChat({ clientName }: { clientName: string }) {
  const { send, chatMessages, isSending } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatMessages]);
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-white/5 bg-black/50 shrink-0">
        <h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest flex items-center gap-2"><MessageCircle size={16} /> Bate-papo da Sala</h3>
      </div>
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

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";
  const roomName = `live_${modelSlug}`; 
  
  useEffect(() => {
    const initPage = async () => {
      const tempName = localStorage.getItem('labz_client_name') || "Fã_" + Math.floor(Math.random() * 10000);
      localStorage.setItem('labz_client_name', tempName);
      setClientName(tempName);

      try {
        const resToken = await fetch(`/api/livekit/token?room=${roomName}&username=${encodeURIComponent(tempName)}&isModel=false`);
        const dataToken = await resToken.json();
        if (dataToken.token) setToken(dataToken.token);
        else setError(dataToken.error || "Erro ao gerar acesso.");
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
        <LiveKitRoom video={false} audio={false} token={token} serverUrl={livekitUrl} className="flex flex-col lg:flex-row h-full w-full">
          <div className="flex-1 p-2 sm:p-4 flex flex-col bg-[#050505] relative overflow-hidden">
             {/* 🔥 TESTE DE FOGO: Cliente entra com exatos R$ 10,00 🔥 */}
             <InteractiveRoom clientName={clientName} initialBalance={10.00} />
          </div>
          <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-[45vh] lg:h-full z-20 bg-[#0a0a0a]">
             <ClientChat clientName={clientName} />
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
    </div>
  );
}

export default function LiveClientPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}><LiveClientContent /></Suspense>;
}