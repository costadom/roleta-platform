"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X as CloseIcon, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  LayoutGrid, Zap, Trophy, MessageCircle, Star, Home, Heart, 
  Sparkles, AlertTriangle, Gift
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const NoticeModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[2rem] w-full max-w-sm text-center shadow-[0_0_50px_rgba(217,70,239,0.2)] animate-in zoom-in-95">
      <AlertTriangle size={40} className="text-[#D946EF] mx-auto mb-5 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
      <p className="text-white font-black uppercase italic text-sm mb-8 leading-relaxed tracking-widest">{message}</p>
      <button onClick={onClose} className="bg-[#D946EF] text-white w-full py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-[0_5px_20px_rgba(217,70,239,0.4)]">Entendi</button>
    </div>
  </div>
);

const ScratchCanvas = ({ onReveal, isRevealed, coverText }: { onReveal: () => void, isRevealed: boolean, coverText: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    revealedRef.current = isRevealed;
    if (isRevealed && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [isRevealed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.globalCompositeOperation = 'source-over';
    
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#888");
    gradient.addColorStop(0.5, "#e0e0e0");
    gradient.addColorStop(1, "#666");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for(let i=0; i<4000; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    ctx.fillStyle = "#222";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coverText, width / 2, height / 2);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 55; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [coverText]);

  const getPointerPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: any) => {
    if (revealedRef.current) return;
    setIsDrawing(true);
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMove = (e: any) => {
    if (!isDrawing || revealedRef.current) return;
    const { x, y } = getPointerPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (ctx && canvas) {
      ctx.lineTo(x, y);
      ctx.stroke();
      checkReveal(ctx, canvas);
    }
  };

  const handleEnd = () => setIsDrawing(false);

  const checkReveal = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (Math.random() > 0.15) return; 
      
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      const totalPixels = pixels.length / 4;
      
      for (let i = 3; i < pixels.length; i += 128) {
          if (pixels[i] === 0) transparent++;
      }
      
      const percent = (transparent / (totalPixels / 32)) * 100;
      
      if (percent > 40 && !revealedRef.current) {
          revealedRef.current = true;
          ctx.clearRect(0, 0, canvas.width, canvas.height); 
          onReveal();
      }
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={500}
      className={`absolute inset-0 w-full h-full cursor-crosshair touch-none z-20 ${isRevealed ? 'pointer-events-none opacity-0 transition-opacity duration-700' : ''}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};

export default function RaspadinhaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [model, setModel] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [modelPhotos, setModelPhotos] = useState<any[]>([]);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [notice, setNotice] = useState("");
  
  const [scratchQueue, setScratchQueue] = useState<any[]>([]); 
  const [currentScratch, setCurrentScratch] = useState<any>(null); 
  const [isRevealed, setIsRevealed] = useState(false); 
  const [queueIndex, setQueueIndex] = useState(0); 
  const [totalInPackage, setTotalInPackage] = useState(0); 
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const phone = localStorage.getItem("labz_player_phone");
      if (!phone) {
          setNotice("Faça login na vitrine para jogar.");
          setLoading(false);
          return;
      }

      const { data: modelData, error: modErr } = await supabase.from('Models').select('*, Configs(*)').eq('slug', slug).single();
      if (modErr || !modelData) throw new Error("Musa não encontrada.");
      
      setModel(modelData);
      const config = Array.isArray(modelData.Configs) ? modelData.Configs[0] : modelData.Configs;
      setBackgroundUrl(config?.bg_url || "");
      setModelName(config?.model_name || slug);

      const { data: photos } = await supabase.from('ModelScratchPhotos').select('*').eq('model_id', modelData.id).eq('active', true);
      setModelPhotos(photos || []);

      const { data: playerData } = await supabase.from('Players').select('*').eq('whatsapp', phone).eq('model_id', modelData.id).single();
      if (playerData) {
        setPlayer(playerData);
        const { data: history } = await supabase.from('ScratchHistory').select('*').eq('player_id', playerData.id);
        setUnlockedPhotos(history || []);
      }
    } catch (err: any) { 
        setNotice(err.message || "Erro de conexão."); 
    } finally { 
        setLoading(false); 
    }
  }

  const shuffleArray = (array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  const buyPackage = async (bundleSize: number) => {
    if (scratchQueue.length > 0) return setNotice("Termine de raspar seu pacote atual primeiro!");
    if (!player) return setNotice("Faça login para jogar.");
    if (unlockedPhotos.length >= 10) return setNotice("Coleção completa! Você já tem todas as fotos VIP dessa musa.");

    const cost = bundleSize === 10 ? 14 : bundleSize === 5 ? 8 : 2;
    if (player.credits < cost) return setShowDeposit(true);

    setIsProcessingBuy(true);

    try {
        const winThreshold = bundleSize === 10 ? 0.30 : bundleSize === 5 ? 0.50 : 0.65;
        let currentCredits = player.credits - cost;
        
        await supabase.from('Players').update({ credits: currentCredits }).eq('id', player.id);
        setPlayer({...player, credits: currentCredits});

        const availablePhotos = modelPhotos.filter(mp => !unlockedPhotos.find(up => up.photo_url === mp.photo_url));
        let pool = [...availablePhotos]; 
        let generatedQueue = [];

        for (let i = 0; i < bundleSize; i++) {
            if (Math.random() > winThreshold && pool.length > 0) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                const wonPhoto = pool.splice(randomIndex, 1)[0];
                generatedQueue.push({ type: 'win', photo_url: wonPhoto.photo_url });
            } else {
                generatedQueue.push({ type: 'loss' }); 
            }
        }

        generatedQueue = shuffleArray(generatedQueue);

        setScratchQueue(generatedQueue);
        setTotalInPackage(bundleSize);
        setQueueIndex(1);
        setCurrentScratch(generatedQueue[0]);
        setIsRevealed(false);
    } catch(e) {
        setNotice("Ocorreu um erro ao processar seu pacote.");
    } finally {
        setIsProcessingBuy(false);
    }
  };

  const handleReveal = async () => {
      setIsRevealed(true);
      
      if (currentScratch && currentScratch.type === 'win' && currentScratch.photo_url) {
          try {
              await supabase.from('ScratchHistory').insert([{
                  player_id: player.id,
                  model_id: model.id,
                  photo_url: currentScratch.photo_url
              }]);
              setUnlockedPhotos(prev => [...prev, { photo_url: currentScratch.photo_url }]);
              confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 9999, colors: ['#D946EF', '#FFD700', '#ffffff'] });
          } catch(e) {
              console.error("Erro ao salvar", e);
          }
      }
  };

  const nextScratch = () => {
      if (queueIndex < scratchQueue.length) {
          setCurrentScratch(scratchQueue[queueIndex]);
          setQueueIndex(prev => prev + 1);
          setIsRevealed(false);
      } else {
          setScratchQueue([]);
          setCurrentScratch(null);
          setQueueIndex(0);
          setTotalInPackage(0);
      }
  };

  useEffect(() => {
    let interval: any;
    if (pixData && !pixPaid) {
      interval = setInterval(async () => {
        try {
            const { data } = await supabase.from('Players').select('credits').eq('id', player?.id).single();
            if (data && data.credits > player.credits) {
            setPixPaid(true);
            setPlayer({ ...player, credits: data.credits });
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, zIndex: 9999 });
            clearInterval(interval);
            }
        } catch(e) {}
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid, player]);

  useEffect(() => {
    let timer: any;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const handleGeneratePix = async (amount: number) => {
    setPixLoading(true);
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: player?.id }),
      });
      if(!res.ok) throw new Error();
      const data = await res.json();
      setPixData(data);
      setPixTimeLeft(600);
    } catch (e) { setNotice("Falha ao gerar o Pix. Tente novamente."); } finally { setPixLoading(false); }
  };

  if (loading) return <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-[#D946EF] font-black uppercase text-xs animate-pulse tracking-widest">Carregando Labz...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center font-sans select-none">
      
      {notice && <NoticeModal message={notice} onClose={() => setNotice("")} />}

      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 shadow-2xl overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        <div className="absolute inset-0 z-0 pointer-events-none fixed">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-all duration-1000" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-transparent to-[#050505]" />
        </div>

        <div className="relative z-10 p-4 flex flex-col gap-3 shrink-0">
           <div className="flex justify-between items-center px-1">
              <button onClick={() => router.push(`/${slug}`)} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all"><ArrowLeft size={12} /> Vitrine</button>
              <div className="flex gap-2">
                 <button onClick={() => setShowProfile(true)} className="w-9 h-9 bg-black/40 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all"><User size={16}/></button>
              </div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[#D946EF] font-black italic text-2xl tracking-tighter drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
              <span className="text-[9px] text-[#FFD700] font-black uppercase mt-1 tracking-[0.3em] italic flex items-center gap-1"><Sparkles size={10} fill="currentColor"/> Raspadinha {modelName}</span>
           </div>
        </div>

        <div className="w-full h-9 bg-[#111]/80 border-y border-[#D946EF]/20 backdrop-blur-md overflow-hidden flex items-center relative shrink-0">
          <div className="flex whitespace-nowrap animate-marquee">
            { NAMES.map((name, i) => (
              <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter"><Star size={11} className="text-[#FFD700]" fill="currentColor"/><span className="text-white/60">{name}</span><span className="text-white">REVELOU</span><span className="text-[#D946EF]">FOTO VIP</span></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 px-4">
          
          <div className="w-full max-w-[320px] aspect-[4/5] bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#D946EF]/40 rounded-[2.5rem] shadow-[0_0_60px_rgba(217,70,239,0.2)] relative overflow-hidden shrink-0">
             
             {currentScratch ? (
                 <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#111]">
                     {currentScratch.type === 'win' ? (
                         <>
                             <img src={currentScratch.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="VIP" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                             <div className="absolute bottom-0 left-0 w-full p-6 text-center animate-in slide-in-from-bottom-4">
                                 <span className="bg-[#D946EF] border border-[#D946EF]/50 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2 mx-auto w-max"><Gift size={14}/> FOTO REVELADA</span>
                             </div>
                         </>
                     ) : (
                         <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#1a0510] to-[#050505] w-full h-full">
                             <div className="w-24 h-24 rounded-full bg-[#D946EF]/10 border border-[#D946EF]/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(217,70,239,0.2)]">
                               <CloseIcon size={40} className="text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                             </div>
                             <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3 drop-shadow-lg">Veio o X</h3>
                             <p className="text-[10px] text-white/50 uppercase font-bold tracking-[0.2em] leading-relaxed">Que pena amor!<br/>Sua foto estava quase saindo.</p>
                         </div>
                     )}
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#050505]">
                    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <ImageIcon size={40} className="text-[#D946EF]/50" />
                    </div>
                    <h3 className="text-white/60 font-black uppercase italic text-lg tracking-widest drop-shadow-md">Raspadinha VIP</h3>
                    <p className="text-[9px] font-black text-white/30 uppercase mt-4 text-center px-8 tracking-widest leading-relaxed">Compre um pacote abaixo e raspe de verdade</p>
                 </div>
             )}

             {currentScratch && (
                <ScratchCanvas 
                    isRevealed={isRevealed} 
                    onReveal={handleReveal} 
                    coverText="RASPE AQUI" 
                />
             )}
          </div>

          {currentScratch && !isRevealed && (
              <div className="mt-5 px-4 py-2 bg-white/5 border border-white/10 rounded-full animate-pulse">
                <p className="text-[9px] text-[#FFD700] font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> Raspe com o dedo ou mouse</p>
              </div>
          )}

          {currentScratch && isRevealed && (
              <div className="mt-6 w-full max-w-[320px] animate-in slide-in-from-bottom-4 fade-in shrink-0">
                  <button onClick={nextScratch} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all">
                      {queueIndex < totalInPackage ? `Próxima Raspada (${queueIndex}/${totalInPackage})` : "Finalizar Pacote"}
                  </button>
              </div>
          )}

          {!currentScratch && (
              <div className="mt-8 flex flex-col items-center gap-4 w-full animate-in fade-in shrink-0">
                 <div className="px-8 py-3 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] flex items-center gap-3 shadow-2xl">
                    <Coins size={20} className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                    <span className="text-xl font-black italic text-white tracking-tighter">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
                 </div>
                 <div className="flex flex-col items-center gap-2 w-full max-w-[240px]">
                    <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000 relative" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"/>
                        </div>
                    </div>
                    <span className="text-[9px] text-white/50 font-black uppercase tracking-[0.2em]">Sua Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
                 </div>
              </div>
          )}
        </div>

        <div className={`relative z-10 p-5 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent shrink-0 transition-all duration-500 ${currentScratch ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
          <div className="grid grid-cols-2 gap-3 mb-3">
             <button onClick={() => buyPackage(1)} disabled={isProcessingBuy} className="bg-[#111] border border-white/10 h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg hover:border-white/20">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-0.5">1 Raspada</span>
                <span className="text-sm font-black text-white italic">2 CR</span>
             </button>
             <button onClick={() => buyPackage(5)} disabled={isProcessingBuy} className="bg-gradient-to-br from-[#1a0510] to-[#111] border border-[#D946EF]/40 h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden group shadow-lg hover:border-[#D946EF]/60">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-md">ECONOMIZE 20%</div>
                <span className="text-[9px] font-black uppercase text-white/60 tracking-widest mb-0.5">Combo 5x</span>
                <span className="text-sm font-black text-[#D946EF] italic">8 CR</span>
             </button>
          </div>

          <button onClick={() => buyPackage(10)} disabled={isProcessingBuy} className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-2xl font-black uppercase flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(255,215,0,0.25)] active:scale-95 transition-all mb-5 border border-white/20">
             <span className="flex items-center gap-2 italic text-sm tracking-tighter"><Zap size={16} fill="currentColor"/> SUPER PACK COLEÇÃO</span>
             <span className="text-[8px] font-extrabold opacity-75 uppercase tracking-[0.2em] mt-1">10 RASPADAS • 14 CRÉDITOS</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push(`/${slug}`)} className="py-3.5 bg-white/5 border border-white/10 text-white/50 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:text-white hover:bg-white/10 transition-all"><LayoutGrid size={14} /> Vitrine</button>
            <button onClick={() => setShowDeposit(true)} className="py-3.5 bg-[#D946EF]/10 border border-[#D946EF]/30 text-[#D946EF] rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#D946EF]/20 transition-all shadow-[0_0_15px_rgba(217,70,239,0.1)]"><ShoppingCart size={14} /> Depositar</button>
          </div>
        </div>

        {showProfile && player && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative flex flex-col max-h-[85vh] shadow-[0_0_60px_rgba(217,70,239,0.15)]">
              <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white bg-white/5 p-2 rounded-full"><CloseIcon size={20} /></button>
              <div className="w-20 h-20 bg-gradient-to-br from-[#D946EF]/20 to-transparent border border-[#D946EF]/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg"><User size={36} className="text-[#D946EF]"/></div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center mb-1">{player.nickname || player.full_name || 'Jogador'}</h2>
              <div className="flex items-center justify-center gap-2 mb-8 bg-white/5 w-max mx-auto px-4 py-1.5 rounded-full border border-white/10">
                  <Coins size={12} className="text-[#FFD700]" />
                  <p className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest">{player.credits} CRÉDITOS</p>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-white/10 pt-6">
                <h3 className="text-[10px] text-white/40 uppercase font-black mb-5 flex items-center gap-2 tracking-[0.2em]"><Trophy size={14} className="text-[#FFD700]"/> Galeria Desbloqueada</h3>
                {unlockedPhotos.length === 0 ? (
                  <div className="py-12 text-center opacity-20"><ImageIcon size={40} className="mx-auto mb-4" /><p className="text-[9px] font-black uppercase tracking-widest">Nenhuma foto ainda</p></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedPhotos.map((img, i) => (
                      <div key={i} className="aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-white/10 bg-black shadow-lg relative group cursor-pointer">
                        <img src={img.photo_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Galeria" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10"><Star size={10} fill="#FFD700" className="text-[#FFD700]" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-colors text-center shrink-0">Sair da Conta</button>
            </div>
          </div>
        )}

        {showDeposit && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative shadow-[0_0_60px_rgba(217,70,239,0.2)]">
              <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/20 hover:text-white bg-white/5 p-2 rounded-full"><CloseIcon size={20} /></button>
              {pixPaid ? (
                 <div className="py-12 text-center animate-in zoom-in">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] rotate-3"><CheckCircle2 className="text-emerald-500" size={48} /></div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Aprovado!</h2>
                    <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-10">Seus créditos já caíram na conta.</p>
                    <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg active:scale-95 transition-all tracking-widest">Voltar ao Jogo</button>
                 </div>
              ) : pixLoading ? (
                <div className="py-24 flex flex-col items-center text-[#D946EF] font-black text-[10px] tracking-widest uppercase animate-pulse"><Loader2 className="animate-spin mb-4" size={40} /> Gerando Pix...</div>
              ) : pixData ? (
                <div className="text-center p-2 animate-in fade-in">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">Pagar com PIX</h2>
                  <div className="bg-white p-4 rounded-[2rem] inline-block mb-8 shadow-[0_0_40px_rgba(255,255,255,0.15)]"><img src={pixData.qr_code_base64} className="w-52 h-52" alt="QR Code" /></div>
                  <div className="mb-8 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                  <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.3)] active:scale-95 transition-all">
                    {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center mb-8">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                  {[ { rs: 20, cr: 25, b: 5 }, { rs: 40, cr: 55, b: 15 }, { rs: 70, cr: 100, b: 30 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-6 bg-black border border-white/10 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative overflow-hidden group shadow-lg">
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black text-[8px] font-black px-3 py-1 rounded-bl-xl shadow-md">+{p.b} BÔNUS</div>
                      <div className="text-left"><span className="block text-xl font-black text-white italic tracking-tighter mb-0.5">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">R$ {p.rs},00</span></div>
                      <div className="bg-[#D946EF] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Comprar</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
