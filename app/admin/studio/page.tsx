"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles"; // Estilos originais e bonitos do LiveKit
import { Loader2, ArrowLeft, Video } from "lucide-react";

export default function ModelStudio() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState("");
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://labzsexy-live-oqpryejw.livekit.cloud";

  useEffect(() => {
    // Pegar os dados da modelo do LocalStorage (onde já salvamos no login)
    const storedModelId = localStorage.getItem("labz_model_id");
    const storedModelName = localStorage.getItem("labz_model_name") || "Modelo";

    if (!storedModelId) {
      alert("Você precisa estar logada para acessar o Studio!");
      router.push("/admin");
      return;
    }

    const room = `live_${storedModelId}`; // Cada modelo tem sua própria sala única
    setRoomName(room);
    setModelName(storedModelName);

    // Bater no nosso "Porteiro" para pegar o crachá VIP da modelo
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${room}&username=${encodeURIComponent(storedModelName)}&isModel=true`);
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
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl">
          <h2 className="text-xl font-black text-red-500 uppercase mb-2">Erro no Studio</h2>
          <p>{error}</p>
          <button onClick={() => router.back()} className="mt-6 bg-white/10 px-6 py-2 rounded-full font-bold uppercase hover:bg-white/20">Voltar</button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-[#FF1493] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin mb-4" size={50} />
        <h2 className="text-xl font-black uppercase italic tracking-widest animate-pulse">Preparando Câmeras...</h2>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col">
      {/* HEADER DO STUDIO */}
      <header className="h-16 bg-black border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-50">
        <button onClick={() => {
          if (confirm("Deseja realmente encerrar a transmissão?")) {
            router.push('/admin/dashboard');
          }
        }} className="flex items-center gap-2 text-white/50 hover:text-red-500 transition-colors text-[10px] font-black uppercase">
          <ArrowLeft size={16} /> Encerrar Live
        </button>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <h1 className="text-[#FF1493] font-black uppercase tracking-widest text-sm italic">Studio Ao Vivo</h1>
        </div>
        <div className="text-[10px] text-white/50 font-bold uppercase">Sala: {roomName}</div>
      </header>

      {/* ÁREA DA CÂMERA (LiveKitRoom) */}
      <main className="flex-1 relative">
        <LiveKitRoom
          video={true} // Liga a câmera automaticamente
          audio={true} // Liga o microfone automaticamente
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default" // Usa o tema escuro bonito padrão do LiveKit
          className="h-full w-full"
        >
          {/* Este componente mágico monta a tela de vídeo, controles da câmera e o chat de texto! */}
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>
    </div>
  );
}