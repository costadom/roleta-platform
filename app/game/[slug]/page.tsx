"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, KeyRound, Zap, Timer, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";
import AuthModal from "@/components/AuthModal";

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
      
      const isLoggedIn = localStorage.getItem("labz_player_logged");
      const savedPhone = localStorage.getItem("labz_player_phone");

      try {
        const headersFast = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-store" };

        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers: headersFast });
        const dataMod = await resMod.json();
        if (!dataMod || !dataMod[0]) { setLoading(false); return; }
        const mId = dataMod[0].id;
        setModelId(mId);

        const fetchPromises = [
          fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers: headersFast }),
          fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers: headersFast })
        ];

        // SINCRONIZAÇÃO: Se logou no novo sistema, busca os dados reais na tabela Players
        if (isLoggedIn && savedPhone) {
          setIsAuthorized(true);
          const cleanPhone = savedPhone.replace(/\D/g, "");
          fetchPromises.push(fetch(`${supabaseUrl}/rest/v1/Players?phone=eq.${cleanPhone}&select=*`, { headers: headersFast }));
        } else {
          setIsAuthorized(false);
          // Atraso de 1s só para o cara ver a roleta antes do modal subir
          setTimeout(() => setShowAuthModal(true), 1000);
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
           if (dataPlayer && dataPlayer[0]) {
             setPlayer(dataPlayer[0]);
             // Salva no formato antigo também para garantir compatibilidade com outras partes
             localStorage.setItem(`player_${slug}`, dataPlayer[0].phone);
           }
        }
      } catch (error) { console.error("Erro:", error); } finally { setLoading(false); }
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

  const handleGeneratePix = async (valorPago: number, creditosDoPacote: number) => {
    if (!player) return;
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
      }
    } catch (error) { console.error(error); }
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
            setPlayer((prev: any) => ({ ...prev, credits: (prev.credits || 0) + creditosGanhos }));
            setTimeout(() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }, 3000);
          }
        } catch (e) {}
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

  const runSpin = async (fromAuto = false, isSuperSpin = false) => {
    if (!isAuthorized) { setShowAuthModal(true); return; }
    if (isSpinning || prizes.length === 0) return;
    if (fromAuto) setModalOpen(false);
    
    const cost = isSuperSpin ? 6 : 3;
    const currentCredits = player?.credits || 0;

    if (currentCredits < cost) { setShowDeposit(true); setAutoSpin(false); autoSpinRef.current = false; return; }

    setIsSpinning(true);
    if (spinAudioRef.current && soundEnabled) { spinAudioRef.current.currentTime = 0; spinAudioRef.current.play().catch(() => {}); }
    
    const weights = prizes.map(p => Number(p.weight) || 10);
    const index = weightedRandomIndex(weights);
    const wonPrize = prizes[index];

    setRotation((prev) => {
      const currentMod = prev % 360;
      const sliceAngle = 360 / prizes.length;
      const targetMod = (360 - index * sliceAngle) % 360;
      let diff = targetMod - currentMod;
      if (diff < 0) diff += 360;
      return prev + 6 * 360 + diff;
    });

    setTimeout(async () => {
      setIsSpinning(false); setSelectedPrize(wonPrize); setModalOpen(true);
      const newCredits = currentCredits - cost;
      setPlayer({ ...player, credits: newCredits });
      
      // Atualiza banco
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { 
        method: "PATCH", 
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ credits: newCredits }) 
      });

      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current && soundEnabled) { winAudioRef.current.currentTime = 0.6; winAudioRef.current.play().catch(() => {}); }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }, SPIN_DURATION + 100);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4"><Loader2 className="animate-spin text-[#D946EF]" size={40} /><p className="uppercase font-black tracking-widest text-[10px]">Entrando...</p></div>
  );

  return (
    <div className="min-h-[100dvh] font-sans text-white bg-black flex items-center justify-center overflow-hidden sm:p-4">
      <div className="relative w-full h-[100dvh] sm:h-[95vh] max-w-[430px] mx-auto bg-black flex flex-col overflow-y-auto overflow-x-hidden sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl">
        
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700 ${!isAuthorized ? 'blur-md brightness-50' : ''}`} style={ bgUrl ? { backgroundImage: `url(${bgUrl})` } : { backgroundColor: "#120008" } } />
          {bgUrl && <div className="absolute inset-0 bg-black/45" />}
        </div>

        <div className={`relative z-10 flex h-full w-full flex-col justify-between transition-all duration-700 ${!isAuthorized ? 'blur-sm pointer-events-none' : ''}`}>
          <div className="pt-6 px-4 w-full">
            <div className="flex justify-end mb-2"><span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[9px] uppercase font-black">{player ? `Olá, ${player.email?.split("@")[0] || 'Jogador'}` : "Online"} <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /></span></div>
            <div className="flex items-center justify-between mb-4 w-full">
              <h1 className="text-2xl italic font-serif text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-tight">Roleta Sexy<br/><span className="text-[12px] text-white/90 uppercase not-italic font-sans">da {modelName}</span></h1>
              <div className="flex gap-2">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90">{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                <button onClick={() => setShowProfile(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90"><User size={18} /></button>
              </div>
            </div>
            <div className="relative w-full h-8 bg-black/50 border-y border-[#FFD700]/30 overflow-hidden"><div className="flex animate-marquee items-center h-full">{winnerFeed.concat(winnerFeed).map((w, i) => (<span key={i} className="mx-12 text-[10px] uppercase font-black tracking-widest flex items-center gap-2"><Sparkles size={11} className="text-[#FFD700]" />{w.name} ganhou {w.prize}</span>))}</div></div>
          </div>

          <div className="relative flex flex-1 items-center justify-center w-full min-h-[280px]">
            {prizes.length > 0 ? ( <div className="transform scale-[0.95] flex justify-center w-full"><RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={() => runSpin()} /></div> ) : ( <div className="text-center p-10"><Gift className="mx-auto text-[#D946EF] mb-4" size={48}/><p className="text-xs font-black text-white/50 uppercase">Carregando prêmios...</p></div> )}
          </div>

          <div className="relative pb-12 pt-4 px-4 w-full bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="flex items-center justify-between bg-black/80 ring-1 ring-[#FFD700]/30 p-4 rounded-2xl mb-3 shadow-lg">
               <div className="flex flex-col"><span className="text-[10px] font-bold text-white/50 uppercase mb-1">Seu Saldo</span><span className="text-xl font-black text-white">{player ? player.credits : 0} CR</span></div>
               <button onClick={() => setShowDeposit(true)} className="px-5 py-2 rounded-xl bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase flex items-center gap-2 border border-[#FFD700]/30"><ShoppingCart size={14}/> Depositar</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => runSpin(false, false)} disabled={isSpinning} className="flex-1 h-16 bg-gradient-to-b from-[#FF1493] to-[#8B0045] rounded-xl flex flex-col items-center justify-center shadow-lg border border-[#FF1493]/50 active:scale-95 disabled:opacity-50"><span className="text-sm font-black uppercase">Giro Normal</span><span className="text-[10px] opacity-70">3 CRÉDITOS</span></button>
              <button onClick={() => runSpin(false, true)} disabled={isSpinning} className="flex-1 h-16 bg-gradient-to-b from-[#FFD700] to-[#b8860b] rounded-xl flex flex-col items-center justify-center shadow-lg border border-[#FFD700]/50 active:scale-95 disabled:opacity-50"><span className="text-sm font-black uppercase text-black flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[10px] font-black text-black/70">6 CRÉDITOS</span></button>
            </div>
            <button onClick={() => { setAutoSpin(!autoSpin); autoSpinRef.current = !autoSpin; }} className={`mt-3 w-full py-4 rounded-xl text-[10px] font-black uppercase ${ autoSpin ? "bg-[#FF1493]" : "bg-black/70 border border-white/20" }`}>{autoSpin ? "Parar Auto" : "Auto Giro"}</button>
          </div>
        </div>

        {/* MODAL DE LOGIN NOVO - NÃO SAI DA PÁGINA AO CLICAR NO X */}
        {!isAuthorized && showAuthModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 bg-black/20 backdrop-blur-sm">
            <button onClick={() => router.push(`/${slug}`)} className="mb-6 w-full max-w-[340px] bg-[#141414]/90 border border-[#D946EF]/50 text-white py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-2xl"><ExternalLink size={16} className="text-[#D946EF]" /> Visitar Perfil da Modelo</button>
            <div className="w-full max-w-[340px]">
              <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
            </div>
          </div>
        )}
      </div>

      {/* DEPÓSITO E PERFIL IGUAIS AO ORIGINAL */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm relative text-center">
            <button onClick={() => setShowDeposit(false)} className="absolute top-6 right-6 text-white/30"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase text-[#FFD700] italic mb-6">Recarregar</h2>
            {pixLoading ? ( <Loader2 className="animate-spin text-[#FF1493] mx-auto" size={50} /> ) : pixPaid ? ( <CheckCircle2 size={70} className="text-emerald-500 mx-auto" /> ) : pixData ? (
               <div className="bg-black/80 p-6 rounded-3xl border border-[#FFD700]/20">
                 <img src={pixData.qr_code_base64} className="w-40 h-40 mx-auto mb-4" alt="PIX" />
                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); }} className="w-full py-4 bg-[#FF1493] rounded-xl font-black uppercase text-xs">{copied ? "Copiado!" : "Copiar Chave"}</button>
               </div>
            ) : (
              <div className="space-y-4">
                {[ { cr: 25, rs: 20 }, { cr: 35, rs: 30 }, { cr: 55, rs: 50 } ].map((p) => (
                  <button key={p.rs} onClick={() => handleGeneratePix(p.rs, p.cr)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl active:scale-95"><div className="text-left"><span className="block text-sm font-black">{p.cr} CRÉDITOS</span><span className="text-[9px] opacity-40">R$ {p.rs},00</span></div><span className="bg-[#FF1493] px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Comprar</span></button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showProfile && player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm text-center relative">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30"><X size={24} /></button>
            <div className="h-20 w-20 bg-[#FF1493]/20 rounded-full flex items-center justify-center mx-auto mb-4"><User size={40} className="text-[#FF1493]"/></div>
            <h2 className="text-xl font-black uppercase">{player.email?.split("@")[0]}</h2>
            <div className="bg-black/50 p-6 rounded-3xl my-6 border border-white/5"><span className="text-[10px] text-[#FFD700] uppercase block font-black">Saldo</span><span className="text-4xl font-black">{player.credits} CR</span></div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-white/20 text-[9px] font-black uppercase">Sair da Conta</button>
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />
      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 90s linear infinite; width: fit-content; } `}</style>
    </div>
  );
}
