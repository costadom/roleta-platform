"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  PreJoin, 
  LocalUserChoices, 
  useTracks, 
  ParticipantTile,
  useChat,
  useRoomContext // Importante para ouvir sinais
} from "@livekit/components-react";
import { Track, RoomEvent, Participant, DataPacket_Kind } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Video, DollarSign, Send, Gift, Users, Eye, Lock, X, Check } from "lucide-react";

// 🔥 COMPONENTE DO PALCO DE VÍDEO DA MODELO 🔥
function MyVideoStage() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {localTrack ? (
        <ParticipantTile 
          trackRef={localTrack} 
          className="w-full h-full [&>video]:object-cover" 
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-[#D946EF]/50">
          <Video size={48} className="animate-pulse" />
          <span className="font-black uppercase tracking-widest text-xs">Câmera Desligada</span>
        </div>
      )}
    </div>
  );
}

// 🔥 MODAL DE PEDIDO DE PRIVADO 🔥
function PrivateRequestModal({ request, onAccept, onDecline }: { request: any, onAccept: () => void, onDecline: () => void }) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-[#0a0a0a] border-2 border-emerald-500 rounded-[2rem] p-10 max-w-lg w-full shadow-[0_0_60px_rgba(16,185,129,0.3)] text-center relative overflow-hidden">
        
        {/* Efeito de brilho de fundo */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <Lock size={36} className="text-emerald-400 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Pedido de Show Privado!</h2>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 bg-emerald-500/10 px-4 py-1 rounded-full">Faturamento: R$ 3,10 / minuto</p>
          
          <p className="text-white/80 text-lg mb-10 font-medium">O cliente <span className="text-[#D946EF] font-black uppercase bg-[#D946EF]/10 px-2.5 py-1 rounded-md text-base">{request.senderName}</span> deseja ir para o privado com você agora.</p>
          
          <div className="grid grid-cols-2 gap-5 w-full">
            <button 
              onClick={onDecline} 
              className="flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-4 rounded-full transition-all text-sm font-black uppercase tracking-widest border border-white/5"
            >
              <X size={18} /> Recusar
            </button>
            <button 
              onClick={onAccept} 
              className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white py-4 rounded-full transition-all text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30"
            >
              <Check size={18} /> Aceitar e Iniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔥 CHAT CUSTOMIZADO VIP 🔥
function CustomChat({ modelName }: { modelName: string }) {
  const { send, chatMessages, isSending } = useChat();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await send(message);
    setMessage("");
  };

  const handleMention = (username: string) => {
    setMessage((prev) => `${prev}@${username} `);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-white/5 bg-black/50 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest flex items-center gap-2">
             <MessageCircle size={16} /> Bate-papo VIP
          </h3>
          <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Clique no nome para mencionar</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/20 text-[10px] uppercase font-black tracking-widest text-center px-4">
            Aguardando mensagens dos fãs...
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.from?.identity === modelName;
            const isSystemAlert = msg.message.startsWith("[SISTEMA]"); 

            if (isSystemAlert) {
              return (
                <div key={i} className="bg-gradient-to-r from-amber-500/20 to-transparent border-l-2 border-amber-500 p-3 rounded-r-xl">
                  <p className="text-amber-400 text-xs font-black uppercase flex items-center gap-2">
                    <Gift size={14} className="animate-bounce" /> {msg.message.replace("[SISTEMA] ", "")}
                  </p>
                </div>
              );
            }

            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span 
                    onClick={() => !isMe && handleMention(msg.from?.name || "Fã")}
                    className={`text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline ${isMe ? 'text-[#D946EF]' : 'text-emerald-400'}`}
                  >
                    {msg.from?.name || "Fã VIP"}
                  </span>
                  <span className="text-[8px] text-white/30">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[90%] shadow-lg ${isMe ? 'bg-[#D946EF] text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm border border-white/5'}`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-black border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 bg-[#141414] border border-white/10 rounded-full p-1 pl-4 focus-within:border-[#D946EF]/50 transition-all">
          <input 
            type="text" 
            placeholder="Fale com a galera..." 
            className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend} 
            disabled={!message.trim() || isSending} 
            className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center shadow-lg hover:bg-[#f062ff] transition-all shrink-0 disabled:opacity-50"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="-ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔥 COMPONENTE QUE OUVE SINAIS DO DATACHANNEL 🔥
function DataListener({ onPrivateRequest }: { onPrivateRequest: (request: any) => void }) {
  const room = useRoomContext();

  useEffect(() => {
    // Função que roda quando chega dados na sala
    const handleDataReceived = (payload: Uint8Array, participant?: Participant, kind?: DataPacket_Kind) => {
      const decoder = new TextDecoder();
      const text = decoder.decode(payload);
      
      try {
        const data = JSON.parse(text);
        
        // Verifica se é um pedido de privado
        if (data.type === "PRIVATE_REQUEST") {
          console.log("Pedido de privado recebido de:", data.senderName);
          // Toca um som de alerta opcional aqui no futuro
          onPrivateRequest(data);
        }
      } catch (e) {
        // Não é um JSON válido, ignora
      }
    };

    // Assina o evento de recebimento de dados
    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Limpa a assinatura ao sair
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onPrivateRequest]);

  return null; // Este componente não renderiza nada visualmente
}

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const modelId = searchParams.get("model");
  const modelSlug = searchParams.get("slug");

  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState("");
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");
  
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [voyeursCount, setVoyeursCount] = useState(0);

  // Estado para controlar o modal de pedido
  const [currentPrivateRequest, setCurrentPrivateRequest] = useState<any>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";

  useEffect(() => {
    if (!modelId) {
      alert("Acesso negado! Use o botão de Entrar ao Vivo pelo seu Painel.");
      router.push("/admin");
      return;
    }

    const room = `live_${modelId}`;
    const displayName = modelSlug || "Musa VIP";
    
    setRoomName(room);
    setModelName(displayName);

    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${room}&username=${encodeURIComponent(displayName)}&isModel=true`);
        const data = await res.json();

        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || "Erro ao gerar token.");
        }
      } catch (err) {
        setError("Falha na conexão com o servidor de Live.");
      }
    };

    fetchToken();
  }, [router, modelId, modelSlug]);

  // Funções do Modal
  const handleAcceptPrivate = () => {
    alert(`Aceitou o privado de ${currentPrivateRequest.senderName}! No próximo passo vamos implementar a lógica que muda a sala para privada e inicia a cobrança.`);
    // TODO: Enviar sinal de aceite de volta para o cliente
    // TODO: Mudar estado da sala para privado
    setIsPrivateMode(true);
    setCurrentPrivateRequest(null);
  };

  const handleDeclinePrivate = () => {
    // TODO: Enviar sinal de recusa de volta para o cliente
    setCurrentPrivateRequest(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl shadow-2xl">
          <h2 className="text-xl font-black text-red-500 uppercase mb-2">Erro no Studio</h2>
          <p>{error}</p>
          <button onClick={() => router.back()} className="mt-6 bg-white/10 px-6 py-2 rounded-full font-bold uppercase hover:bg-white/20">Voltar</button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#D946EF] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={50} />
        <h2 className="text-xl font-black uppercase italic tracking-widest animate-pulse">Autenticando VIP...</h2>
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#D946EF]/30 rounded-[3rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(217,70,239,0.15)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase italic text-[#D946EF] tracking-tighter mb-2">Sala de Preparação</h1>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Ajuste seu vídeo e áudio antes de ficar online</p>
          </div>
          <div className="lk-theme-default">
            <PreJoin
              defaults={{ videoEnabled: true, audioEnabled: true }}
              onSubmit={(values) => setPreJoinChoices(values)}
              className="!bg-transparent !p-0"
              joinLabel="Iniciar Transmissão"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      
      {/* MODAL DE PEDIDO (Aparece sobre tudo) */}
      <PrivateRequestModal 
        request={currentPrivateRequest} 
        onAccept={handleAcceptPrivate} 
        onDecline={handleDeclinePrivate} 
      />

      <header className="h-20 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => {
            if (confirm("Deseja realmente encerrar a transmissão?")) {
              router.push(`/admin/dashboard?model=${modelId}&slug=${modelSlug}`);
            }
          }} className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-3 rounded-full hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase shadow-lg">
            <ArrowLeft size={14} /> Encerrar
          </button>
          
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-full border border-white/10">
            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{isPrivateMode ? 'Show Privado' : 'Sala Pública'}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 border border-emerald-500/50 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <DollarSign size={24} className="text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[9px] text-emerald-400/80 font-black uppercase tracking-widest">Ganhos da Sessão</span>
            <span className="text-xl font-black text-white leading-none">R$ {sessionEarnings.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        <LiveKitRoom
          video={preJoinChoices.videoEnabled} 
          audio={preJoinChoices.audioEnabled} 
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          className="flex flex-col lg:flex-row h-full w-full"
        >
          {/* 🔥 Componente invisível que ouve os sinais 🔥 */}
          <DataListener onPrivateRequest={setCurrentPrivateRequest} />

          {/* VÍDEO DA MODELO */}
          <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
             
             <div className="absolute top-10 left-10 z-30 flex flex-col gap-3 pointer-events-none">
                <div className={`text-white text-[10px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2 shadow-xl ${isPrivateMode ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`}>
                  {isPrivateMode ? <Lock size={12} /> : <span className="w-2.5 h-2.5 bg-white rounded-full"></span>} 
                  {isPrivateMode ? 'PRIVADO VIP' : 'AO VIVO'}
                </div>
                {isPrivateMode && (
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full flex items-center gap-2">
                    <Eye size={12} className="text-amber-400" /> {voyeursCount} Voyeurs
                  </div>
                )}
             </div>

             <div className="w-full h-full max-w-5xl h-full relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border-4 border-[#D946EF] shadow-[0_0_50px_rgba(217,70,239,0.4)] bg-black">
                <div className="absolute inset-0 pointer-events-none border border-[#D946EF]/50 rounded-[2.5rem] z-10 shadow-[inset_0_0_30px_rgba(217,70,239,0.3)]"></div>
                <MyVideoStage />
             </div>
          </div>

          {/* NOSSO CHAT CUSTOMIZADO VIP */}
          <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-[45vh] lg:h-full z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
             <CustomChat modelName={modelName} />
          </div>

          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default function ModelStudio() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <StudioContent />
    </Suspense>
  );
}
