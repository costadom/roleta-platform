"use client";

import React, { useRef, useState, useEffect } from "react";
import { Sparkles, X, Gift, ShoppingCart, Image as ImageIcon } from "lucide-react";

const MODEL_PHOTOS = [
  "https://placehold.co/400x400/1a1a1a/D946EF?text=Foto+1",
  "https://placehold.co/400x400/1a1a1a/D946EF?text=Foto+2",
  "https://placehold.co/400x400/1a1a1a/D946EF?text=Foto+3",
];

export default function ScratchCardGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastVibeTime = useRef<number>(0);

  const [cardsRemaining, setCardsRemaining] = useState(0);
  const [isScratched, setIsScratched] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [revealedImages, setRevealedImages] = useState<string[]>([]);
  const [collectionProgress, setCollectionProgress] = useState(1);

  const initCard = () => {
    setIsScratched(false);
    setResult(null);

    const isWin = Math.random() > 0.7;
    setResult(isWin ? "win" : "loss");

    if (isWin) {
      const winningPhoto = MODEL_PHOTOS[Math.floor(Math.random() * MODEL_PHOTOS.length)];
      setRevealedImages([winningPhoto, winningPhoto, winningPhoto]);
    } else {
      const lossImages = [
        MODEL_PHOTOS[Math.floor(Math.random() * MODEL_PHOTOS.length)],
        "X_NEON",
        Math.random() > 0.5 ? "X_NEON" : MODEL_PHOTOS[Math.floor(Math.random() * MODEL_PHOTOS.length)],
      ].sort(() => Math.random() - 0.5);
      setRevealedImages(lossImages);
    }

    fillCanvas();
  };

  const fillCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    ctx.fillStyle = "#1f1f1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RASPE AQUI", canvas.width / 2, canvas.height / 2);

    ctx.globalCompositeOperation = "source-over";
  };

  useEffect(() => {
    if (cardsRemaining > 0 && !isScratched && !result) {
      initCard();
    }
  }, [cardsRemaining]);

  // Função para disparar a vibração de forma controlada
  const triggerVibration = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(pattern);
      } catch (e) {
        // Silencia erro no iOS
      }
    }
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Vibração tátil otimizada (a cada 100ms para não travar o celular)
    const now = Date.now();
    if (now - lastVibeTime.current > 100) {
      triggerVibration(10);
      lastVibeTime.current = now;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fill();

    checkScratchedArea();
  };

  const checkScratchedArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const totalPixels = pixels.length / 4;
    const percentage = (transparentPixels / totalPixels) * 100;

    if (percentage > 60) {
      setIsScratched(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Vibração forte de vitória ou derrota
      triggerVibration(result === "win" ? [100, 50, 100, 50, 200] : [50, 50]);
      
      if (result === "win") {
        setCollectionProgress((prev) => Math.min(prev + 1, 10));
      }
    }
  };

  const handlePointerDown = (e: any) => {
    if (isScratched || cardsRemaining === 0) return;
    setIsDrawing(true);
    triggerVibration(15); // Feedback de toque inicial
    handlePointerMove(e);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing || isScratched || cardsRemaining === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    scratch(x, y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const buyCards = (amount: number, price: number) => {
    setCardsRemaining((prev) => prev + amount);
  };

  const nextCard = () => {
    setCardsRemaining((prev) => prev - 1);
    setIsScratched(false);
    initCard();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative font-sans">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#D946EF]/20 blur-[80px] pointer-events-none" />
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">Raspadinha <span className="text-[#D946EF]">VIP</span></h2>
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">Descubra o conteúdo escondido</p>
        </div>
        <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-xl text-center backdrop-blur-md">
          <p className="text-[9px] text-white/40 uppercase font-black">Coleção</p>
          <p className="text-sm font-black text-[#D946EF]">{collectionProgress}/10</p>
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            {cardsRemaining > 0 ? `${cardsRemaining} Cartelas disponíveis` : "Compre para jogar"}
          </span>
        </div>

        <div 
          ref={containerRef}
          className="relative w-full h-48 bg-black border-2 border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.1)] cursor-pointer"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <div className="absolute inset-0 flex items-center justify-center p-2 gap-2 bg-[#141414]">
            {revealedImages.map((img, index) => (
              <div key={index} className="flex-1 h-full bg-black rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                {img === "X_NEON" ? (
                  <X size={50} className="text-[#D946EF] drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
                ) : (
                  <>
                    <img src={img} alt="Conteúdo" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <ImageIcon size={20} className="absolute bottom-2 right-2 text-white/50" />
                  </>
                )}
              </div>
            ))}
          </div>

          {cardsRemaining > 0 && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 touch-none"
            />
          )}

          {cardsRemaining === 0 && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <p className="text-sm font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart size={16} /> Saldo Zerado
              </p>
            </div>
          )}
        </div>

        {isScratched && (
          <div className={`mt-4 p-4 rounded-xl text-center border animate-in fade-in zoom-in duration-300 ${result === 'win' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className={`text-lg font-black uppercase tracking-widest ${result === 'win' ? 'text-emerald-500' : 'text-red-500'}`}>
              {result === 'win' ? '🎉 VOCÊ GANHOU!' : 'NÃO FOI DESSA VEZ'}
            </p>
            <p className="text-xs text-white/70 mt-1">
              {result === 'win' ? 'Novo conteúdo exclusivo adicionado à sua coleção.' : 'Raspe mais uma para tentar a sorte!'}
            </p>
            <button 
              onClick={nextCard}
              className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              {cardsRemaining > 1 ? 'Raspar a Próxima' : 'Comprar Mais'}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-6 relative z-10">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-[#D946EF]"/> Comprar Pacotes
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => buyCards(1, 3)} className="w-full bg-[#141414] border border-white/5 hover:border-[#D946EF]/50 p-4 rounded-2xl flex justify-between items-center group transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-white/5 p-2 rounded-lg text-white group-hover:text-[#D946EF] transition-colors"><Gift size={20}/></div>
              <div className="text-left"><p className="text-sm font-black text-white uppercase">1 Raspadinha</p><p className="text-[9px] text-white/40 uppercase tracking-widest">Tente a sorte</p></div>
            </div>
            <span className="text-lg font-black text-[#D946EF]">R$ 3</span>
          </button>

          <button onClick={() => buyCards(5, 12)} className="w-full bg-[#141414] border border-[#D946EF]/20 hover:border-[#D946EF] p-4 rounded-2xl flex justify-between items-center group transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">20% OFF</div>
            <div className="flex items-center gap-3">
              <div className="bg-[#D946EF]/10 p-2 rounded-lg text-[#D946EF] group-hover:scale-110 transition-transform"><Gift size={20}/></div>
              <div className="text-left"><p className="text-sm font-black text-white uppercase">5 Raspadinhas</p><p className="text-[9px] text-[#D946EF]/70 uppercase tracking-widest">Mais chances</p></div>
            </div>
            <span className="text-lg font-black text-[#D946EF]">R$ 12</span>
          </button>

          <button onClick={() => buyCards(10, 20)} className="w-full bg-gradient-to-r from-[#D946EF]/20 to-purple-500/20 border border-[#D946EF]/50 hover:border-[#D946EF] p-4 rounded-2xl flex justify-between items-center group transition-all relative overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.15)]">
            <div className="absolute top-0 right-0 bg-white text-black text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">MAIS VENDIDO</div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg text-white group-hover:scale-110 transition-transform"><Sparkles size={20}/></div>
              <div className="text-left"><p className="text-sm font-black text-white uppercase">10 Raspadinhas</p><p className="text-[9px] text-white/70 uppercase tracking-widest">Complete a coleção</p></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 line-through">R$ 30</p>
              <p className="text-xl font-black text-white">R$ 20</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
