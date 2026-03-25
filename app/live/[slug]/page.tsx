"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack, useChat, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet, X, AlertTriangle } from "lucide-react";

// 🔥 SISTEMA DE NOTIFICAÇÃO VIP (Substitui o Alert travado) 🔥
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

function ClientChat({ clientName }: { clientName: string }) {
  const { send, chatMessages, isSending } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await send(message);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-white/5 bg-black/50 flex justify-between items-center shrink-0">
        <h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest flex items-center gap-2"><MessageCircle size={16} /> Bate-papo da Sala</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/20 text-[10px] uppercase font-black tracking-widest text-center px-4">Seja o primeiro a mandar mensagem!</div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.from?.identity === clientName;
            const isModelMessage = msg.from?.identity.includes("modelo"); 
            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isModelMessage ? 'text-[#D946EF]' : 'text-emerald-400'}`}>{msg.from?.name || "Usuário"} {isModelMessage && "👑"}</span>
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[90%] shadow-lg ${isMe ? 'bg-white/10 text-white rounded-tr-sm' : isModelMessage ? 'bg-[#D946EF]/20 border border-[#D946EF]/50 text-white rounded-tl-sm' : 'bg-black text-white rounded-tl-sm border border-white/5'}`}>{msg.message}</div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-4 bg-black border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4 focus-within:border-[#D946EF]/50 transition-all">
          <input type="text" placeholder="Mande uma mensagem..." className="flex-1 bg-transparent border-none text-xs text-white outline-none" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} disabled={!message.trim() || isSending} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 shrink-0 disabled:opacity-50"><Send size={16} className="-ml-0.5" /></button>
        </div>
      </div>
    </div>
  );
}

// 🔥 LÓGICA DE SALA COM COBRANÇA E RESPOSTAS DA MODELO 🔥
function InteractiveRoom({ clientName, initialBalance }: { clientName: string, initialBalance: number }) {
  const room = useRoomContext();
  const router = useRouter();
  
  const [balance, setBalance] = useState(initialBalance);
  const [requestingPrivate, setRequestingPrivate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Modos da sala
  const [isPrivateShow, setIsPrivateShow] = useState(false);
  
  // Cronômetros de Cobrança
  const [secondsInRoom, setSecondsInRoom] = useState(0);
  const [kickWarning, setKickWarning] = useState<number | null>(null); // Contagem regressiva de 15s

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Escuta os sinais da modelo (Ouvindo o "Sim")
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        // Se a modelo aceitou e a mensagem for para nós
        if (data.type === "PRIVATE_ACCEPTED" && data.targetClient === clientName) {
          setIsPrivateShow(true);
          setRequestingPrivate(false);
          showToast("A Modelo Aceitou! O Show Privado Começou (R$ 3,10/min)");
        }
      } catch (e) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, clientName]);

  // 🔥 O MOTOR DE COBRANÇA (A cada segundo atualiza a conta) 🔥
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsInRoom(prev => prev + 1);
      
      setBalance(currentBalance => {
        let newBalance = currentBalance;
        
        // Regra do Privado: Desconta R$ 3,10 a cada 60 segundos
        if (isPrivateShow && secondsInRoom > 0 && secondsInRoom % 60 === 0) {
          newBalance -= 3.10;
        } 
        // Regra Pública: Desconta R$ 0,50 a cada 20 segundos
        else if (!isPrivateShow && secondsInRoom > 0 && secondsInRoom % 20 === 0) {
          newBalance -= 0.50;
        }

        // Se o saldo acabar, inicia o kick de 15s
        if (newBalance < 0.50) {
          setKickWarning(prev => {
            if (prev === null) return 15; // Inicia o aviso
            if (prev <= 1) {
              router.push('/hub'); // Chuta da sala
              return 0;
            }
            return prev - 1; // Diminui o contador
          });
        } else {
          setKickWarning(null); // Se ele recarregar (futuro), tira o aviso
        }

        return newBalance;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsInRoom, isPrivateShow, router]);

  const handleRequestPrivate = async () => {
    if (balance < 3.10) {
      showToast("Saldo insuficiente para iniciar o privado!");
      return;
    }
    setRequestingPrivate(true);
    const payload = JSON.stringify({ type: "PRIVATE_REQUEST", senderName: clientName, timestamp: Date.now() });
    
    try {
      await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      showToast("Pedido enviado! Aguardando a modelo aceitar...");
      setTimeout(() => setRequestingPrivate(false), 20000); // Cancela o botão após 20s se ela não responder
    } catch (error) {
      showToast("Erro ao enviar pedido.");
      setRequestingPrivate(false);
    }
  };

  return (
    <>
      <ToastNotification message={toastMsg} onClose={() => setToastMsg(null)} />
      
      {/* ALERTA DE SALDO ZERADO (Aparece sobre o vídeo) */}
      {kickWarning !== null && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-6 text-center animate-pulse">
           <AlertTriangle size={64} className="text-white mb-4" />
           <h2 className="text-3xl font-black text-white uppercase mb-2">Seus créditos acabaram!</h2>
           <p className="text-white/80 font-bold mb-6">Você será desconectado da sala em <span className="text-4xl text-white">{kickWarning}s</span></p>
           <button className="bg-emerald-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)]">Comprar Créditos Agora</button>
        </div>
      )}

      {/* OVERLAY DE VÍDEO E BOTÕES */}
      <div className="w-full h-full relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-white/5">
         
         <ModelVideoFeed />
         
         {/* Top Info Flutuante */}
         <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
            <Wallet size={14} className="text-emerald-400" />
            <span className="text-emerald-400 font-black text-[10px]">R$ {balance.toFixed(2).replace('.', ',')}</span>
         </div>

         {/* Selo Privado Ativo */}
         {isPrivateShow && (
           <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-indigo-600 border border-indigo-400 px-4 py-2 rounded-full animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.5)]">
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
    </>
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
      } catch (err) {
        setError("Falha na conexão.");
      }
    };
    if (modelSlug) initPage();
  }, [modelSlug, roomName]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
        <X size={50} className="text-red-500 mb-4" />
        <p className="text-white/80 font-bold">{error}</p>
        <button onClick={() => router.push('/hub')} className="mt-8 bg-[#D946EF] text-white px-8 py-3 rounded-full font-bold uppercase text-xs">Voltar</button>
      </div>
    );
  }

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
             {/* Passa o nome e 15 reais de teste para o cliente ver o kick acontecer após um tempo */}
             <InteractiveRoom clientName={clientName} initialBalance={1.50} />
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