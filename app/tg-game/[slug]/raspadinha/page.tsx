"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  LayoutGrid, Zap, Trophy, MessageCircle, Star, Home, Heart, Sparkles, AlertTriangle, Gift
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];

// --- COMPONENTES AUXILIARES ---

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
    ctx.font = "900 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(coverText, width / 2, height / 2);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 45; 
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
      style={{ touchAction: 'none' }} 
      className={`absolute inset-0 w-full h-full cursor-pointer z-20 ${isRevealed ? 'pointer-events-none opacity-0 transition-opacity duration-500' : ''}`}
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

  const [linkWa, setLinkWa] = useState("");
  const [linkPwd, setLinkPwd] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers });
      const modData = await resMod.json();
      
      if (!modData || modData.length === 0) throw new Error("Musa não encontrada.");
      
      const modelData = modData[0];
      setModel(modelData);
      const config = Array.isArray(modelData.Configs) ? modelData.Configs[0] : modelData.Configs;
      setBackgroundUrl(config?.bg_url || "");
      setModelName(config?.model_name || slug);

      const resPhotos = await fetch(`${supabaseUrl}/rest/v1/ModelScratchPhotos?model_id=eq.${modelData.id}&active=eq.true`, { headers });
      const photos = await resPhotos.json();
      setModelPhotos(photos || []);

      const pseudoWhatsapp = `TG_${user.id}`;
      
      let resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?telegram_id=eq.${user.id}&model_id=eq.${modelData.id}&select=*`, { headers });
      let playerData = await resPlayer.json();

      if (!playerData || playerData.length === 0) {
          resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&model_id=eq.${modelData.id}&select=*`, { headers });
          playerData = await resPlayer.json();
      }

      if (!playerData || playerData.length === 0) {
        const newPlayerPayload = {
          whatsapp: pseudoWhatsapp,
          telegram_id: user.id.toString(),
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
        const resHist = await fetch(`${supabaseUrl}/rest/v1/ScratchHistory?player_id=eq.${playerData[0].id}`, { headers });
        const history = await resHist.json();
        setUnlockedPhotos(history || []);
      }

    } catch (err: any) { 
        setErrorMsg(err.message || "Erro de conexão."); 
    } finally { 
        setLoading(false); 
    }
  }

  const handleLinkAccount = async () => {
      if (!linkWa || !linkPwd || linkWa.length < 10) return setNotice("Preencha seu WhatsApp com DDD e crie uma senha.");
      setIsLinking(true);
      
      try {
          const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };
          const cleanWa = linkWa.replace(/\D/g, "");
          
          const checkRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWa}&model_id=eq.${model.id}&select=*`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
          const realAccountData = await checkRes.json();

          if (realAccountData && realAccountData.length > 0) {
              const realAccount = realAccountData[0];
              const mergedCredits = realAccount.credits + player.credits; 
              
              await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${realAccount.id}`, { 
                  method: "PATCH", headers, 
                  body: JSON.stringify({ credits: mergedCredits, telegram_id: tgUser.id.toString() }) 
              });
              
              await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "DELETE", headers });
              
              setPlayer({ ...realAccount, credits: mergedCredits, telegram_id: tgUser.id.toString() });
              setLinkSuccess("Contas fundidas com sucesso! Seu saldo foi somado.");
          } else {
              const updateRes = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { 
                  method: "PATCH", headers, 
                  body: JSON.stringify({ whatsapp: cleanWa, password: linkPwd, telegram_id: tgUser.id.toString() }) 
              });
              const updatedData = await updateRes.json();
              if (updatedData && updatedData[0]) {
                  setPlayer(updatedData[0]);
                  setLinkSuccess("Conta oficial criada! Acesse pelo site quando quiser.");
              }
          }
      } catch (e) {
          setNotice("Erro ao vincular conta.");
      }
      setIsLinking(false);
  };

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
      
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
          method: "PATCH", headers,
          body: JSON.stringify({ credits: newTokens })
      });
      
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
        
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
        await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
            method: "PATCH", headers,
            body: JSON.stringify({ credits: currentCredits })
        });
        
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
              const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
              await fetch(`${supabaseUrl}/rest/v1/ScratchHistory`, {
                  method: "POST", headers,
                  body: JSON.stringify({
                      player_id: player.id,
                      model_id: model.id,
                      photo_url: currentScratch.photo_url
                  })
              });

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
            const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
            const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers });
            const data = await res.json();
            
            if (data && data[0] && data[0].credits > player.credits) {
                setPixPaid(true);
                setPlayer({ ...player, credits: data[0].credits });
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, zIndex: 9999 });
                
                if (activeCartId) {
                    await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${activeCartId}`, {
                        method: "PATCH", 
                        headers: { ...headers, "Content-Type": "application/json" },
                        body: JSON.stringify({ status: 'pago' })
                    });
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
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };
        const resCart = await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
            method: "POST", headers,
            body: JSON.stringify({
                player_name: player.nickname || player.full_name || "Cliente TG",
                player_phone: player.whatsapp,
                model_name: modelName || slug,
                amount: amount,
                status: 'pendente'
            })
        });
        const cartData = await resCart.json();
        if (cartData && cartData[0]) setActiveCartId(cartData[0].id);
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
    <div className="h-[100dvh] w-full bg-[#0a0a0a] flex items-start justify-center font-sans overflow-hidden overscroll-none touch-none">
      
      {notice && <NoticeModal message={notice} onClose={() => setNotice("")} />}

      <div className="relative w-full h-full max-w-md bg-black flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar pb-6 overscroll-none">
        
        <div className="absolute inset-0 z-0 h-[100vh] fixed pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-all duration-1000 fixed" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-transparent to-[#050505] fixed" />
        </div>

        <div className="relative z-10 p-3 flex flex-col gap-2 shrink-0">
           <div className="flex justify-between items-center px-1">
              <div className="flex gap-2">
                 <button onClick={() => setShowProfile(true)} className="w-9 h-9 bg-black/40 border border-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all shadow-lg"><User size={16}/></button>
              </div>
              <button onClick={() => setShowDeposit(true)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 flex items-center gap-1.5 shadow-lg"><ShoppingCart size={12} /> Recarregar</button>
           </div>

           {/* MENU DE ABAS INVERTIDO */}
           <div className="flex bg-black/50 border border-white/10 backdrop-blur-md rounded-full p-1 mx-auto mt-1 w-max shadow-[0_0_20px_rgba(255,215,0,0.15)] z-20">
              <button onClick={() => router.push(`/tg-game/${slug}`)} className="px-6 py-2 text-white/50 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                 <Zap size={14} /> Roleta
              </button>
              <div className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                 <Sparkles size={14} fill="currentColor"/> Raspadinha
              </div>
           </div>

           <div className="flex flex-col items-center mt-1">
              <span className="text-[#D946EF] font-black italic text-xl tracking-tighter drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
           </div>
        </div>

        <div className="w-full h-8 bg-[#111]/80 border-y border-[#D946EF]/20 backdrop-blur-md overflow-hidden flex items-center relative shrink-0 mb-2">
          <div className="flex whitespace-nowrap animate-marquee">
            { NAMES.map((name, i) => (
              <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter"><Star size={11} className="text-[#FFD700]" fill="currentColor"/><span className="text-white/60">{name}</span><span className="text-white">REVELOU</span><span className="text-[#D946EF]">FOTO VIP</span></div>
            ))}
          </div>
        </div>

        {/* 🔥 TELA DO CARTÃO - MENOR PARA CABER TUDO (max-w-[240px]) 🔥 */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 px-4 touch-none min-h-[300px]">
          
          <div className="w-full max-w-[240px] aspect-[3/4] bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#D946EF]/30 rounded-[2rem] shadow-[0_0_50px_rgba(217,70,239,0.15)] relative overflow-hidden shrink-0 touch-none">
             
             {currentScratch ? (
                 <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#111]">
                     {currentScratch.type === 'win' ? (
                         <>
                             <img src={currentScratch.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="VIP" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                             <div className="absolute bottom-4 left-0 right-0 text-center animate-in slide-in-from-bottom-4">
                                 <span className="bg-[#D946EF] border border-[#D946EF]/50 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2 mx-auto w-max"><Gift size={12}/> FOTO REVELADA</span>
                             </div>
                         </>
                     ) : (
                         <div className="flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#1a0510] to-[#050505] w-full h-full animate-in zoom-in">
                             <div className="w-14 h-14 rounded-full bg-[#D946EF]/10 border border-[#D946EF]/30 flex items-center justify-center mb-3 shadow-[0_0_40px_rgba(217,70,239,0.2)]">
                               <X size={24} className="text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                             </div>
                             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1 drop-shadow-lg">Veio o X</h3>
                             <p className="text-[9px] text-white/50 uppercase font-bold tracking-[0.1em] leading-relaxed">Que pena amor!<br/>Sua foto estava quase saindo.</p>
                         </div>
                     )}
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151515] to-[#050505]">
                    <ImageIcon size={32} className="text-[#D946EF]/20 mb-3" />
                    <h3 className="text-white/40 font-black uppercase italic text-xs tracking-widest">Raspadinha VIP</h3>
                    <p className="text-[8px] font-black text-white/20 uppercase mt-2 text-center px-6">Compre um pacote abaixo para raspar</p>
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
              <p className="text-[8px] text-[#FFD700] font-black uppercase tracking-widest mt-2 animate-pulse shrink-0">Raspe a tela com o dedo</p>
          )}

          {currentScratch && isRevealed && (
              <div className="mt-3 w-full max-w-[240px] px-2 animate-in slide-in-from-bottom-4 fade-in shrink-0">
                  <button onClick={nextScratch} className="w-full py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">
                      {queueIndex < totalInPackage ? `Próxima Raspada (${queueIndex}/${totalInPackage})` : "Finalizar Pacote"}
                  </button>
              </div>
          )}

          {!currentScratch && (
              <div className="mt-3 flex flex-col items-center gap-2 w-full animate-in fade-in shrink-0">
                 <div className="px-5 py-1.5 bg-[#111]/80 border border-white/10 backdrop-blur-md rounded-full flex items-center gap-2 shadow-lg cursor-pointer select-none" onClick={handleDevHack}>
                    <Coins size={12} className="text-[#FFD700] pointer-events-none" />
                    <span className="text-sm font-black italic text-white pointer-events-none">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
                 </div>
                 <div className="flex flex-col items-center gap-1 w-full max-w-[180px]">
                    <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000 relative" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"/>
                        </div>
                    </div>
                    <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
                 </div>
              </div>
          )}
        </div>

        <div className={`relative z-10 p-3 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent shrink-0 mt-auto transition-all duration-500 ${currentScratch ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
             <button onClick={() => buyPackage(1)} disabled={isProcessingBuy} className="bg-[#111] border border-white/10 h-12 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg">
                <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">1 Raspada</span>
                <span className="text-xs font-black text-white italic">2 CR</span>
             </button>
             <button onClick={() => buyPackage(5)} disabled={isProcessingBuy} className="bg-gradient-to-br from-[#1a0510] to-[#111] border border-[#D946EF]/40 h-12 rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[5px] font-black px-1.5 py-0.5 rounded-bl-md">ECONOMIZE 20%</div>
                <span className="text-[8px] font-black uppercase text-white/60 mb-0.5">Combo 5x</span>
                <span className="text-xs font-black text-[#D946EF] italic">8 CR</span>
             </button>
          </div>

          <button onClick={() => buyPackage(10)} disabled={isProcessingBuy} className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-xl font-black uppercase text-xs flex flex-col items-center justify-center shadow-[0_5px_30px_rgba(255,215,0,0.2)] active:scale-95 transition-all border border-white/20">
             <span className="flex items-center gap-2 font-black italic text-xs"><Zap size={12} fill="currentColor"/> SUPER PACK COLEÇÃO</span>
             <span className="text-[7px] font-bold opacity-70 uppercase tracking-widest mt-0.5">10 RASPADAS • 14 CRÉDITOS</span>
          </button>
        </div>

        {/* 🔥 MODAL DE PERFIL / UNIFICADOR DE CONTAS 🔥 */}
        {showProfile && player && (
          <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative flex flex-col max-h-[85vh] shadow-2xl">
              <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
              
              <div className="w-16 h-16 bg-[#D946EF]/10 border border-[#D946EF]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                  <User size={30} className="text-[#D946EF]"/>
              </div>
              
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter text-center mb-1">{player.nickname || 'Visitante VIP'}</h2>
              <p className="text-[10px] text-[#FFD700] font-black uppercase text-center mb-4 tracking-widest">{player.credits} CRÉDITOS DISPONÍVEIS</p>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
                  
                  {player.whatsapp.startsWith('TG_') ? (
                      <div className="bg-[#050505] border border-white/10 p-5 rounded-3xl shadow-inner mb-6">
                          <h3 className="text-[11px] font-black uppercase text-[#D946EF] mb-2 flex items-center gap-2"><Lock size={14}/> Salve seu Progresso</h3>
                          <p className="text-[9px] text-white/50 mb-4 uppercase tracking-widest font-bold leading-relaxed">Crie um login agora para acessar o site oficial no Google sem perder seu saldo e prêmios.</p>
                          
                          <div className="space-y-3">
                              <input type="text" placeholder="Seu WhatsApp (Ex: 11999999999)" value={linkWa} onChange={(e) => setLinkWa(e.target.value)} className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-xs text-white outline-none focus:border-[#D946EF] transition-all" />
                              <input type="password" placeholder="Crie uma Senha" value={linkPwd} onChange={(e) => setLinkPwd(e.target.value)} className="w-full bg-black border border-white/10 px-4 py-3 rounded-xl text-xs text-white outline-none focus:border-[#D946EF] transition-all" />
                              <button onClick={handleLinkAccount} disabled={isLinking} className="w-full bg-[#D946EF] text-white py-3 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-lg mt-2">
                                  {isLinking ? <Loader2 size={14} className="animate-spin mx-auto"/> : "Vincular e Salvar Agora"}
                              </button>
                          </div>
                          {linkSuccess && <p className="text-[9px] font-black text-emerald-500 text-center uppercase tracking-widest mt-4">{linkSuccess}</p>}
                      </div>
                  ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 mb-6">
                          <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                          <div>
                              <p className="text-[10px] font-black uppercase text-emerald-500">Conta Blindada</p>
                              <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold">{player.whatsapp}</p>
                          </div>
                      </div>
                  )}

                  <h3 className="text-[10px] text-white/40 uppercase font-black mb-3 flex items-center gap-2 tracking-widest border-t border-white/5 pt-6"><Trophy size={14} className="text-[#FFD700]"/> Galeria ({unlockedPhotos.length}/10)</h3>
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
          <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl my-auto">
              <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={24} /></button>
              
              {pixPaid ? (
                 <div className="py-10 text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 animate-bounce"><CheckCircle className="text-emerald-500" size={40} /></div>
                    <h2 className="text-2xl font-black text-white uppercase italic mb-2">Aprovado!</h2>
                    <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">Seus créditos já caíram na conta.</p>
                    <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Voltar ao Jogo</button>
                 </div>
              ) : pixLoading ? (
                <div className="py-20 flex flex-col justify-center items-center text-[#D946EF] font-black text-xs animate-pulse uppercase"><Loader2 className="animate-spin mb-2" /> Gerando Pix...</div>
              ) : pixData ? (
                <div className="text-center p-2">
                  <h2 className="text-2xl font-black text-white uppercase italic mb-6 tracking-tighter">Pague com PIX</h2>
                  <div className="bg-white p-4 rounded-3xl inline-block mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]"><img src={pixData.qr_code_base64} alt="QR Code" className="w-48 h-48" /></div>
                  <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-xl animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">⏱ {formatTime(pixTimeLeft)}</div>
                  <div className="text-left bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                    <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Pague o Pix Cópia e Cola.<br/>2. O saldo cai na hora aqui no Telegram!</p>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.3)] active:scale-95 transition-all tracking-widest">
                    {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                 </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <h2 className="text-2xl font-black text-white uppercase italic text-center mb-8 tracking-tighter">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                  
                  {/* PACOTES PADRÃO: 25 por R$20, 35 por R$30, 45 por R$40, 55 por R$50 */}
                  {[ { rs: 20, cr: 25 }, { rs: 30, cr: 35 }, { rs: 40, cr: 45 }, { rs: 50, cr: 55 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative overflow-hidden group shadow-lg">
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black text-[8px] font-black px-3 py-1 rounded-bl-xl shadow-md">+5 BÔNUS</div>
                      <div className="text-left"><span className="block text-xl font-black text-white italic tracking-tighter mb-0.5">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-tighter">R$ {p.rs},00</span></div>
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
