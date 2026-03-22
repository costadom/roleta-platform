"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, Timer, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";
import AuthModal from "@/components/AuthModal"; // Importando nosso novo modal

function weightedRandomIndex(weights: number[]): number {
  let totalWeight = 0;
  for (let i = 0; i < weights.length; i++) totalWeight += weights[i];
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) return i;
    random -= weights[i];
  }
  return weights.length - 1;
}

const SPIN_DURATION = 4000;
const CENTRAL_WHATSAPP = "5515996587248";

const NAMES = ["Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Gustavo", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const NICKNAMES = ["MlkPiranha", "Sexy", "Delícia", "VIP", "Top", "Hot", "Moreno", "Loira", "Papi", "Baby", "Brabo", "Safadinho", "Malvadão", "Explosão", "Noite"];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");

  const [player, setPlayer] = useState<any | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositOption, setDepositOption] = useState<number | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);

  const [showProfile, setShowProfile] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [accumulatedPrizes, setAccumulatedPrizes] = useState<any[]>([]);

  const autoSpinRef = useRef(false);
  const autoSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSpinRef = useRef<any>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchData() {
      if (!slug || !supabaseUrl) return;
      
      // NOVA LÓGICA DE LOGIN: Verifica se a chave do novo sistema existe
      const isLoggedIn = localStorage.getItem("labz_player_logged");
      const savedPhone = localStorage.getItem("labz_player_phone");
      
      try {
        const headersFast = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };

        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers: headersFast });
        const dataMod = await resMod.json();
        if (!dataMod || !dataMod[0]) { setLoading(false); return; }
        const mId = dataMod[0].id;
        setModelId(mId);

        const fetchPromises = [
          fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers: headersFast }),
          fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers: headersFast })
        ];

        // Se estiver logado, busca o saldo real pelo telefone
        if (isLoggedIn && savedPhone) {
          setIsAuthorized(true);
          fetchPromises.push(fetch(`${supabaseUrl}/rest/v1/Players?phone=eq.${savedPhone.replace(/\D/g, "")}&select=*`, { headers: headersFast }));
        } else {
          setIsAuthorized(false);
          setShowAuthModal(true);
        }

        const responses = await Promise.all(fetchPromises);
        const dataPrizes = await responses[0].json();
        setPrizes(dataPrizes);

        const dataConfig = await responses[1].json();
        if (dataConfig && dataConfig[0]) {
          setBgUrl(dataConfig[0].bg_url || "");
          setModelName(dataConfig[0].model_name || slug.toString().toUpperCase());
        }

        if (responses[2]) {
           const dataPlayer = await responses[2].json();
           if (dataPlayer && dataPlayer[0]) setPlayer(dataPlayer[0]);
        }
      } catch (error) { console.error("Erro ao carregar jogo:", error); } finally { setLoading(false); }
    }
    fetchData();
    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

  useEffect(() => { runSpinRef.current = runSpin; });
  useEffect(() => {
    if (!autoSpin || isSpinning) return;
    autoSpinTimerRef.current = setTimeout(() => { if (autoSpinRef.current && runSpinRef.current) runSpinRef.current(true, false); }, 1500); 
    return () => { if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current); };
  }, [autoSpin, isSpinning]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDeposit && timeLeft > 0 && !pixData) {
      timer = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    } else if (!showDeposit) { setTimeLeft(900); }
    return () => clearInterval(timer);
  }, [showDeposit, timeLeft, pixData]);

  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      pixTimer = setInterval(() => { setPixTimeLeft((prev) => prev - 1); }, 1000);
    }
    return () => clearInterval(pixTimer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGeneratePix = async (valorPago: number, creditosDoPacote: number) => {
    if (!player || !player.id) return;
    setPixLoading(true); setPixPaid(false); setPixData(null); setDepositOption(creditosDoPacote); 
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: valorPago, userId: player.id }),
      });
      const data = await response.json();
      if (data.qr_code_base64) {
        setPixData(data);
        setPixTimeLeft(600);
      } else alert("Erro ao gerar PIX.");
    } catch (error) { console.error("Erro PIX:", error); }
    setPixLoading(false);
  };

  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (pixData && !pixPaid && player) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/check-status?userId=${player.id}`);
          const data = await res.json();
          if (data.status === 'pago') {
            setPixPaid(true); clearInterval(intervalo);
            const creditosGanhos = depositOption || 0;
            setPlayer((prev: any) => ({ ...prev, credits: prev.credits + creditosGanhos }));
            setTimeout(() => { setShowDeposit(false); setPixData(null); setPixPaid(false); setDepositOption(null); }, 3000);
          }
        } catch (error) { console.error("Erro radar:", error); }
      }, 3000); 
    }
    return () => clearInterval(intervalo);
  }, [pixData, pixPaid, player, depositOption]);

  const segments = useMemo(() => prizes.map((p) => ({ color: p.color || "#ff0000", label: p.name || p.shortLabel })), [prizes]);
  const winnerFeed = useMemo(() => {
    if (prizes.length === 0) return [];
    return Array.from({ length: 40 }).map(() => ({
      name: Math.random() > 0.5 ? NAMES[Math.floor(Math.random() * NAMES.length)] : NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
      prize: prizes[Math.floor(Math.random() * prizes.length)].name
    }));
  }, [prizes]);

  const deductCredits = async (cost: number) => {
    if (!player || !player.id) return false;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-store" }});
      const data = await res.json();
      const currentCredits = data?.[0]?.credits || 0;
      if (currentCredits < cost) { setShowDeposit(true); setAutoSpin(false); autoSpinRef.current = false; return false; }
      const newCredits = currentCredits - cost;
      setPlayer({ ...player, credits: newCredits });
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ credits: newCredits }) });
      return true;
    } catch (err) { return false; }
  };

  const runSpin = async (fromAuto = false, isSuperSpin = false) => {
    if (!isAuthorized) { setShowAuthModal(true); return; } // TRAVA SE NÃO ESTIVER LOGADO
    if (isSpinning || prizes.length === 0) return;
    if (fromAuto) setModalOpen(false);
    
    const cost = isSuperSpin ? 6 : 3;
    const success = await deductCredits(cost);
    if (!success) return; 

    let weights = prizes.map((p) => {
      const upperName = String(p.name).toUpperCase();
      const isFakePrize = Number(p.weight) <= 0.05 || upperName.includes("PIX") || upperName.includes("PRESENCIAL") || upperName.includes("100") || upperName.includes("R$");
      if (isFakePrize) return 0.000000001; 
      return Number(p.weight) || 10;
    });

    if (isSuperSpin) {
      const maxWeight = Math.max(...weights);
      weights = weights.map(w => (w < maxWeight && w > 0.01) ? w * 2 : w);
    }

    const index = weightedRandomIndex(weights);
    const wonPrize = prizes[index];

    setIsSpinning(true);
    if (spinAudioRef.current && soundEnabled) { spinAudioRef.current.currentTime = 0; spinAudioRef.current.play().catch(() => {}); }
    
    setRotation((prev) => {
      const currentMod = prev % 360;
      const sliceAngle = 360 / prizes.length;
      const targetMod = (360 - index * sliceAngle) % 360;
      const randomEdge = (Math.random() > 0.5 ? 1 : -1) * ((sliceAngle / 2) - 2);
      const finalTarget = targetMod + randomEdge;
      let diff = finalTarget - currentMod;
      if (diff < 0) diff += 360;
      return prev + 6 * 360 + diff;
    });

    setTimeout(() => {
      setIsSpinning(false); setSelectedPrize(wonPrize); setModalOpen(true);
      setAccumulatedPrizes((prev) => [...prev, wonPrize]);
      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current && soundEnabled) { winAudioRef.current.currentTime = 0.6; winAudioRef.current.play().catch(() => {}); }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#FFD700", "#FF1493", "#ffffff"] });
    }, SPIN_DURATION + 100);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4"><Loader2 className="animate-spin text-[#FF1493]" size={40} /><p className="uppercase font-black tracking-widest text-[10px]">Carregando A Roleta Sexy...</p></div>
  );

  return (
    <div className="min-h-[100dvh] font-sans text-white bg-black flex items-center justify-center overflow-hidden sm:p-4">
      <div className="relative w-full h-[100dvh] sm:h-[95vh] max-w-[430px] mx-auto bg-black flex flex-col overflow-y-auto overflow-x-hidden sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl">
        
        {/* FUNDO DA MODELO COM BLUR SE NÃO LOGADO */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 ${!isAuthorized ? 'blur-md brightness-50' : ''}`} style={ bgUrl ? { backgroundImage: `url(${bgUrl})` } : { backgroundColor: "#120008" } } />
          {bgUrl && <div className="absolute inset-0 bg-black/45" />}
        </div>

        {/* CONTEÚDO DA ROLETA (BLUR SE NÃO LOGADO) */}
        <div className={`relative z-10 flex h-full w-full flex-col justify-between transition-all duration-700 ${!isAuthorized ? 'blur-sm grayscale-[0.3] pointer-events-none select-none' : ''}`}>
          <div className="relative pt-6 px-4 w-full shrink-0">
            <div className="flex justify-end mb-2"><span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[9px] uppercase font-black text-white/90 shadow-md">{player ? `Logado: ${player.name.split(" ")[0]}` : "Online"} <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /></span></div>
            <div className="flex items-center justify-between mb-4 w-full">
              <h1 className="text-2xl italic font-serif text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-tight tracking-wide flex-1 pr-2">Roleta Sexy<br/><span className="text-[12px] text-white/90 uppercase tracking-[0.2em] not-italic font-sans">da {modelName}</span></h1>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90">{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                <button onClick={() => setShowProfile(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90"><User size={18} /></button>
              </div>
            </div>
            <div className="relative w-full h-8 bg-black/50 border-y border-[#FFD700]/30 overflow-hidden backdrop-blur-sm"><div className="flex whitespace-nowrap animate-marquee items-center h-full">{winnerFeed.concat(winnerFeed).map((w, i) => (<span key={i} className="mx-12 text-[10px] uppercase font-black tracking-widest flex items-center gap-2"><Sparkles size={11} className="text-[#FFD700] animate-pulse" /><span className="text-white/80">{w.name}</span><span className="text-[#FF1493]">ganhou {w.prize}</span></span>))}</div></div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center w-full min-h-[280px]">
            {prizes.length > 0 ? ( <div className="transform scale-[0.95] flex items-center justify-center w-full"><RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={() => runSpin(false, false)} durationMs={SPIN_DURATION} /></div> ) : ( <div className="text-center p-10 bg-black/50 rounded-3xl border border-white/10 m-4"><Gift className="mx-auto text-[#FF1493] mb-4" size={48}/><p className="text-xs uppercase font-black text-white/50 tracking-widest">Aguardando prêmios...</p></div> )}
          </div>

          <div className="relative pb-12 pt-4 px-4 shrink-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent mt-auto">
            <div className="flex items-center justify-between bg-black/80 ring-1 ring-[#FFD700]/30 p-4 rounded-2xl mb-3 shadow-lg backdrop-blur-md">
               <div className="flex flex-col"><span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Seu Saldo</span><span className="text-xl font-black text-white">{player ? player.credits : 0} CR</span></div>
               <button onClick={() => setShowDeposit(true)} className="px-5 py-2 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase shadow-lg active:scale-95 flex items-center gap-2"><ShoppingCart size={14}/> Depositar</button>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => runSpin(false, false)} disabled={isSpinning || prizes.length === 0} className="flex-1 h-16 bg-gradient-to-b from-[#FF1493] to-[#8B0045] rounded-xl flex flex-col items-center justify-center shadow-lg shadow-[#FF1493]/30 border border-[#FF1493]/50 disabled:opacity-50 active:scale-95"><span className="text-sm font-black uppercase text-white tracking-wider">Giro Normal</span><span className="text-[10px] font-black text-white/70 uppercase">3 CRÉDITOS</span></button>
              <button onClick={() => runSpin(false, true)} disabled={isSpinning || prizes.length === 0} className="flex-1 h-16 bg-gradient-to-b from-[#FFD700] to-[#b8860b] rounded-xl flex flex-col items-center justify-center shadow-lg shadow-[#FFD700]/30 border border-[#FFD700]/50 disabled:opacity-50 active:scale-95"><span className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[10px] font-black text-black/70 uppercase">6 CRÉDITOS</span></button>
            </div>
            <div className="mt-3 w-full"><button onClick={() => { setAutoSpin(!autoSpin); autoSpinRef.current = !autoSpin; }} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase active:scale-95 ${ autoSpin ? "bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30" : "bg-black/70 border border-white/20 text-white" }`}>{autoSpin ? "Parar Auto" : "Auto Giro"}</button></div>
          </div>
        </div>

        {/* SISTEMA DE LOGIN BLOQUEANTE */}
        {!isAuthorized && showAuthModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
            
            {/* BOTÃO PARA VISITAR O PERFIL DA MODELO */}
            <button 
              onClick={() => router.push(`/${slug}`)}
              className="mb-6 w-full max-w-[340px] bg-[#141414]/90 border border-[#D946EF]/50 hover:bg-[#D946EF]/20 backdrop-blur-md text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(217,70,239,0.2)]"
            >
              <ExternalLink size={16} className="text-[#D946EF]" /> Visitar Perfil da Modelo
            </button>

            <div className="w-full max-w-[340px]">
              <AuthModal 
                isOpen={true} 
                onClose={() => router.push("/vitrine")} // Se fechar, volta pra vitrine
              />
            </div>
          </div>
        )}

      </div>

      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 90s linear infinite; width: fit-content; } `}</style>

      {/* MODAL DE DEPÓSITO ORIGINAL */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm relative shadow-2xl text-center animate-in zoom-in duration-300">
            {!pixLoading && !pixPaid && <button onClick={() => { setShowDeposit(false); setPixData(null); setDepositOption(null); }} className="absolute top-6 right-6 text-white/30"><X size={24} /></button>}
            <h2 className="text-2xl font-black uppercase text-[#FFD700] mb-2 italic">Recarregar</h2>
            {pixLoading ? ( <div className="py-12"><Loader2 className="animate-spin text-[#FF1493] mx-auto mb-4" size={50} /><p className="text-[#FFD700] uppercase font-black text-[10px]">Conectando...</p></div> ) : pixPaid ? ( <div className="py-8 animate-bounce"><CheckCircle2 size={70} className="text-[#00ff00] mx-auto mb-4" /><h2 className="text-[#00ff00] text-xl font-black uppercase mb-2">Aprovado!</h2></div> ) : pixData ? (
              <div className="mt-6">
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl mb-4 flex items-center justify-center gap-2 animate-pulse"><Timer className="text-red-500" size={16} /><p className="text-red-500 text-[11px] font-black uppercase tracking-widest">Expira em {formatTime(pixTimeLeft)}</p></div>
                <div className="bg-black/80 border border-[#FFD700]/20 p-6 rounded-3xl mb-4 shadow-inner"><div className="bg-white p-2 rounded-xl inline-block mb-4"><img src={pixData.qr_code_base64} alt="QR Code" className="w-40 h-40" /></div><input readOnly value={pixData.qr_code} className="w-full bg-[#0a0a0a] border border-white/5 p-3 rounded-xl text-[9px] font-mono text-[#FFD700] mb-4 text-center" /><button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-[#FF1493] text-white py-4 rounded-xl">{copied ? "Copiado!" : "Copiar Chave"}</button></div>
              </div>
            ) : (
              <>
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl mb-6 flex items-center justify-center gap-2 animate-pulse"><Timer className="text-red-500" size={16} /><p className="text-red-500 text-[11px] font-black uppercase tracking-widest">Bônus expira em {formatTime(timeLeft)}</p></div>
                <div className="space-y-4">
                  {[ { cr: 25, rs: 20 }, { cr: 35, rs: 30 }, { cr: 55, rs: 50 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs, p.cr)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl active:scale-95 relative overflow-hidden transition-all hover:bg-white/10"><span className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+5 BÔNUS</span><div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">R$ {p.rs},00</span></div><span className="bg-[#FF1493] text-white font-black text-[9px] px-3 py-1.5 rounded-lg shadow-lg">COMPRAR</span></button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />
    </div>
  );
}
