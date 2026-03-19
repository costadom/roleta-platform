"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Eye, EyeOff, Sparkles, Loader2, KeyRound, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";

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

const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2 && v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 7) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  return v;
};

const NAMES = ["Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Gustavo", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const NICKNAMES = ["MlkPiranha", "Sexy", "Delícia", "VIP", "Top", "Hot", "Moreno", "Loira", "Papi", "Baby", "Brabo", "Safadinho", "Malvadão", "Explosão", "Noite"];

export default function GamePage() {
  const params = useParams();
  const slug = params.slug;

  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");

  const [player, setPlayer] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"choose" | "login" | "register">("choose");
  const [authError, setAuthError] = useState("");
  const [showPass, setShowPass] = useState(false);
  
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositOption, setDepositOption] = useState<number | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [regName, setRegName] = useState("");
  const [regZap, setRegZap] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [logUser, setLogUser] = useState("");
  const [logPass, setLogPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers, cache: "no-store" });
        const dataMod = await resMod.json();
        if (!dataMod || !dataMod[0]) { setLoading(false); return; }
        const mId = dataMod[0].id;
        setModelId(mId);

        const savedPlayerName = localStorage.getItem(`player_${slug}`);
        const fetchPromises = [
          fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers, cache: "no-store" }),
          fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers, cache: "no-store" })
        ];

        if (savedPlayerName) {
          fetchPromises.push(fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${encodeURIComponent(savedPlayerName)}&model_id=eq.${mId}&select=*`, { headers, cache: "no-store" }));
        }

        const responses = await Promise.all(fetchPromises);
        const dataPrizes = await responses[0].json();
        setPrizes(dataPrizes);

        const dataConfig = await responses[1].json();
        if (dataConfig && dataConfig[0]) {
          setBgUrl(dataConfig[0].bg_url || "");
          setModelName(dataConfig[0].model_name || slug.toString().toUpperCase());
        }

        if (savedPlayerName && responses[2]) {
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

  const handleGeneratePix = async (valorPago: number, creditosDoPacote: number) => {
    if (!player || !player.id) return;
    setPixLoading(true); setPixPaid(false); setPixData(null); setDepositOption(creditosDoPacote); 
    try {
      const response = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: valorPago, userId: player.id }),
      });
      const data = await response.json();
      if (data.qr_code_base64) setPixData(data);
      else alert("Erro ao gerar PIX. Tente novamente.");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError("");
    if (regPass !== regConfirm) return setAuthError("Senhas não coincidem.");
    setAuthLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ name: regName, whatsapp: regZap.replace(/\D/g, ""), password: regPass, model_id: modelId, credits: 0 }),
      });
      const data = await res.json();
      if (res.ok && data[0]) { setPlayer(data[0]); localStorage.setItem(`player_${slug}`, data[0].name); setShowAuthModal(false); } 
      else setAuthError("Apelido já em uso.");
    } catch (err) { setAuthError("Erro de conexão."); } finally { setAuthLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?password=eq.${encodeURIComponent(logPass)}&whatsapp=eq.${logUser.replace(/\D/g, "")}&model_id=eq.${modelId}&select=*`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
      const data = await res.json();
      if (data[0]) { setPlayer(data[0]); localStorage.setItem(`player_${slug}`, data[0].name); setShowAuthModal(false); } 
      else setAuthError("Dados incorretos.");
    } finally { setAuthLoading(false); }
  };

  const deductCredits = async (cost: number) => {
    if (!player || !player.id || !modelId) return false;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' });
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
    if (isSpinning || prizes.length === 0) return;
    if (!player) { setAuthMode("choose"); setShowAuthModal(true); return; }
    if (fromAuto) setModalOpen(false);
    
    // Define o custo do giro (3 ou 6)
    const cost = isSuperSpin ? 6 : 3;
    const success = await deductCredits(cost);
    if (!success) return; 

    // LÓGICA DE HIERARQUIA: Super Giro dobra o peso dos prêmios raros
    let weights = prizes.map((p) => Number(p.weight) || 10);
    if (isSuperSpin) {
      const maxWeight = Math.max(...weights);
      weights = weights.map(w => w < maxWeight ? w * 2 : w);
    }

    const index = weightedRandomIndex(weights);
    const wonPrize = prizes[index];

    setIsSpinning(true);
    if (spinAudioRef.current && soundEnabled) { spinAudioRef.current.currentTime = 0; spinAudioRef.current.play().catch(() => {}); }
    
    setRotation((prev) => {
      const currentMod = prev % 360;
      const sliceAngle = 360 / prizes.length;
      const targetMod = (360 - index * sliceAngle) % 360;
      
      // A MÁGICA DO "QUASE GANHEI" (60% de chance de parar na bordinha)
      const applyNearMiss = Math.random() > 0.4; 
      const nearMissOffset = (sliceAngle / 2) - 1.5; 
      const randomEdge = Math.random() > 0.5 ? nearMissOffset : -nearMissOffset;
      const finalTarget = applyNearMiss ? (targetMod + randomEdge) : targetMod;
      
      let diff = finalTarget - currentMod;
      if (diff < 0) diff += 360;
      return prev + 6 * 360 + diff;
    });

    setTimeout(() => {
      setIsSpinning(false); setSelectedPrize(wonPrize); setModalOpen(true);
      setAccumulatedPrizes((prev) => [...prev, wonPrize]);
      
      fetch(`${supabaseUrl}/rest/v1/SpinHistory`, { 
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ player_name: player.name, prize_name: wonPrize.name, delivered: wonPrize.delivery_type !== 'whatsapp', model_id: modelId }) 
      }).catch(() => {});

      if (wonPrize.delivery_type === 'credit') {
        const bonusAmount = Number(wonPrize.delivery_value) || 0;
        if (bonusAmount > 0) {
          setPlayer((prev: any) => ({ ...prev, credits: prev.credits + bonusAmount }));
          fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers: { apikey: supabaseKey! } })
            .then(r => r.json()).then(d => {
               fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, "Content-Type": "application/json" }, body: JSON.stringify({ credits: (d?.[0]?.credits || 0) + bonusAmount }) });
            });
        }
      }

      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current && soundEnabled) { winAudioRef.current.currentTime = 0.6; winAudioRef.current.play().catch(() => {}); }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#FFD700", "#FF1493", "#ffffff"] });
    }, SPIN_DURATION + 100);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4"><Loader2 className="animate-spin text-[#FF1493]" size={40} /><p className="uppercase font-black tracking-widest text-[10px]">Carregando...</p></div>
  );

  return (
    <div className="min-h-[100dvh] font-sans text-white bg-[#0a0a0a] flex items-center justify-center overflow-hidden sm:p-4">
      <div className="relative w-full h-[100dvh] sm:h-[95vh] max-w-[430px] mx-auto bg-black flex flex-col overflow-hidden sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl">
        <div className="absolute inset-0 z-0"><div className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat" style={ bgUrl ? { backgroundImage: `url(${bgUrl})` } : { backgroundColor: "#120008" } } />{bgUrl && <div className="absolute inset-0 bg-black/55" />}</div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between pointer-events-auto">
          <div className="relative pt-6 px-4 w-full shrink-0">
            <div className="flex justify-end mb-2"><span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[9px] uppercase font-black text-white/90 shadow-md">{player ? `Logado: ${player.name.split(" ")[0]}` : "Online"} <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /></span></div>
            <div className="flex items-center justify-between mb-4 w-full">
              <h1 className="text-2xl italic font-serif text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-tight tracking-wide flex-1 pr-2">Roleta Sexy<br/><span className="text-[12px] text-white/90 uppercase tracking-[0.2em] not-italic font-sans">da {modelName}</span></h1>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90">{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                <button onClick={() => player ? setShowProfile(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90"><User size={18} /></button>
                <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] active:scale-90"><ShoppingCart size={18} /></button>
              </div>
            </div>
            <div className="relative w-full h-8 bg-black/50 border-y border-[#FFD700]/30 overflow-hidden backdrop-blur-sm"><div className="flex whitespace-nowrap animate-marquee items-center h-full">{winnerFeed.concat(winnerFeed).map((w, i) => (<span key={i} className="mx-12 text-[10px] uppercase font-black tracking-widest flex items-center gap-2"><Sparkles size={11} className="text-[#FFD700] animate-pulse" /><span className="text-white/80">{w.name}</span><span className="text-[#FF1493]">ganhou {w.prize}</span></span>))}</div></div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center w-full min-h-[350px]">
            {prizes.length > 0 ? ( <div className="transform scale-[0.95] flex items-center justify-center w-full"><RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={() => runSpin(false, false)} durationMs={SPIN_DURATION} /></div> ) : ( <div className="text-center p-10 bg-black/50 rounded-3xl border border-white/10 m-4"><Gift className="mx-auto text-[#FF1493] mb-4" size={48}/><p className="text-xs uppercase font-black text-white/50 tracking-widest">Aguardando prêmios...</p></div> )}
          </div>

          <div className="relative pb-8 pt-4 px-4 shrink-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent">
            {/* NOVO LAYOUT DOS BOTÕES - SALDO EM CIMA */}
            <div className="flex items-center justify-between bg-black/80 ring-1 ring-[#FFD700]/30 p-4 rounded-2xl mb-3 shadow-lg backdrop-blur-md">
               <div className="flex flex-col"><span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Seu Saldo</span><span className="text-xl font-black text-white">{player ? player.credits : 0} CR</span></div>
               <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="px-5 py-2 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black uppercase shadow-lg active:scale-95 flex items-center gap-2"><ShoppingCart size={14}/> Depositar</button>
            </div>
            
            {/* GIRO NORMAL E SUPER GIRO LADO A LADO */}
            <div className="flex gap-2 w-full">
              <button onClick={() => runSpin(false, false)} disabled={isSpinning || prizes.length === 0} className="flex-1 h-16 bg-gradient-to-b from-[#FF1493] to-[#8B0045] rounded-xl flex flex-col items-center justify-center shadow-lg shadow-[#FF1493]/30 border border-[#FF1493]/50 disabled:opacity-50 active:scale-95"><span className="text-sm font-black uppercase text-white tracking-wider">Giro Normal</span><span className="text-[10px] font-black text-white/70 uppercase">3 CRÉDITOS</span></button>
              <button onClick={() => runSpin(false, true)} disabled={isSpinning || prizes.length === 0} className="flex-1 h-16 bg-gradient-to-b from-[#FFD700] to-[#b8860b] rounded-xl flex flex-col items-center justify-center shadow-lg shadow-[#FFD700]/30 border border-[#FFD700]/50 disabled:opacity-50 active:scale-95"><span className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[10px] font-black text-black/70 uppercase">6 CRÉDITOS</span></button>
            </div>
            
            <div className="mt-3 w-full"><button onClick={() => { setAutoSpin(!autoSpin); autoSpinRef.current = !autoSpin; }} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase active:scale-95 ${ autoSpin ? "bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30" : "bg-black/70 border border-white/20 text-white" }`}>{autoSpin ? "Parar Auto" : "Auto Giro (Normal)"}</button></div>
          </div>
        </div>
      </div>

      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 90s linear infinite; width: fit-content; } `}</style>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            {authError && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] p-4 rounded-xl text-center uppercase font-bold tracking-widest">{authError}</div>}
            {authMode === "choose" && (
              <div className="text-center py-6">
                <h2 className="text-2xl font-black uppercase mb-2 text-[#FF1493] italic tracking-tighter">Oi amor, já tem conta?</h2>
                <div className="space-y-4 mt-12">
                  <button onClick={() => setAuthMode("login")} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-5 rounded-2xl shadow-lg active:scale-95">Já sou de casa</button>
                  <button onClick={() => setAuthMode("register")} className="w-full bg-white/5 border border-white/10 text-white font-black uppercase text-xs py-5 rounded-2xl active:scale-95">Sou novo aqui</button>
                </div>
              </div>
            )}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-black uppercase mb-6 text-[#FF1493] text-center italic">Entrar</h2>
                <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/><input type="tel" placeholder="SEU WHATSAPP" required value={logUser} onChange={(e) => setLogUser(formatPhone(e.target.value))} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white" /></div>
                <div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/><input type={showPass ? "text" : "password"} placeholder="SUA SENHA" required value={logPass} onChange={(e) => setLogPass(e.target.value)} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase py-5 rounded-2xl mt-4 active:scale-95">{authLoading ? "Aguarde..." : "Acessar"}</button>
                <button type="button" onClick={() => setAuthMode("choose")} className="w-full text-[10px] text-white/20 uppercase font-black mt-4">Voltar</button>
              </form>
            )}
            {authMode === "register" && (
              <form onSubmit={handleRegister} className="space-y-3">
                <h2 className="text-xl font-black uppercase mb-4 text-[#FF1493] text-center italic">Novo Cadastro</h2>
                <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/><input type="text" placeholder="APELIDO" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl text-xs text-white" /></div>
                <input type="tel" placeholder="WHATSAPP" required value={regZap} onChange={(e) => setRegZap(formatPhone(e.target.value))} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />
                <div className="relative"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/><input type={showPass ? "text" : "password"} placeholder="SENHA" required value={regPass} onChange={(e) => setRegPass(e.target.value)} className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl text-xs text-white" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
                <input type="password" placeholder="CONFIRMAR SENHA" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white" />
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase py-5 rounded-2xl mt-2 active:scale-95">{authLoading ? "Criando..." : "Cadastrar"}</button>
                <button type="button" onClick={() => setAuthMode("choose")} className="w-full text-[10px] text-white/20 uppercase font-black mt-2">Voltar</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm relative shadow-2xl text-center animate-in zoom-in duration-300">
            {!pixLoading && !pixPaid && <button onClick={() => { setShowDeposit(false); setPixData(null); setDepositOption(null); }} className="absolute top-6 right-6 text-white/30"><X size={24} /></button>}
            <h2 className="text-2xl font-black uppercase text-[#FFD700] mb-2 italic">Recarregar</h2>
            {pixLoading ? (
              <div className="py-12"><Loader2 className="animate-spin text-[#FF1493] mx-auto mb-4" size={50} /><p className="text-[#FFD700] uppercase font-black text-[10px]">Conectando...</p></div>
            ) : pixPaid ? (
              <div className="py-8 animate-bounce"><CheckCircle2 size={70} className="text-[#00ff00] mx-auto mb-4" /><h2 className="text-[#00ff00] text-xl font-black uppercase mb-2">Aprovado!</h2><p className="text-white/70 text-[10px] uppercase font-bold">Voltando para o jogo...</p></div>
            ) : pixData ? (
              <div className="mt-6">
                <div className="bg-black/80 border border-[#FFD700]/20 p-6 rounded-3xl mb-4 shadow-inner"><p className="text-[10px] text-white/40 uppercase font-black mb-4">Escaneie para pagar</p><div className="bg-white p-2 rounded-xl inline-block mb-4"><img src={pixData.qr_code_base64} alt="QR Code" className="w-40 h-40" /></div><p className="text-[9px] text-white/40 uppercase font-black mb-2 mt-2">Ou Pix Copia e Cola:</p><input readOnly value={pixData.qr_code} className="w-full bg-[#0a0a0a] border border-white/5 p-3 rounded-xl text-[9px] font-mono text-[#FFD700] mb-4 text-center" /><button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-[#FF1493] text-white py-4 rounded-xl">{copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied ? "Copiado!" : "Copiar Chave"}</button></div>
                <p className="text-[9px] text-[#FF1493] font-bold uppercase animate-pulse mb-4">Aguardando confirmação...</p>
                <button onClick={() => { setPixData(null); setDepositOption(null); }} className="text-[10px] text-white/20 uppercase font-black">Voltar</button>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-8">Escolha um pacote</p>
                <div className="space-y-4">
                  {[ { cr: 20, rs: 15, bonus: "+5 BÔNUS" }, { cr: 30, rs: 25, bonus: "+5 BÔNUS" }, { cr: 40, rs: 35, bonus: "+5 BÔNUS" }, { cr: 60, rs: 55, bonus: "+5 BÔNUS" } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs, p.cr)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl active:scale-95 relative overflow-hidden">{p.bonus && <span className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">{p.bonus}</span>}<div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">R$ {p.rs},00</span></div><span className="bg-[#FF1493] text-white font-black text-[9px] px-3 py-1.5 rounded-lg shadow-lg">COMPRAR</span></button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {showProfile && player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm text-center relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30"><X size={24} /></button>
            <div className="h-20 w-20 bg-[#FF1493]/20 rounded-full flex items-center justify-center mx-auto mb-4"><User size={40} className="text-[#FF1493]"/></div>
            <h2 className="text-xl font-black uppercase text-white tracking-tighter">{player.name}</h2>
            <p className="text-[9px] text-white/30 uppercase font-black mb-8">{player.whatsapp}</p>
            <div className="bg-black/50 border border-white/5 p-6 rounded-3xl mb-6"><span className="text-[10px] text-[#FFD700] uppercase block mb-1 font-black">Créditos Atuais</span><span className="text-4xl font-black text-white">{player.credits}</span></div>
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mb-8">
              <h3 className="text-[9px] font-black text-white/30 uppercase mb-3"><Gift size={12} className="inline text-[#FF1493]" /> Seus Prêmios</h3>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {accumulatedPrizes.length === 0 ? <p className="text-[9px] text-white/10 italic py-4">Nenhum prêmio ainda...</p> : accumulatedPrizes.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5"><span className="text-[10px] text-white font-bold uppercase truncate pr-2 text-left">{p.name}</span>{p.delivery_type === 'link' && p.delivery_value && <button onClick={() => window.open(p.delivery_value, '_blank')} className="bg-emerald-500 text-black px-3 py-1.5 rounded-lg text-[8px] font-black uppercase active:scale-95">Acessar</button>}{p.delivery_type === 'credit' && <span className="text-emerald-400 font-black text-[9px] bg-emerald-500/10 px-2 py-1 rounded-lg">+{p.delivery_value} CR</span>}{(!p.delivery_type || p.delivery_type === 'whatsapp') && <span className="text-[#FF1493] font-black text-[8px] uppercase">Manual</span>}</div>
                ))}
              </div>
            </div>
            {accumulatedPrizes.filter(p => !p.delivery_type || p.delivery_type === 'whatsapp').length > 0 && <button onClick={() => window.location.href = `https://api.whatsapp.com/send?phone=${CENTRAL_WHATSAPP}&text=${encodeURIComponent(`Oi! Sou ${player.name}. Girei a roleta da ${modelName} e preciso resgatar: \n${accumulatedPrizes.filter(p => !p.delivery_type || p.delivery_type === 'whatsapp').map(p => `- ${p.name}`).join('\n')}`)}`} className="w-full bg-[#FF1493] text-white font-black py-5 rounded-2xl text-xs uppercase mb-4 active:scale-95">Retirar no Whats</button>}
            <button onClick={() => { localStorage.removeItem(`player_${slug}`); window.location.reload(); }} className="text-white/20 text-[9px] font-black uppercase mt-2">Sair da Conta</button>
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />
    </div>
  );
}
