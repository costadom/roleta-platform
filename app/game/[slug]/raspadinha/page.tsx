"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X as CloseIcon, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  Zap, Trophy, Star, Sparkles, AlertTriangle, Gift, Heart, Send
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Motor da Raspadinha Real (Canvas)
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


// --- PÁGINA PRINCIPAL ---

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
  const [activeCartId, setActiveCartId] = useState<string | null>(null);

  // 🔥 ESTADOS PARA COMENTÁRIOS E FOTO EXPANDIDA 🔥
  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);

  const [rechargePackages, setRechargePackages] = useState<any[]>([
    { id: 1, amount: 10, bonus: 2 },
    { id: 2, amount: 20, bonus: 5 }
  ]);

  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const phone = localStorage.getItem("labz_player_phone");
      
      const { data: globData } = await supabase.from('GlobalSettings').select('recharge_packages').eq('id', 'main').single();
      if (globData?.recharge_packages) {
          setRechargePackages(globData.recharge_packages);
      }

      const { data: modelData, error: modErr } = await supabase.from('Models').select('*, Configs(*)').eq('slug', slug).single();
      if (modErr || !modelData) throw new Error("Musa não encontrada.");
      
      setModel(modelData);
      const config = Array.isArray(modelData.Configs) ? modelData.Configs[0] : modelData.Configs;
      setBackgroundUrl(config?.bg_url || "");
      setModelName(config?.model_name || slug);

      const { data: photos } = await supabase.from('ModelScratchPhotos').select('*').eq('model_id', modelData.id).eq('active', true);
      setModelPhotos(photos || []);

      if (!phone) {
          setNotice("Faça login na vitrine para jogar.");
          setLoading(false);
          return;
      }

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

  // 🔥 INTEGRAÇÃO OTIMIZADA DE LIKES E COMENTÁRIOS 🔥
  useEffect(() => {
    if (!viewingMedia) return;
    
    async function loadInteractions() {
        try {
            const phone = player?.whatsapp || localStorage.getItem("labz_player_phone") || "";
            const likesRes = await fetch(`${supabaseUrl}/rest/v1/Likes?media_id=eq.${viewingMedia.id}&select=player_phone`, { headers });
            if (likesRes.ok) {
                const likesData = await likesRes.json();
                setLikesCount(likesData.length);
                setLiked(likesData.some((l: any) => l.player_phone === phone));
            }

            const commentsRes = await fetch(`${supabaseUrl}/rest/v1/Comments?media_id=eq.${viewingMedia.id}&select=id,player_name,content,created_at&order=created_at.asc`, { headers });
            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData);
            }
        } catch (e) {}
    }
    loadInteractions();
  }, [viewingMedia, supabaseUrl, player]);

  const handleToggleLike = async () => {
    const phone = player?.whatsapp || localStorage.getItem("labz_player_phone");
    if (!phone) return;

    try {
        const isCurrentlyLiked = liked;
        
        // Atualização Otimista para não travar a tela
        setLiked(!isCurrentlyLiked);
        setLikesCount(prev => isCurrentlyLiked ? prev - 1 : prev + 1);

        const mediaId = (viewingMedia.id && !viewingMedia.id.startsWith('http')) ? viewingMedia.id : '00000000-0000-0000-0000-000000000000';

        if (isCurrentlyLiked) {
            await fetch(`${supabaseUrl}/rest/v1/Likes?media_id=eq.${mediaId}&player_phone=eq.${encodeURIComponent(phone)}`, { method: 'DELETE', headers });
        } else {
            await fetch(`${supabaseUrl}/rest/v1/Likes`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ media_id: mediaId, player_phone: phone }) });
        }
    } catch (e) {}
  };

  const handlePostComment = async () => {
    const phone = player?.whatsapp || localStorage.getItem("labz_player_phone");
    if (!phone || !newComment.trim()) return;
    
    setLoadingComment(true);

    try {
        const playerName = player?.nickname || player?.full_name || 'Fã VIP';
        const commentText = newComment;
        
        // Atualização Otimista (Exibe na hora, limpa o input na hora)
        const tempComment = { id: Date.now().toString(), player_name: playerName, content: commentText, created_at: new Date().toISOString() };
        setComments(prev => [...prev, tempComment]);
        setNewComment(""); 

        const mediaId = (viewingMedia.id && !viewingMedia.id.startsWith('http')) ? viewingMedia.id : '00000000-0000-0000-0000-000000000000';
        const payload = { media_id: mediaId, player_phone: phone, player_name: playerName, content: commentText };
        
        const res = await fetch(`${supabaseUrl}/rest/v1/Comments`, { 
            method: 'POST', 
            headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }, 
            body: JSON.stringify(payload) 
        });
        
        if (res.ok) {
            const inserted = await res.json();
            setComments(prev => prev.map(c => c.id === tempComment.id ? inserted[0] : c));
        }
    } catch (e) {} finally { setLoadingComment(false); }
  };

  const handleOpenMedia = (photoUrl: string) => {
    const mediaItem = modelPhotos.find(mp => mp.photo_url === photoUrl);
    if (mediaItem) {
        setViewingMedia({ ...mediaItem, url: photoUrl });
    } else {
        setViewingMedia({ id: photoUrl, url: photoUrl, caption: "Foto VIP Raspadinha" });
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
              await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${activeCartId}`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pago' })
              }).catch(() => null);
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
      const resCart = await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          player_name: player.nickname || player.full_name || "Cliente Web",
          player_phone: player.whatsapp,
          model_name: modelName || slug,
          amount: amount,
          status: 'pendente'
        })
      });
      if (resCart.ok) {
        const cartData = await resCart.json();
        if (cartData && cartData[0]) setActiveCartId(cartData[0].id);
      }
    } catch (e) { console.error("Erro ao salvar carrinho:", e); }

    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: player?.id }),
      });
      if(!res.ok) throw new Error();
      const data = await res.json();
      setPixData(data);
    } catch (e) { setNotice("Falha ao gerar o Pix. Tente novamente."); } finally { setPixLoading(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-[#D946EF] font-black uppercase text-xs animate-pulse tracking-widest">Carregando Labz...</div>;

  return (
    <div className="min-h-[100dvh] w-full bg-[#0a0a0a] flex justify-center items-center font-sans overflow-hidden relative">
      
      {notice && <NoticeModal message={notice} onClose={() => setNotice("")} />}

      {/* 🔥 Fundo de Computador Desfocado 🔥 */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30" style={{ backgroundImage: `url(${backgroundUrl})` }} />
         <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />
      </div>

      {/* Container Principal */}
      <div className="relative w-full h-[100dvh] md:h-[90dvh] max-w-[430px] bg-black flex flex-col md:rounded-[2.5rem] md:border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-10">
        
        <div className="relative flex flex-col w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          <div className="absolute inset-0 z-0 h-[100vh] fixed pointer-events-none">
            <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-all duration-1000" style={{ backgroundImage: `url(${backgroundUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-transparent to-[#050505]" />
          </div>

          <div className="relative z-10 p-4 flex justify-between items-center w-full shrink-0">
            {/* 🔥 CABEÇALHO PADRÃO DA ROLETA 🔥 */}
            <div className="flex gap-2">
               <button onClick={() => router.push(`/profile/${slug}`)} className="p-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all shadow-lg"><ArrowLeft size={16}/></button>
               <button onClick={() => router.push(`/profile/${slug}`)} className="px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white text-[9px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all shadow-lg"><User size={14}/> Voltar ao Perfil</button>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-black/40 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all shadow-lg"><User size={18}/></button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center shrink-0 mb-4 mt-2">
            <span className="text-[#D946EF] font-black italic text-2xl tracking-tighter drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
              Savanah <span className="text-white">Labz</span>
            </span>
            <span className="text-[10px] text-[#FFD700] font-black uppercase mt-1 tracking-[0.3em] italic flex items-center gap-1">
              <Sparkles size={10} fill="currentColor" /> Raspadinha {modelName}
            </span>
          </div>

          <div className="relative z-10 w-full h-8 bg-[#111]/80 border-y border-[#D946EF]/20 backdrop-blur-md overflow-hidden flex items-center shrink-0 mb-2">
            <div className="flex whitespace-nowrap animate-marquee">
              {NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter">
                  <Star size={11} className="text-[#FFD700]" fill="currentColor" />
                  <span className="text-white/60">{name}</span>
                  <span className="text-white">REVELOU</span>
                  <span className="text-[#D946EF]">FOTO VIP</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center p-4 min-h-[360px] shrink-0">
            <div className="w-full max-w-[280px] aspect-[4/5] bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#D946EF]/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(217,70,239,0.15)] relative overflow-hidden">
              {currentScratch ? (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#111]">
                  {currentScratch.type === "win" ? (
                    <>
                      <img src={currentScratch.photo_url} className="absolute inset-0 w-full h-full object-cover" alt="VIP" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-0 right-0 text-center animate-in slide-in-from-bottom-4">
                        <span className="bg-[#D946EF] border border-[#D946EF]/50 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2 mx-auto w-max">
                          <Gift size={14} /> FOTO REVELADA
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1a0510] to-[#050505] w-full h-full animate-in zoom-in">
                      <div className="w-16 h-16 rounded-full bg-[#D946EF]/10 border border-[#D946EF]/30 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(217,70,239,0.2)]">
                        <CloseIcon size={32} className="text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                      </div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-lg">Veio o X</h3>
                      <p className="text-[10px] text-white/50 uppercase font-bold tracking-[0.15em] leading-relaxed">Que pena amor!<br />Sua foto estava quase saindo.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151515] to-[#050505]">
                  <ImageIcon size={40} className="text-[#D946EF]/20 mb-4" />
                  <h3 className="text-white/40 font-black uppercase italic text-sm tracking-widest">Raspadinha VIP</h3>
                  <p className="text-[9px] font-black text-white/20 uppercase mt-2 text-center px-8 leading-relaxed">Compre um pacote abaixo para raspar</p>
                </div>
              )}

              {currentScratch && (
                <ScratchCanvas
                  key={`scratch-${queueIndex}`}
                  isRevealed={isRevealed}
                  onReveal={handleReveal}
                  coverText="RASPE AQUI"
                />
              )}
            </div>

            {currentScratch && !isRevealed && (
              <p className="text-[9px] text-[#FFD700] font-black uppercase tracking-widest mt-4 animate-pulse">Raspe a tela com o dedo</p>
            )}

            {currentScratch && isRevealed && (
              <div className="mt-4 w-full max-w-[280px] px-2 animate-in slide-in-from-bottom-4 fade-in">
                <button onClick={nextScratch} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                  {queueIndex < totalInPackage ? `Próxima Raspada (${queueIndex}/${totalInPackage})` : "Finalizar Pacote"}
                </button>
              </div>
            )}

            {!currentScratch && (
              <div className="mt-5 flex flex-col items-center gap-3 w-full animate-in fade-in">
                <div className="px-6 py-2.5 bg-[#111]/80 border border-white/10 backdrop-blur-md rounded-full flex items-center gap-3 shadow-lg cursor-pointer select-none">
                  <Coins size={14} className="text-[#FFD700] pointer-events-none" />
                  <span className="text-base font-black italic text-white pointer-events-none">
                    {player?.credits || 0} <span className="text-[#D946EF]">CR</span>
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
                  <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000 relative" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <span className="text-[9px] text-white/50 font-black uppercase tracking-widest">Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
                </div>
              </div>
            )}
          </div>

          <div className={`relative z-10 w-full p-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent shrink-0 mt-auto transition-all duration-500 ${currentScratch ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => buyPackage(1)} disabled={isProcessingBuy} className="bg-[#111] border border-white/10 h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg">
                <span className="text-[9px] font-black uppercase text-white/40 mb-0.5">1 Raspada</span>
                <span className="text-sm font-black text-white italic">2 CR</span>
              </button>
              <button onClick={() => buyPackage(5)} disabled={isProcessingBuy} className="bg-gradient-to-br from-[#1a0510] to-[#111] border border-[#D946EF]/40 h-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[6px] font-black px-1.5 py-0.5 rounded-bl-lg">ECONOMIZE 20%</div>
                <span className="text-[9px] font-black uppercase text-white/60 mb-0.5">Combo 5x</span>
                <span className="text-sm font-black text-[#D946EF] italic">8 CR</span>
              </button>
            </div>

            <button onClick={() => buyPackage(10)} disabled={isProcessingBuy} className="w-full py-4 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-2xl font-black uppercase text-xs flex flex-col items-center justify-center shadow-[0_5px_30px_rgba(255,215,0,0.2)] active:scale-95 transition-all border border-white/20">
              <span className="flex items-center gap-2 font-black italic text-sm"><Zap size={14} fill="currentColor" /> SUPER PACK COLEÇÃO</span>
              <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest mt-0.5">10 RASPADAS • 14 CRÉDITOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 MODAL DE PERFIL LIMPO 🔥 */}
      {showProfile && player && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#111] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm relative flex flex-col max-h-[85vh] shadow-2xl">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white">
              <CloseIcon size={24} />
            </button>

            <div className="w-16 h-16 bg-[#D946EF]/10 border border-[#D946EF]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
              <User size={30} className="text-[#D946EF]" />
            </div>

            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter text-center mb-1">
              {player.nickname || player.full_name || 'Jogador'}
            </h2>
            <p className="text-[10px] text-[#FFD700] font-black uppercase text-center mb-4 tracking-widest">
              {player.credits} CRÉDITOS DISPONÍVEIS
            </p>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2 border-t border-white/10 mt-2">
              <h3 className="text-[10px] text-white/40 uppercase font-black mb-4 flex items-center gap-2 tracking-widest mt-4">
                <Trophy size={14} className="text-[#FFD700]" /> Galeria ({unlockedPhotos.length}/10)
              </h3>
              {unlockedPhotos.length === 0 ? (
                <div className="py-10 text-center opacity-20">
                  <ImageIcon size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Você não tem fotos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {unlockedPhotos.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => handleOpenMedia(img.photo_url)}
                      className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#111] shadow-lg relative group cursor-pointer"
                    >
                      <img src={img.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Galeria" />
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                        <Star size={10} fill="#FFD700" className="text-[#FFD700]" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white">Ver Ampliada</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-6 text-[9px] font-black uppercase text-white/20 hover:text-red-500 transition-colors text-center shrink-0">Sair da Conta</button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DA FOTO EXPANDIDA COM CHAT E LIKES 🔥 */}
      {viewingMedia && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-center p-4 animate-in fade-in zoom-in duration-300 gap-6">
           <button onClick={() => setViewingMedia(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full border border-white/10 transition-colors z-[510]">
               <CloseIcon size={20}/>
           </button>
           
           <div className="relative w-full md:w-1/2 h-[40vh] md:h-[85vh] flex items-center justify-center shrink-0">
               <img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-white/5" />
           </div>
           
           <div className="w-full md:w-1/2 max-w-md bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col h-[50vh] md:h-[85vh] overflow-hidden shadow-2xl">
              
              <div className="p-6 border-b border-white/5 shrink-0 flex flex-col items-center">
                  <button onClick={handleToggleLike} className={`p-4 rounded-full transition-all shadow-xl mb-3 border ${liked ? 'bg-red-500 text-white border-red-400 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
                      <Heart size={20} fill={liked ? "currentColor" : "none"} />
                  </button>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2">{likesCount} Curtidas</p>
                  {viewingMedia.caption && <p className="text-sm italic text-white/80 leading-relaxed font-medium text-center">"{viewingMedia.caption}"</p>}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/50">
                  {comments.length > 0 ? comments.map(c => (
                      <div key={c.id} className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                          <span className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-1">{c.player_name || 'Fã VIP'}</span>
                          <p className="text-xs text-white/80 leading-relaxed">{c.content}</p>
                      </div>
                  )) : (
                      <p className="text-center text-white/30 text-xs italic font-medium mt-10">Deixe um comentário para a modelo...</p>
                  )}
              </div>

              <div className="p-4 border-t border-white/5 bg-black shrink-0">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 focus-within:border-[#D946EF]/50 transition-all">
                      <input type="text" placeholder="Escreva algo picante..." value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>e.key==='Enter' && handlePostComment()} className="flex-1 bg-transparent border-none text-xs text-white outline-none placeholder:text-white/30 py-2" />
                      <button onClick={handlePostComment} disabled={!newComment.trim() || loadingComment} className="w-10 h-10 rounded-full bg-[#D946EF] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"><Send size={14} className="-ml-0.5" /></button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal PIX */}
      {showDeposit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl">
            <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
              <CloseIcon size={24} />
            </button>

            {pixPaid ? (
              <div className="py-10 text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 animate-bounce">
                  <CheckCircle2 className="text-emerald-500" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase italic mb-2">Aprovado!</h2>
                <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">Seus créditos já caíram na conta.</p>
                <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-xs shadow-lg">
                  Voltar ao Jogo
                </button>
              </div>
            ) : pixLoading ? (
              <div className="py-20 flex flex-col justify-center items-center text-[#D946EF] font-black text-xs animate-pulse uppercase">
                <Loader2 className="animate-spin mb-2" /> Gerando Pix...
              </div>
            ) : pixData ? (
              <div className="text-center p-2">
                <h2 className="text-2xl font-black text-white uppercase italic mb-6 tracking-tighter">Pague com PIX</h2>
                <div className="bg-white p-4 rounded-3xl inline-block mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                  <img src={pixData.qr_code_base64} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-xl animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                  ⏱ {formatTime(pixTimeLeft)}
                </div>
                <div className="text-left bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                  <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Pague o Pix Cópia e Cola.<br />2. O saldo cai na hora aqui no site!</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.3)] active:scale-95 transition-all tracking-widest">
                  {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copied ? "Código Copiado!" : "Copia e Cola"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <h2 className="text-2xl font-black text-white uppercase italic text-center mb-8 tracking-tighter">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                {rechargePackages.map((p) => (
                  <button key={p.id || p.amount} onClick={() => handleGeneratePix(p.amount)} className="w-full flex justify-between items-center p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative overflow-hidden group shadow-lg">
                    {Number(p.bonus) > 0 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black text-[8px] font-black px-3 py-1 rounded-bl-xl shadow-md">
                        +{p.bonus} BÔNUS
                      </div>
                    )}
                    <div className="text-left">
                      <span className="block text-xl font-black text-white italic tracking-tighter mb-0.5">{Number(p.amount) + Number(p.bonus)} CRÉDITOS</span>
                      <span className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-tighter">R$ {p.amount},00</span>
                    </div>
                    <div className="bg-[#D946EF] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Comprar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
