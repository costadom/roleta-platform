"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Eye, EyeOff, Sparkles, Loader2, Mail, KeyRound } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { weightedRandomIndex } from "@/src/lib/weightedRandom";
import { PrizeModal } from "@/components/PrizeModal";

const SPIN_DURATION = 4000;

const formatPhone = (val: string) => {
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 2 && v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length > 7) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  return v;
};

const NAMES = ["Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Gustavo", "Larissa", "Bruno", "Isabela", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Letícia", "Mateus", "Carla", "André", "Renata", "Vitor"];
const NICKNAMES = ["MlkPiranha", "Sexy", "Delícia", "VIP", "Top", "Hot", "Moreno", "Loira", "Papi", "Baby", "Brabo", "Safadinho", "Malvadão", "Explosão", "Noite", "Momo", "Chapa", "Feroz", "Dengo", "Instigante", "Elite", "Ousado", "Diamante", "Comandante"];

export default function GamePage() {
  const params = useParams();
  const slug = params.slug;

  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [spinCost, setSpinCost] = useState(2);
  const [pixKeys, setPixKeys] = useState<Record<number, string>>({ 10: "", 20: "", 50: "" });

  const [player, setPlayer] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"choose" | "login" | "register">("choose");
  const [authError, setAuthError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [depositOption, setDepositOption] = useState<10 | 20 | 50 | null>(null);
  const [copied, setCopied] = useState(false);

  const [regName, setRegName] = useState("");
  const [regZap, setRegZap] = useState("");
  const [regEmail, setRegEmail] = useState("");
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
        if (!dataMod[0]) return;
        const mId = dataMod[0].id;
        setModelId(mId);

        const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers, cache: "no-store" });
        const dataPrizes = await resPrizes.json();
        setPrizes(dataPrizes);

        const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers, cache: "no-store" });
        const dataConfig = await resConfig.json();
        if (dataConfig[0]) {
          setBgUrl(dataConfig[0].bg_url || "");
          setModelName(dataConfig[0].model_name || slug.toString().toUpperCase());
          setWhatsapp(dataConfig[0].whatsapp || "");
          setSpinCost(dataConfig[0].spin_cost || 2);
          setPixKeys({ 10: dataConfig[0].pix_10 || "", 20: dataConfig[0].pix_20 || "", 50: dataConfig[0].pix_50 || "" });
        }

        const savedPlayerName = localStorage.getItem(`player_${slug}`);
        if (savedPlayerName) {
           const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${savedPlayerName}&model_id=eq.${mId}&select=*`, { headers, cache: "no-store" });
           const dataPlayer = await resPlayer.json();
           if (dataPlayer[0]) setPlayer(dataPlayer[0]);
        }
      } catch (error) { } finally { setLoading(false); }
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
    autoSpinTimerRef.current = setTimeout(() => { if (autoSpinRef.current && runSpinRef.current) runSpinRef.current(true); }, 1500); 
    return () => { if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current); };
  }, [autoSpin, isSpinning]);

  const segments = useMemo(() => prizes.map((p) => ({ 
    color: p.color || "#ff0000", 
    label: p.name || p.shortLabel 
  })), [prizes]);

  const winnerFeed = useMemo(() => {
    if (prizes.length === 0) return [];
    return Array.from({ length: 40 }).map(() => {
      const prize = prizes[Math.floor(Math.random() * prizes.length)].name;
      const type = Math.floor(Math.random() * 2);
      let name = NAMES[Math.floor(Math.random() * NAMES.length)];
      if (type === 1) name = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
      return { name, prize };
    });
  }, [prizes]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (regPass !== regConfirm) return setAuthError("As senhas não coincidem.");
    setAuthLoading(true);
    
    try {
      const zapClean = regZap.replace(/\D/g, "");
      const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
        method: "POST",
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: regName,
          whatsapp: zapClean,
          password: regPass,
          model_id: modelId,
          credits: 0
        }),
      });

      const data = await res.json();

      if (res.ok && data && data[0]) { 
        setPlayer(data[0]); 
        localStorage.setItem(`player_${slug}`, data[0].name); 
        setShowAuthModal(false); 
      } else {
        setAuthError("Erro: Apelido ou WhatsApp já em uso.");
      }
    } catch (err) {
      setAuthError("Erro de conexão com o servidor.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const zap = logUser.replace(/\D/g, "");
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?password=eq.${encodeURIComponent(logPass)}&whatsapp=eq.${zap}&model_id=eq.${modelId}&select=*`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
      const data = await res.json();
      if (data && data[0]) { 
        setPlayer(data[0]); 
        localStorage.setItem(`player_${slug}`, data[0].name); 
        setShowAuthModal(false); 
      } else { 
        setAuthError("WhatsApp ou Senha incorretos."); 
      }
    } finally { setAuthLoading(false); }
  };

  const handleForgotPassword = () => {
    if (!whatsapp) return;
    window.location.href = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent("Oi amor! Esqueci minha senha na sua roleta sexy, pode me ajudar?")}`;
  };

  const deductCredits = async () => {
    if (!player || !modelId) return false;
    const res = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${player.name}&model_id=eq.${modelId}&select=credits`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' });
    const data = await res.json();
    const currentCredits = data?.[0]?.credits || 0;
    if (currentCredits < spinCost) { 
      setShowDeposit(true); 
      setAutoSpin(false); 
      autoSpinRef.current = false; 
      return false; 
    }
    const newCredits = currentCredits - spinCost;
    setPlayer({ ...player, credits: newCredits });
    await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${player.name}&model_id=eq.${modelId}`, { 
      method: "PATCH", 
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
      body: JSON.stringify({ credits: newCredits }) 
    });
    return true;
  };

  const runSpin = async (fromAuto = false) => {
    if (isSpinning || prizes.length === 0) return;
    if (!player) { setAuthMode("choose"); setShowAuthModal(true); return; }
    if (fromAuto) setModalOpen(false);
    
    const success = await deductCredits();
    if (!success) return;

    const weights = prizes.map((p) => Number(p.weight) || 10);
    const index = weightedRandomIndex(weights);
    const wonPrize = prizes[index];

    setIsSpinning(true);
    if (spinAudioRef.current && soundEnabled) { spinAudioRef.current.currentTime = 0; spinAudioRef.current.play().catch(() => {}); }
    
    setRotation((prev) => {
      const currentMod = prev % 360;
      const targetMod = (360 - index * (360 / prizes.length)) % 360;
      let diff = targetMod - currentMod;
      if (diff < 0) diff += 360;
      return prev + 6 * 360 + diff;
    });

    setTimeout(() => {
      setIsSpinning(false); 
      setSelectedPrize(wonPrize); 
      setModalOpen(true);
      setAccumulatedPrizes((prev) => [...prev, wonPrize]);
      
      fetch(`${supabaseUrl}/rest/v1/SpinHistory`, { 
        method: "POST", 
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ player_name: player.name, prize_name: wonPrize.name, delivered: false, model_id: modelId }) 
      }).catch(() => {});

      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current && soundEnabled) { winAudioRef.current.currentTime = 0.6; winAudioRef.current.play().catch(() => {}); }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#FF1493", "#FFD700", "#ffffff"] });
    }, SPIN_DURATION + 100);
  };

  if (loading) return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center text-white gap-4">
      <Loader2 className="animate-spin text-[#FF1493]" size={40} />
      <p className="uppercase font-black tracking-widest text-[10px]">Carregando Roleta Sexy...</p>
    </div>
  );

  return (
    <div className="min-h-[100dvh] font-sans text-white bg-[#0a0a0a] flex items-center justify-center overflow-hidden sm:p-4">
      <div className="relative w-full h-[100dvh] sm:h-[95vh] max-w-[430px] mx-auto bg-black flex flex-col overflow-hidden sm:rounded-[2.5rem] sm:border sm:border-white/10 shadow-2xl">
        
        {/* FUNDO */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat" style={ bgUrl ? { backgroundImage: `url(${bgUrl})` } : { backgroundColor: "#120008" } } />
          {bgUrl && <div className="absolute inset-0 bg-black/55" />}
        </div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between pointer-events-auto">
          {/* HEADER */}
          <div className="relative pt-6 px-4 w-full shrink-0">
            <div className="flex justify-end mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[9px] uppercase font-black text-white/90 shadow-md">
                {player ? `Logado: ${player.name.split(" ")[0]}` : "Online"} <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
            <div className="flex items-center justify-between mb-4 w-full">
              <h1 className="text-2xl italic font-serif text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-tight tracking-wide flex-1 pr-2">
                Roleta Sexy<br/><span className="text-[12px] text-white/90 uppercase tracking-[0.2em] not-italic font-sans">da {modelName}</span>
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] transition-all active:scale-90">{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                <button onClick={() => player ? setShowProfile(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] transition-all active:scale-90"><User size={18} /></button>
                <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 text-[#FFD700] transition-all active:scale-90"><ShoppingCart size={18} /></button>
              </div>
            </div>
            <div className="relative w-full h-8 bg-black/50 border-y border-[#FFD700]/30 overflow-hidden backdrop-blur-sm">
              <div className="flex whitespace-nowrap animate-marquee items-center h-full">
                {winnerFeed.concat(winnerFeed).map((w, i) => (<span key={i} className="mx-12 text-[10px] uppercase font-black tracking-widest flex items-center gap-2"><Sparkles size={11} className="text-[#FFD700] animate-pulse" /><span className="text-white/80">{w.name}</span><span className="text-[#FF1493]">ganhou {w.prize}</span></span>))}
              </div>
            </div>
          </div>

          {/* ROLETA */}
          <div className="relative flex flex-1 flex-col items-center justify-center w-full min-h-[350px]">
            {prizes.length > 0 ? (
              <div className="transform scale-[0.95] flex items-center justify-center w-full">
                <RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={() => runSpin(false)} durationMs={SPIN_DURATION} />
              </div>
            ) : (
              <div className="text-center p-10 bg-black/50 rounded-3xl border border-white/10 m-4">
                <Gift className="mx-auto text-[#FF1493] mb-4" size={48}/><p className="text-xs uppercase font-black text-white/50 tracking-widest">Aguardando prêmios...</p>
              </div>
            )}
          </div>

          {/* CONTROLES INFERIORES */}
          <div className="relative pb-8 pt-4 px-4 shrink-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="grid grid-cols-[1fr_1.4fr_1fr] items-center justify-center gap-3 w-full">
              <div className="rounded-2xl bg-black/80 p-3 ring-1 ring-[#FFD700]/30 backdrop-blur-md flex flex-col text-center shadow-lg h-full justify-center">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Saldo</span>
                <span className="text-sm font-black text-white">{player ? player.credits : 0} CR</span>
              </div>
              <button onClick={() => runSpin(false)} disabled={isSpinning || prizes.length === 0} className="h-16 w-full rounded-2xl bg-gradient-to-b from-[#FF1493] to-[#8B0045] text-lg font-black uppercase tracking-tighter text-white shadow-xl shadow-[#FF1493]/30 border border-[#FF1493]/50 disabled:opacity-50 transition-all active:scale-95">Girar</button>
              <div className="rounded-2xl bg-black/80 p-3 ring-1 ring-[#FFD700]/30 backdrop-blur-md flex flex-col text-center shadow-lg h-full justify-center">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Custo</span>
                <span className="text-sm font-black text-[#FFD700]">{spinCost} CR</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3 w-full">
              <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="flex-1 py-4 rounded-xl border border-[#FFD700]/30 bg-black/70 text-[#FFD700] text-[10px] font-black uppercase shadow-lg transition-all active:scale-95">Depositar</button>
              <button onClick={() => { setAutoSpin(!autoSpin); autoSpinRef.current = !autoSpin; }} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 ${ autoSpin ? "bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30" : "bg-black/70 border border-white/20 text-white" }`}>{autoSpin ? "Parar Auto" : "Auto Giro"}</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 90s linear infinite; width: fit-content; } `}</style>

      {/* MODAL DE LOGIN / CADASTRO */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            {authError && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] p-4 rounded-xl text-center uppercase font-bold tracking-widest leading-relaxed">{authError}</div>}
            
            {authMode === "choose" && (
              <div className="text-center py-6">
                <h2 className="text-2xl font-black uppercase mb-2 text-[#FF1493] italic tracking-tighter">Oi amor, já tem conta?</h2>
                <div className="space-y-4 mt-12">
                  <button onClick={() => setAuthMode("login")} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-5 rounded-2xl shadow-lg shadow-[#FF1493]/20 transition-all active:scale-95">Já sou de casa</button>
                  <button onClick={() => setAuthMode("register")} className="w-full bg-white/5 border border-white/10 text-white font-black uppercase text-xs py-5 rounded-2xl transition-all active:scale-95">Sou novo aqui</button>
                </div>
              </div>
            )}

            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-black uppercase mb-6 text-[#FF1493] text-center italic">Entrar</h2>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                  <input type="tel" placeholder="SEU WHATSAPP" required value={logUser} onChange={(e) => setLogUser(formatPhone(e.target.value))} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493]" />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
                  <input type={showPass ? "text" : "password"} placeholder="SUA SENHA" required value={logPass} onChange={(e) => setLogPass(e.target.value)} className="w-full bg-black border border-white/10 p-5 pl-12 rounded-2xl text-xs text-white outline-none focus:border-[#FF1493]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF1493]">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                </div>
                <button type="button" onClick={handleForgotPassword} className="w-full text-right text-[10px] text-white/40 uppercase font-black hover:text-[#FF1493] tracking-widest">Esqueci minha senha</button>
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase py-5 rounded-2xl shadow-xl shadow-[#FF1493]/20 transition-all active:scale-95 mt-4">{authLoading ? "Sincronizando..." : "Acessar Roleta Sexy"}</button>
                <button type="button" onClick={() => { setAuthMode("choose"); setAuthError(""); }} className="w-full text-[10px] text-white/20 uppercase font-black tracking-widest mt-4">Voltar</button>
              </form>
            )}

            {authMode === "register" && (
              <form onSubmit={handleRegister} className="space-y-3">
                <h2 className="text-xl font-black uppercase mb-4 text-[#FF1493] text-center italic">Novo Cadastro</h2>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                  <input type="text" placeholder="APELIDO (SIGILO TOTAL)" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" />
                </div>
                <input type="tel" placeholder="SEU WHATSAPP" required value={regZap} onChange={(e) => setRegZap(formatPhone(e.target.value))} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                  <input type="email" placeholder="EMAIL DE CONTATO" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                  <input type={showPass ? "text" : "password"} placeholder="CRIAR SENHA" required value={regPass} onChange={(e) => setRegPass(e.target.value)} className="w-full bg-black border border-white/10 p-4 pl-11 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FF1493]">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
                <input type="password" placeholder="CONFIRMAR SENHA" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs text-white outline-none focus:border-[#FF1493]" />
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase py-5 rounded-2xl shadow-xl shadow-[#FF1493]/20 transition-all active:scale-95 mt-2">{authLoading ? "Criando..." : "Cadastrar e Jogar"}</button>
                <button type="button" onClick={() => { setAuthMode("choose"); setAuthError(""); }} className="w-full text-[10px] text-white/20 uppercase font-black tracking-widest mt-2">Voltar</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DEPÓSITO */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-[3rem] w-full max-w-sm relative shadow-2xl text-center animate-in zoom-in duration-300">
            <button onClick={() => { setShowDeposit(false); setDepositOption(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase text-[#FFD700] mb-2 italic">Recarregar</h2>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-10">Escolha um pacote de créditos</p>
            
            {!depositOption ? (
              <div className="space-y-4">
                {[
                  { cr: 15, rs: 10, opt: 10, bonus: "+5 BÔNUS" },
                  { cr: 25, rs: 20, opt: 20, bonus: "+5 BÔNUS" },
                  { cr: 60, rs: 50, opt: 50, bonus: "+10 BÔNUS" }
                ].map((p) => (
                  <button key={p.opt} onClick={() => setDepositOption(p.opt as any)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#FFD700]/30 transition-all active:scale-95 relative overflow-hidden">
                    {p.bonus && <span className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">{p.bonus}</span>}
                    <div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">R$ {p.rs},00</span></div>
                    <span className="bg-[#FF1493] text-white font-black text-[9px] px-3 py-1.5 rounded-lg shadow-lg">COMPRAR</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="bg-black border border-[#FFD700]/20 p-6 rounded-3xl mb-6 shadow-inner">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-3">Chave Pix Copia e Cola:</p>
                  <div className="bg-[#0a0a0a] p-4 rounded-xl text-[9px] break-all font-mono text-[#FFD700] mb-4 border border-white/5 max-h-24 overflow-y-auto">{pixKeys[depositOption]}</div>
                  <button onClick={() => { navigator.clipboard.writeText(pixKeys[depositOption]); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-[#FF1493] hover:text-white transition-all">{copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied ? "Código Copiado!" : "Copiar Chave Pix"}</button>
                </div>
                <button onClick={() => window.location.href = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(`Oi! Aqui é o(a) ${player?.name}. Acabei de pagar R$ ${depositOption} via PIX para jogar na roleta da modelo ${modelName}. Pode liberar meus créditos?`)}`} className="w-full bg-[#FF1493] py-5 rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-[#FF1493]/20 transition-all active:scale-95">Já Paguei! Enviar Comprovante</button>
                <button onClick={() => setDepositOption(null)} className="mt-6 text-[10px] text-white/20 uppercase font-black tracking-widest">Voltar para pacotes</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* MODAL DE PERFIL */}
      {showProfile && player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-8 rounded-[3rem] w-full max-w-sm text-center relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <div className="h-20 w-20 bg-[#FF1493]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF1493]/30 shadow-xl"><User size={40} className="text-[#FF1493]"/></div>
            <h2 className="text-xl font-black uppercase text-white mb-1 tracking-tighter">{player.name}</h2>
            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-8">{player.whatsapp}</p>
            
            <div className="bg-black/50 border border-white/5 p-6 rounded-3xl mb-6 shadow-inner">
              <span className="text-[10px] text-[#FFD700] uppercase block mb-1 font-black">Créditos Atuais</span>
              <span className="text-4xl font-black text-white">{player.credits} <span className="text-lg text-white/20">CR</span></span>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mb-8">
              <h3 className="text-[9px] font-black text-white/30 uppercase mb-3 flex items-center gap-2 justify-center"><Gift size={12} className="text-[#FF1493]" /> Prêmios Ganhos</h3>
              <div className="max-h-24 overflow-y-auto space-y-2">
                {accumulatedPrizes.length === 0 ? (
                  <p className="text-[9px] text-white/10 italic py-4">Nenhum prêmio ainda...</p>
                ) : (
                  accumulatedPrizes.map((p, i) => <div key={i} className="text-[10px] text-white font-bold bg-white/5 p-2 rounded-lg uppercase border border-white/5">{p.name}</div>)
                )}
              </div>
            </div>

            <button onClick={() => window.location.href = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(`Oi! Aqui é o(a) ${player.name}. Girei a roleta da modelo ${modelName} e ganhei os seguintes prêmios:\n${accumulatedPrizes.map(p => `- ${p.name}`).join('\n')}`)}`} className="w-full bg-[#FF1493] text-white font-black py-5 rounded-2xl text-xs uppercase mb-4 shadow-xl transition-all active:scale-95">Retirar Prêmios no Whats</button>
            <button onClick={() => { localStorage.removeItem(`player_${slug}`); window.location.reload(); }} className="text-white/20 hover:text-red-500 text-[9px] font-black uppercase transition-all tracking-widest active:scale-95">Sair da Conta</button>
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} onClose={() => setModalOpen(false)} />
    </div>
  );
}
