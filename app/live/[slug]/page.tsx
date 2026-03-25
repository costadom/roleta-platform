"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  useTracks, 
  VideoTrack,
  useChat,
  useRoomContext // Importante para enviar sinais
} from "@livekit/components-react";
import { Track, PublishDataOptions } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet, X } from "lucide-react";

// 🔥 COMPONENTE QUE PUXA O VÍDEO DA MODELO 🔥
function ModelVideoFeed() {
  const tracks = useTracks([Track.Source.Camera]);
  const remoteTrack = tracks.find(t => !t.participant.isLocal);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {remoteTrack ? (
        <VideoTrack 
          trackRef={remoteTrack} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-[#D946EF]/50 z-20">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse text-center px-6">Aguardando a modelo iniciar...<br/>(Verifique se ela está transmitindo no Studio)</span>
        </div>
      )}
    </div>
  );
}

// 🔥 BOTÕES FLUTUANTES REDESENHADOS E LÓGICA DE SINAL 🔥
function FloatingActions({ clientName }: { clientName: string }) {
  // Pegamos o contexto da sala para enviar dados
  const room = useRoomContext();
  const [requestingPrivate, setRequestingPrivate] = useState(false);

  const handleRequestPrivate = async () => {
    if (requestingPrivate) return;
    setRequestingPrivate(true);
    
    // Payload da mensagem
    const payload = JSON.stringify({
      type: "PRIVATE_REQUEST",
      senderName: clientName,
      timestamp: Date.now()
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    try {
      // Envia o sinal para todos na sala (a modelo vai ouvir)
      await room.localParticipant.publishData(data, { reliable: true });
      alert("Pedido de Show Privado enviado! Aguardando aceite da modelo...");
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      alert("Falha ao enviar pedido. Tente novamente.");
    } finally {
      // Simulando um timeout para o botão voltar ao normal se ela não aceitar
      setTimeout(() => setRequestingPrivate(false), 30000); 
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3 bg-black/60 backdrop-blur-lg p-2 rounded-full border border-white/10 shadow-2xl">
      <button 
        onClick={() => alert("Janela de Presentes em breve!")} 
        className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group border border-white/5"
        title="Enviar Presente"
      >
        <Gift size={24} className="text-[#D946EF] group-hover:scale-110 transition-transform" />
      </button>

      <button 
        onClick={handleRequestPrivate} 
        disabled={requestingPrivate}
        className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white px-7 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
      >
        {requestingPrivate ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Lock size={20} className="animate-pulse" />
        )}
        <div className="flex flex-col items-start leading-none">
          <span className="text-xs font-black uppercase tracking-widest text-shadow-sm">
            {requestingPrivate ? 'Aguardando...' : 'Chamar Privado'}
          </span>
          <span className="text-[9px] text-white/90 uppercase font-bold mt-0.5">R$ 3,10 / min</span>
        </div>
      </button>
    </div>
  );
}

// 🔥 CHAT DO CLIENTE 🔥
function ClientChat({ clientName }: { clientName: string }) {
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="p-4 border-b border-white/5 bg-black/50 flex justify-between items-center shrink-0">
        <h3 className="text-[#D946EF] font-black uppercase text-xs tracking-widest flex items-center gap-2">
           <MessageCircle size={16} /> Bate-papo da Sala
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatContainerRef}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/20 text-[10px] uppercase font-black tracking-widest text-center px-4">
            Seja o primeiro a mandar mensagem!
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.from?.identity === clientName;
            const isSystemAlert = msg.message.startsWith("[SISTEMA]"); 

            if (isSystemAlert) {
              return (
                <div key={i} className="bg-gradient-to-r from-amber-500/20 to-transparent border-l-2 border-amber-500 p-3 rounded-r-xl">
                  <p className="text-amber-400 text-[11px] font-black uppercase flex items-center gap-2">
                    <Gift size={14} className="animate-bounce" /> {msg.message.replace("[SISTEMA] ", "")}
                  </p>
                </div>
              );
            }

            const isModelMessage = msg.from?.identity.includes("modelo"); 

            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isModelMessage ? 'text-[#D946EF]' : 'text-emerald-400'}`}>
                    {msg.from?.name || "Usuário"} {isModelMessage && "👑"}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl text-sm max-w-[90%] shadow-lg ${isMe ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' : isModelMessage ? 'bg-[#D946EF]/20 border border-[#D946EF]/50 text-white rounded-tl-sm' : 'bg-black text-white rounded-tl-sm border border-white/5'}`}>
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
            placeholder="Mande uma mensagem..." 
            className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend} 
            disabled={!message.trim() || isSending} 
            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-400 transition-all shrink-0 disabled:opacity-50"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="-ml-0.5" />}
          </button>
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
  const [roomName, setRoomName] = useState(""); // Nome da sala real buscado na API
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Dados mockados do cliente (pegar do banco no futuro)
  const [clientBalance, setClientBalance] = useState(150.00); 
  const [clientName, setClientName] = useState("");

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";
  
  useEffect(() => {
    // 1. Gera um nome temporário para o cliente e busca o ID real da modelo
    const initPage = async () => {
      setLoading(true);
      const tempName = localStorage.getItem('labz_client_name') || "Fã_" + Math.floor(Math.random() * 10000);
      localStorage.setItem('labz_client_name', tempName);
      setClientName(tempName);

      try {
        // Bate na nossa nova API para pegar o ID da modelo pelo Slug
        const resModel = await fetch(`/api/models/id-by-slug?slug=${modelSlug}`);
        const dataModel = await resModel.json();

        if (dataModel.id) {
          const realRoom = `live_${dataModel.id}`;
          setRoomName(realRoom);

          // 2. Busca o Token do LiveKit usando a sala CORRETA
          const resToken = await fetch(`/api/livekit/token?room=${realRoom}&username=${encodeURIComponent(tempName)}&isModel=false`);
          const dataToken = await resToken.json();

          if (dataToken.token) {
            setToken(dataToken.token);
          } else {
            setError(dataToken.error || "Erro ao gerar acesso ao vídeo.");
          }
        } else {
          setError("Modelo não encontrada ou offline.");
        }
      } catch (err) {
        console.error(err);
        setError("Falha na conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    };

    if (modelSlug) {
      initPage();
    }
  }, [modelSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#D946EF] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin mb-4" size={50} />
        <h2 className="text-sm font-black uppercase italic tracking-widest animate-pulse">Conectando à sala VIP de {modelSlug}...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
        <X size={50} className="text-red-500 mb-4" />
        <p className="text-white/80 font-bold max-w-md">{error}</p>
        <button onClick={() => router.push('/hub')} className="mt-8 bg-[#D946EF] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg">Voltar para o Hub</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      {token && roomName && (
        <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
          
          {/* CABEÇALHO DO CLIENTE */}
          <header className="h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/hub')} className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase">
                <ArrowLeft size={14} /> Hub
              </button>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>
                <h1 className="text-white font-black uppercase tracking-widest text-sm">{modelSlug} <span className="text-[#D946EF] italic">AO VIVO</span></h1>
              </div>
            </div>

            {/* CARTEIRA DO CLIENTE */}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
              <Wallet size={16} className="text-emerald-400" />
              <span className="text-emerald-400 font-black text-xs">R$ {clientBalance.toFixed(2).replace('.', ',')}</span>
              <span className="text-[8px] text-white/50 uppercase font-bold ml-1 hidden sm:inline">Comprar +</span>
            </div>
          </header>

          <main className="flex-1 relative flex overflow-hidden">
            <LiveKitRoom
              video={false} 
              audio={false} 
              token={token}
              serverUrl={livekitUrl}
              data-lk-theme="default"
              className="flex flex-col lg:flex-row h-full w-full"
            >
              {/* LADO ESQUERDO: VÍDEO DA MODELO */}
              <div className="flex-1 p-2 sm:p-4 flex flex-col bg-[#050505] relative overflow-hidden">
                 <div className="w-full h-full relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border border-white/5">
                    
                    <ModelVideoFeed />
                    
                    {/* Gradiente sutil inferior para garantir leitura dos botões */}
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none"></div>

                    {/* 🔥 NOVOS BOTÕES FLUTUANTES REDESENHADOS 🔥 */}
                    <FloatingActions clientName={clientName} />
                 </div>
              </div>

              {/* LADO DIREITO: CHAT DO CLIENTE */}
              <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-[45vh] lg:h-full z-20 bg-[#0a0a0a]">
                 <ClientChat clientName={clientName} />
              </div>

              <RoomAudioRenderer />
            </LiveKitRoom>
          </main>

          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
          `}</style>
        </div>
      )}
    </Suspense>
  );
}

export default function LiveClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LiveClientContent />
    </Suspense>
  );
}
