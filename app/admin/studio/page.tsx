"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  PreJoin, 
  LocalUserChoices, 
  useTracks, 
  ParticipantTile, 
  Chat 
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { Loader2, ArrowLeft, MessageCircle, Video } from "lucide-react";

// 🔥 COMPONENTE DO PALCO DE VÍDEO DA MODELO 🔥
function MyVideoStage() {
  // Pega as câmeras ligadas na sala (Como a modelo é a única que transmite, será a dela)
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {localTrack ? (
        <ParticipantTile 
          trackRef={localTrack} 
          // Força o vídeo a preencher todo o espaço sem distorcer
          className="w-full h-full [&>video]:object-cover" 
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-[#FF1493]/50">
          <Video size={48} className="animate-pulse" />
          <span className="font-black uppercase tracking-widest text-xs">Câmera Desligada</span>
        </div>
      )}
    </div>
  );
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
  
  // Estado que guarda as escolhas da modelo na "Sala de Maquiagem" (Pre-Join)
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);

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
      <div className="min-h-screen bg-[#050505] text-[#FF1493] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={50} />
        <h2 className="text-xl font-black uppercase italic tracking-widest animate-pulse">Autenticando VIP...</h2>
      </div>
    );
  }

  // 🔥 1. TELA DE PREPARAÇÃO (SALA DE MAQUIAGEM) 🔥
  if (!preJoinChoices) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#FF1493]/30 rounded-[3rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(255,20,147,0.15)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase italic text-[#FF1493] tracking-tighter mb-2">Sala de Preparação</h1>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Ajuste seu vídeo e áudio antes de ficar online</p>
          </div>
          
          {/* Componente Nativo do LiveKit para Preview */}
          <div className="lk-theme-default">
            <PreJoin
              defaults={{
                videoEnabled: true,
                audioEnabled: true,
              }}
              onSubmit={(values) => setPreJoinChoices(values)}
              className="!bg-transparent !p-0"
            />
          </div>
        </div>
      </div>
    );
  }

  // 🔥 2. TELA AO VIVO (STUDIO COM NEON E CHAT) 🔥
  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col overflow-hidden">
      
      {/* CABEÇALHO */}
      <header className="h-16 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <button onClick={() => {
          if (confirm("Deseja realmente encerrar a transmissão?")) {
            router.push(`/admin/dashboard?model=${modelId}&slug=${modelSlug}`);
          }
        }} className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase">
          <ArrowLeft size={14} /> Encerrar Live
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-[#FF1493] font-black uppercase tracking-widest text-sm italic">Studio VIP</h1>
        </div>
        <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">Sala: {roomName}</div>
      </header>

      <main className="flex-1 relative flex">
        <LiveKitRoom
          video={preJoinChoices.videoEnabled} 
          audio={preJoinChoices.audioEnabled} 
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          className="flex flex-col lg:flex-row h-full w-full"
        >
          {/* LADO ESQUERDO: VÍDEO DA MODELO COM NEON */}
          <div className="flex-1 p-4 sm:p-8 flex items-center justify-center bg-[#050505] relative overflow-hidden">
             <div className="w-full h-full max-w-4xl max-h-[85vh] relative rounded-[3rem] overflow-hidden border-4 border-[#FF1493] shadow-[0_0_50px_rgba(255,20,147,0.4)] bg-black">
                
                {/* Overlay Neon Extra e Selo AO VIVO */}
                <div className="absolute inset-0 pointer-events-none border border-[#FF1493]/50 rounded-[3rem] z-10 shadow-[inset_0_0_30px_rgba(255,20,147,0.3)]"></div>
                <div className="absolute top-6 left-6 z-20 bg-red-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-full animate-pulse flex items-center gap-2 shadow-lg shadow-red-500/50">
                  <span className="w-2.5 h-2.5 bg-white rounded-full"></span> AO VIVO
                </div>

                {/* Feed de Câmera */}
                <MyVideoStage />
             </div>
          </div>

          {/* LADO DIREITO: CHAT FIXO */}
          <div className="w-full lg:w-96 bg-[#0a0a0a] border-l border-white/5 flex flex-col shrink-0 h-[40vh] lg:h-full">
            <div className="p-5 border-b border-white/5 bg-black/50">
              <h3 className="text-[#FF1493] font-black uppercase text-xs tracking-widest flex items-center gap-2">
                 <MessageCircle size={16} /> Bate-papo da Sala
              </h3>
              <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Interaja com seus fãs em tempo real</p>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <Chat />
            </div>
          </div>

          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
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