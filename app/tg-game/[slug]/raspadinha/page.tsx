"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X as CloseIcon, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  LayoutGrid, Zap, Trophy, MessageCircle, Star, Home, Heart, Sparkles, AlertTriangle, Gift
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const NoticeModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-[#111] border border-[#D946EF]/30 p-6 rounded-3xl w-full max-w-xs text-center shadow-[0_0_40px_rgba(217,70,239,0.2)] animate-in zoom-in-95">
      <AlertTriangle size={32} className="text-[#D946EF] mx-auto mb-4" />
      <p className="text-white font-bold text-sm mb-6 leading-relaxed">{message}</p>
      <button onClick={onClose} className="bg-[#D946EF] text-white w-full py-3 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all">Entendi</button>
    </div>
  </div>
);

const ScratchCanvas = ({ onReveal, isRevealed, coverText }: { onReveal: () => void, isRevealed: boolean, coverText: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#888");
    gradient.addColorStop(0.5, "#ccc");
    gradient.addColorStop(1, "#666");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for(let i=0; i<3000; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    ctx.fillStyle = "#333";
    ctx.font = "900 28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coverText, width / 2, height / 2);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 50; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [coverText]);

  useEffect(() => {
    if (isRevealed && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [isRevealed]);

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
    if (isRevealed) return;
    if (e.cancelable) e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMove = (e: any) => {
    if (!isDrawing || isRevealed) return;
    if (e.cancelable) e.preventDefault();
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
      if (Math.random() > 0.1) return; 
      
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      const totalPixels = pixels.length / 4;
      
      for (let i = 3; i < pixels.length; i += 128) {
          if (pixels[i] === 0) transparent++;
      }
      
      const percent = (transparent / (totalPixels / 32)) * 100;
      
      if (percent > 40 && !isRevealed) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); 
          onReveal();
      }
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={500}
      className={`absolute inset-0 w-full h-full cursor-pointer touch-none z-20 ${isRevealed ? 'pointer-events-none opacity-0 transition-opacity duration-500' : ''}`}
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


export default function TelegramScratchApp() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [tgUser, setTgUser] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
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
  const [activeCartId, setActiveCartId] = useState<string | null>(null);

  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setTgUser(user);
          fetchInitialData(user);
        } else {
          setErrorMsg("Abra este link pelo botão do Bot no Telegram!");
          setLoading(false);
        }
      }
    };
  }, [slug]);

  async function fetchInitialData(user: any) {
    try {
      setLoading(true);

      const { data: modelData, error: modErr } = await supabase.from('Models').select('*, Configs(*)').eq('slug', slug).single();
      if (modErr || !modelData) throw new Error("Musa não encontrada.");
      
      setModel(modelData);
      const config = Array.isArray(modelData.Configs) ? modelData.Configs[0] : modelData.Configs;
      setBackgroundUrl(config?.bg_url || "");
      setModelName(config?.model_name || slug);

      const { data: photos } = await supabase.from('ModelScratchPhotos').select('*').eq('model_id', modelData.id).eq('active', true);
      setModelPhotos(photos || []);

      const pseudoWhatsapp = user.id.toString();
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      
      const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&model_id=eq.${modelData.id}&select=*`, { headers });
      let playerData = await resPlayer.json();

      if (!playerData || playerData.length === 0) {
        const newPlayerPayload = {
          whatsapp: pseudoWhatsapp,
          name: user.first_name || "Visitante TG", 
          nickname: user.first_name || "VIP",
          full_name: `${user.first_name} ${user.last_name || ''}`.trim() || "Usuário Telegram",
          email: `${user.id}@tg.labzsexy.com`, 
          password: `${user.id}TgAuth!`,
          credits: 3, 
          model_id: modelData.id
        };

        const createRes = await fetch(`${supabaseUrl}/rest/v1/Players`, { 
            method: "POST", 
            headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" }, 
            body: JSON.stringify(newPlayerPayload) 
        });
        playerData = await createRes.json();
      }
      
      if (playerData && playerData[0]) {
        setPlayer(playerData[0]);
        const { data: history } = await supabase.from('ScratchHistory').select('*').eq('player_id', playerData[0].id);
        setUnlockedPhotos(history || []);
      }

    } catch (err: any) { 
        setErrorMsg(err.message || "Erro de conexão."); 
    } finally { 
        setLoading(false); 
    }
  }

  const handleDevHack = () => {
      setClickCount((prev) => {
          const next = prev + 1;
          if (next >= 5) {
              addDevCredits();
              return 0; 
          }
          return next;
      });
      setTimeout(() => setClickCount(0), 2000);
  };

  const addDevCredits = async () => {
      if (!player) return;
      const newTokens = player.credits + 50;
      setPlayer({ ...player, credits: newTokens });
      await supabase.from('Players').update({ credits: newTokens }).eq('id', player.id);
      if ((window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.showAlert("🤖 MODO DEV: 50 Giros adicionados com sucesso!");
      } else {
          setNotice("MODO DEV: 50 Giros adicionados com sucesso!");
      }
  };

  const shuffleArray = (array: any[]) => {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  const buyPackage = async (bundleSize: number) => {
    if (scratchQueue.length > 0) return setNotice("Termine de raspar a atual primeiro!");
    if (!player) return setNotice("Faça login para jogar.");
    if (unlockedPhotos.length >= 10) return setNotice("Coleção completa! Você já tem todas as fotos VIP dessa musa.");

    const cost = bundleSize === 10 ? 14 : bundleSize === 5 ? 8 : 2;
    if (player.credits < cost) return setShowDeposit(true);

    setIsProcessingBuy(true);

    try {
        let winChance = bundleSize === 10 ? 0.25 : bundleSize === 5 ? 0.18 : 0.10;
        
        if (unlockedPhotos.length >= 8) {
            winChance = winChance * 0.25; 
        } else if (unlockedPhotos.length >= 5) {
            winChance = winChance * 0.60; 
        }

        const winThreshold = 1 - winChance;
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

              if(!String(currentScratch.photo_url).includes("TENTE")) {
                  await fetch("/api/tg-send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          telegramId: tgUser.id,
                          prizeName: "Foto Exclusiva (Raspadinha)",
                          deliveryValue: "Sua foto foi salva na sua Galeria da Raspadinha! Acesse o Perfil para ver.",
                          modelName: modelName || slug,
                          modelSlug: slug
                      })
                  });
              }

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
    if (pixData && !pixPaid && player) {
      interval = setInterval(async () => {
        try {
            const { data } = await supabase.from('Players').select('credits').eq('id', player?.id).single();
            if (data && data.credits > player.credits) {
                setPixPaid(true);
                setPlayer({ ...player, credits: data.credits });
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, zIndex: 9999 });
                if (activeCartId) {
                    await supabase.from('AbandonedCarts').update({ status: 'pago' }).eq('id', activeCartId);
                }
                clearInterval(interval);
            }
        } catch(e) {}
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid, player, activeCartId]);

  useEffect(() => {
    let timer: any;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const handleGeneratePix = async (amount: number) => {
    if (!player) return;
    setPixLoading(true);
    setPixData(null);
    setPixPaid(false);
    setActiveCartId(null);
    setPixTimeLeft(600); 

    try {
        const resCart = await supabase.from('AbandonedCarts').insert([{
            player_name: player.nickname || player.full_name || "Cliente TG",
            player_phone: player.whatsapp,
            model_name: modelName || slug,
            amount: amount,
            status: 'pendente'
        }]).select();
        
        if (resCart.data && resCart.data[0]) setActiveCartId(resCart.data[0].id);
    } catch (e) { console.error(e); }

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

  if (loading) return <div className="h-[100dvh] w-full bg-black flex items-center justify-center text-[#D946EF] font-black uppercase text-xs animate-pulse tracking-widest">Carregando Labz...</div>;
  if (errorMsg) return <div className="h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center"><AlertCircle size={40} className="text-red-500 mb-4"/><p className="font-bold text-sm">{errorMsg}</p></div>;

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0a] flex items-start justify-center font-sans overflow-hidden">
      
      {notice && <NoticeModal message={notice} onClose={() => setNotice("")} />}

      <div className="relative w-full h-full max-w-md bg-black flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar pb-6">
        
        <div className="absolute inset-0 z-0 h-[100vh] fixed pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-all duration-1000 fixed" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-transparent to-[#050505] fixed" />
        </div>

        <div className="relative z-10 p-4 flex flex-col gap-3 shrink-0">
           <div className="flex justify-between items-center px-1">
              <button onClick={() => setShowDeposit(true)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 flex items-center gap-1.5 shadow-lg"><ShoppingCart size={12} /> Recarregar</button>
              <div className="flex gap-2">
                 <button onClick={() => setShowProfile(true)} className="w-9 h-9 bg-black/40 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all shadow-lg"><User size={16}/></button>
              </div>
           </div>

           {/* MENU DE ABAS (HUB DE JOGOS) - INVERTIDO PARA A RASPADINHA */}
           <div className="flex bg-black/50 border border-white/10 backdrop-blur-md rounded-full p-1 mx-auto mt-2 w-max shadow-[0_0_20px_rgba(255,215,0,0.15)] z-20">
              <button onClick={() => router.push(`/tg-game/${slug}`)} className="px-6 py-2 text-white/50 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                 <Zap size={14} /> Roleta
              </button>
              <div className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                 <Sparkles size={14} fill="currentColor"/> Raspadinha
              </div>
           </div>

           <div className="flex flex-col items-center mt-2">
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

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-4 px-4 min-h-[380px]">
          
          <div className="w-full max-w-[300px] aspect-[4/5] bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#D946EF]/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(217,70,239,0.15)] relative overflow-hidden shrink-0">
             
             {currentScratch ? (
                 <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#111]">
                     {currentScratch.type === 'win' ? (
                         <>
                             <img src={currentScratch.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="VIP" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                             <div className="absolute bottom-6 left-0 right-0 text-center animate-in slide-in-from-bottom-4">
                                 <span className="bg-[#D946EF] border border-[#D946EF]/50 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2 mx-auto w-max"><Gift size={14}/> FOTO REVELADA</span>
                             </div>
                         </>
                     ) : (
                         <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#1a0510] to-[#050505] w-full h-full animate-in zoom-in">
                             <div className="w-20 h-20 rounded-full bg-[#D946EF]/10 border border-[#D946EF]/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(217,70,239,0.2)]">
                               <CloseIcon size={40} className="text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                             </div>
                             <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-3 drop-shadow-lg">Veio o X</h3>
                             <p className="text-[10px] text-white/50 uppercase font-bold tracking-[0.2em] leading-relaxed">Que pena amor!<br/>Sua foto estava quase saindo.</p>
                         </div>
                     )}
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151515] to-[#050505]">
                    <ImageIcon size={50} className="text-[#D946EF]/20 mb-4" />
                    <h3 className="text-white/40 font-black uppercase italic text-sm tracking-widest">Raspadinha VIP</h3>
                    <p className="text-[9px] font-black text-white/20 uppercase mt-2 text-center px-8">Compre um pacote abaixo para raspar</p>
                 </div>
             )}

             {currentScratch && (
                <ScratchCanvas 
                    key={queueIndex}
                    isRevealed={isRevealed} 
                    onReveal={handleReveal} 
                    coverText="RASPE AQUI" 
                />
             )}
          </div>

          {currentScratch && !isRevealed && (
              <p className="text-[9px] text-[#FFD700] font-black uppercase tracking-widest mt-4 animate-pulse shrink-0">Raspe a tela com o dedo</p>
          )}

          {currentScratch && isRevealed && (
              <div className="mt-4 w-full max-w-[300px] px-2 animate-in slide-in-from-bottom-4 fade-in shrink-0">
                  <button onClick={nextScratch} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                      {queueIndex < totalInPackage ? `Próxima Raspada (${queueIndex}/${totalInPackage})` : "Finalizar Pacote"}
                  </button>
              </div>
          )}

          {!currentScratch && (
              <div className="mt-6 flex flex-col items-center gap-3 w-full animate-in fade-in shrink-0">
                 <div className="px-6 py-2 bg-[#111]/80 border border-white/10 backdrop-blur-md rounded-2xl flex items-center gap-3 shadow-lg cursor-pointer select-none" onClick={handleDevHack}>
                    <Coins size={16} className="text-[#FFD700] pointer-events-none" />
                    <span className="text-lg font-black italic text-white pointer-events-none">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
                 </div>
                 <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
                    <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000 relative" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"/>
                        </div>
                    </div>
                    <span className="text-[9px] text-white/50 font-black uppercase tracking-widest">Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
                 </div>
              </div>
          )}
        </div>

        <div className={`relative z-10 p-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent shrink-0 mt-auto transition-all duration-500 ${currentScratch ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
             <button onClick={() => buyPackage(1)} disabled={isProcessingBuy} className="bg-[#111] border border-white/10 h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg">
                <span className="text-[9px] font-black uppercase text-white/40 mb-0.5">1 Raspada</span>
                <span className="text-sm font-black text-white italic">2 CR</span>
             </button>
             <button onClick={() => buyPackage(5)} disabled={isProcessingBuy} className="bg-gradient-to-br from-[#1a0510] to-[#111] border border-[#D946EF]/40 h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg">ECONOMIZE 20%</div>
                <span className="text-[9px] font-black uppercase text-white/60 mb-0.5">Combo 5x</span>
                <span className="text-sm font-black text-[#D946EF] italic">8 CR</span>
             </button>
          </div>

          <button onClick={() => buyPackage(10)} disabled={isProcessingBuy} className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-2xl font-black uppercase text-xs flex flex-col items-center justify-center shadow-[0_5px_30px_rgba(255,215,0,0.2)] active:scale-95 transition-all border border-white/20">
             <span className="flex items-center gap-2 font-black italic text-sm"><Zap size={14} fill="currentColor"/> SUPER PACK COLEÇÃO</span>
             <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest mt-0.5">10 RASPADAS • 14 CRÉDITOS</span>
          </button>
        </div>

        {/* Modal Perfil/Galeria */}
        {showProfile && player && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative flex flex-col max-h-[85vh] shadow-2xl">
              <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><CloseIcon size={24} /></button>
              <div className="w-16 h-16 bg-[#D946EF]/10 border border-[#D946EF]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3"><User size={30} className="text-[#D946EF]"/></div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter text-center mb-1">{player.nickname || player.full_name || 'Jogador'}</h2>
              <p className="text-[10px] text-[#FFD700] font-black uppercase text-center mb-6 tracking-widest">{player.credits} CRÉDITOS DISPONÍVEIS</p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border-t border-white/10 pt-6">
                <h3 className="text-[10px] text-white/40 uppercase font-black mb-4 flex items-center gap-2 tracking-widest"><Trophy size={14} className="text-[#FFD700]"/> Galeria ({unlockedPhotos.length}/10)</h3>
                {unlockedPhotos.length === 0 ? (
                  <div className="py-10 text-center opacity-20"><ImageIcon size={40} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Você não tem fotos</p></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedPhotos.map((img, i) => (
                      <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#111] shadow-lg relative group cursor-pointer">
                        <img src={img.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Galeria" />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full"><Star size={10} fill="#FFD700" className="text-[#FFD700]" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal PIX */}
        {showDeposit && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative shadow-[0_0_50px_rgba(217,70,239,0.15)] my-auto">
              <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/20 hover:text-white"><CloseIcon size={24} /></button>
              {pixPaid ? (
                 <div className="py-10 text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 animate-bounce"><CheckCircle2 className="text-emerald-500" size={40} /></div>
                    <h2 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Aprovado!</h2>
                    <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">Créditos liberados.</p>
                    <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg active:scale-95 transition-all">Voltar ao Jogo</button>
                 </div>
              ) : pixLoading ? (
                <div className="py-20 flex flex-col items-center text-[#D946EF] font-black text-xs uppercase animate-pulse tracking-widest"><Loader2 className="animate-spin mb-4" size={40} /> Gerando Pix...</div>
              ) : pixData ? (
                <div className="text-center p-2">
                  <h2 className="text-2xl font-black text-white uppercase italic mb-6 tracking-tighter">Pagar com PIX</h2>
                  <div className="bg-white p-4 rounded-[2rem] inline-block mb-6 shadow-[0_0_40px_rgba(255,255,255,0.15)]"><img src={pixData.qr_code_base64} className="w-52 h-52" alt="QR Code" /></div>
                  <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                  <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.3)] active:scale-95 transition-all tracking-widest">
                    {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <h2 className="text-2xl font-black text-white uppercase italic text-center mb-8 tracking-tighter">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                  {[ { rs: 20, cr: 25, b: 5 }, { rs: 40, cr: 55, b: 15 }, { rs: 70, cr: 100, b: 30 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative overflow-hidden group shadow-lg">
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
