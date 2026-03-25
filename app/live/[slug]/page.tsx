"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  useTracks, 
  VideoTrack,
  useChat
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Send, Gift, Lock, Wallet } from "lucide-react";

// 🔥 COMPONENTE QUE PUXA O VÍDEO DA MODELO 🔥
function ModelVideoFeed() {
  // Pega as câmeras da sala. Como o cliente não transmite, ele pega a da modelo.
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
        <div className="flex flex-col items-center gap-4 text-[#D946EF]/50">
          <Loader2 size={48} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs animate-pulse">Aguardando a modelo iniciar...</span>
        </div>
      )}
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
                  <p className="text-amber-400 text-xs font-black uppercase flex items-center gap-2">
                    <Gift size={14} className="animate-bounce" /> {msg.message.replace("[SISTEMA] ", "")}
                  </p>
                </div>
              );
            }

            // Destaca a mensagem se for da Modelo
            const isModelMessage = msg.from?.identity.includes("modelo") || msg.from?.identity.includes("admin"); // Ajustaremos a regra real depois

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
  const [error, setError] = useState("");
  
  // No futuro, pegaremos isso do banco de dados/hub
  const [clientBalance, setClientBalance] = useState(150.00); 
  const clientName = "Cliente_" + Math.floor(Math.random() * 1000); // Nome aleatório para teste

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";
  
  // Usamos o slug da modelo para saber qual sala entrar (ex: live_123xyz)
  // Como não temos o ID dela aqui ainda, vamos usar uma lógica simplificada para o teste bater com a sala dela
  const roomName = `live_clp6v2abc000008l41234abcd`; // IMPORTANTE: No futuro, buscaremos o ID real dela baseado no slug

  useEffect(() => {
    // Busca o crachá de ESPECTADOR (isModel=false)
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${roomName}&username=${encodeURIComponent(clientName)}&isModel=false`);
        const data = await res.json();

        if (data.token) {
          setToken(data.token);
        } else {
          setError(data.error || "Erro ao gerar token.");
        }
      } catch (err) {
        setError("Falha na conexão.");
      }
    };

    fetchToken();
  }, [roomName, clientName]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold">{error}</p>
        <button onClick={() => router.back()} className="mt-4 bg-white/10 px-4 py-2 rounded-full">Voltar</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#D946EF] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={50} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      
      {/* CABEÇALHO DO CLIENTE */}
      <header className="h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/hub')} className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase">
            <ArrowLeft size={14} /> Hub
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            <h1 className="text-white font-black uppercase tracking-widest text-sm">{modelSlug} <span className="text-[#D946EF]">AO VIVO</span></h1>
          </div>
        </div>

        {/* CARTEIRA DO CLIENTE */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
          <Wallet size={16} className="text-emerald-400" />
          <span className="text-emerald-400 font-black text-xs">R$ {clientBalance.toFixed(2).replace('.', ',')}</span>
          <span className="text-[8px] text-white/50 uppercase font-bold ml-1">Comprar +</span>
        </div>
      </header>

      <main className="flex-1 relative flex">
        <LiveKitRoom
          video={false} // Cliente não liga a câmera
          audio={false} // Cliente não liga o microfone
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          className="flex flex-col lg:flex-row h-full w-full"
        >
          {/* LADO ESQUERDO: VÍDEO DA MODELO E BOTÕES DE AÇÃO */}
          <div className="flex-1 p-2 sm:p-6 flex flex-col bg-[#050505] relative overflow-hidden">
             
             <div className="w-full h-full relative rounded-3xl sm:rounded-[3rem] overflow-hidden bg-black shadow-2xl">
                {/* Overlay Escuro sutil em cima e embaixo para os botões aparecerem bem */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10 pointer-events-none"></div>
                
                {/* Vídeo */}
                <ModelVideoFeed />

                {/* PAINEL DE BOTÕES DE AÇÃO (Flutuando sobre o vídeo) */}
                <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-4 px-4">
                   <button onClick={() => alert("Lógica de Presente em breve!")} className="flex-1 max-w-[200px] flex items-center justify-center gap-2 bg-[#D946EF]/20 hover:bg-[#D946EF]/40 border border-[#D946EF] text-white px-6 py-4 rounded-2xl backdrop-blur-md transition-all group">
                     <Gift size={20} className="text-[#D946EF] group-hover:scale-110 transition-transform" />
                     <div className="flex flex-col items-start">
                       <span className="text-xs font-black uppercase tracking-widest">Mimar</span>
                       <span className="text-[9px] text-white/70 uppercase">Enviar Presente</span>
                     </div>
                   </button>

                   <button onClick={() => alert("Lógica de Cobrança em breve!")} className="flex-1 max-w-[250px] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                     <Lock size={20} className="animate-pulse" />
                     <div className="flex flex-col items-start">
                       <span className="text-xs font-black uppercase tracking-widest text-shadow-sm">Ir para o Privado</span>
                       <span className="text-[9px] text-white/90 uppercase font-bold">R$ 3,10 / min</span>
                     </div>
                   </button>
                </div>
             </div>
          </div>

          {/* LADO DIREITO: CHAT DO CLIENTE */}
          <div className="w-full lg:w-96 border-l border-white/5 flex flex-col shrink-0 h-[40vh] lg:h-full z-20 bg-[#0a0a0a]">
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
  );
}

export default function LiveClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LiveClientContent />
    </Suspense>
  );
}
