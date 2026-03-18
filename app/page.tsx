"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { MobileShell } from "@/components/MobileShell";
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
const NICKNAMES = ["MlkPiranha", "Sexy", "Delícia", "da_Savanah", "Vip", "Top", "Hot", "Moreno", "Loira", "Papi", "Baby", "Brabo", "Safadinho", "Malvadão", "Explosão", "Noite", "Momo", "Chapa", "Feroz", "Dengo", "Instigante", "Elite", "Ousado", "Diamante", "Comandante"];

export default function Home() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [modelName, setModelName] = useState("Savanah");
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
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [accumulatedPrizes, setAccumulatedPrizes] = useState<any[]>([]);

  const autoSpinRef = useRef(false);
  const autoSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSpinRef = useRef<any>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fetchPlayerCredits = async (playerName: string) => {
    if (!supabaseUrl || !supabaseKey) return;
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${playerName}&select=credits`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store'
      });
      const data = await res.json();
      if (data && data.length > 0) setPlayer((prev: any) => ({ ...prev, credits: data[0].credits }));
    } catch (err) { }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const responsePrizes = await fetch(`/api/prizes?t=${Date.now()}`, { cache: "no-store", headers: { Pragma: "no-cache" } });
        const dataPrizes = await responsePrizes.json();
        setPrizes(dataPrizes);

        if (supabaseUrl && supabaseKey) {
          const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: "no-store"
          });
          const dataConfig = await resConfig.json();
          if (dataConfig && dataConfig.length > 0) {
            if (dataConfig[0].bg_url) setBgUrl(`${dataConfig[0].bg_url}?t=${Date.now()}`);
            if (dataConfig[0].model_name) setModelName(dataConfig[0].model_name);
            if (dataConfig[0].whatsapp) setWhatsapp(dataConfig[0].whatsapp);
            if (dataConfig[0].spin_cost) setSpinCost(dataConfig[0].spin_cost);
            setPixKeys({ 10: dataConfig[0].pix_10 || "", 20: dataConfig[0].pix_20 || "", 50: dataConfig[0].pix_50 || "" });
          }
        }

        const savedPlayerName = localStorage.getItem("savanah_player_name");
        if (savedPlayerName && supabaseUrl && supabaseKey) {
          const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${savedPlayerName}&select=*`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, cache: "no-store"
          });
          const dataPlayer = await resPlayer.json();
          if (dataPlayer && dataPlayer.length > 0) setPlayer(dataPlayer[0]);
        }
      } catch (error) { } finally { setLoading(false); setMounted(true); }
    }
    fetchData();
    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
    const interval = setInterval(() => {
       const name = localStorage.getItem("savanah_player_name");
       if(name) fetchPlayerCredits(name);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { runSpinRef.current = runSpin; });

  useEffect(() => {
    if (!autoSpin || isSpinning) return;
    autoSpinTimerRef.current = setTimeout(() => {
      if (autoSpinRef.current && runSpinRef.current) runSpinRef.current(true);
    }, 1500); 
    return () => { if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current); };
  }, [autoSpin, isSpinning]);

  const segments = useMemo(() => prizes.map((p) => ({ color: p.color || "#ff0000", label: p.shortLabel || p.name })), [prizes]);

  const winnerFeed = useMemo(() => {
    if (prizes.length === 0) return [];
    return Array.from({ length: 40 }).map(() => {
      const prize = prizes[Math.floor(Math.random() * prizes.length)].name;
      const type = Math.floor(Math.random() * 3);
      let name = "";
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomNick = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
      if (type === 0) name = randomName; else if (type === 1) name = randomNick; else name = `${randomName} ${randomNick}`;
      return { name, prize };
    });
  }, [prizes]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const cleanZap = regZap.replace(/\D/g, "");
    if (regPass !== regConfirm) return setAuthError("As senhas não são iguais.");
    setAuthLoading(true);
    try {
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${regName}&select=name`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
      const checkData = await checkRes.json();
      if (checkData && checkData.length > 0) { setAuthError("Este apelido já está em uso."); setAuthLoading(false); return; }
      const resInsert = await fetch(`${supabaseUrl}/rest/v1/Players`, {
        method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ name: regName, whatsapp: cleanZap, email: regEmail.trim(), password: regPass, credits: 0 }),
      });
      const dataInsert = await resInsert.json();
      if (dataInsert && dataInsert.length > 0) { setPlayer(dataInsert[0]); localStorage.setItem("savanah_player_name", dataInsert[0].name); setShowAuthModal(false); }
    } catch (err) { setAuthError("Erro de conexão."); } finally { setAuthLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const cleanZap = logUser.replace(/\D/g, "");
    setAuthLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/Players?password=eq.${encodeURIComponent(logPass)}&whatsapp=eq.${cleanZap}&select=*`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
      const data = await res.json();
      if (data && data.length > 0) { setPlayer(data[0]); localStorage.setItem("savanah_player_name", data[0].name); setShowAuthModal(false); }
      else setAuthError("WhatsApp ou Senha incorretos.");
    } catch (err) { setAuthError("Erro de conexão."); } finally { setAuthLoading(false); }
  };

  const deductCredits = async () => {
    if (!player) return false;
    const res = await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${player.name}&select=credits`, { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` }, cache: 'no-store' });
    const data = await res.json();
    const currentCredits = data?.[0]?.credits || 0;
    if (currentCredits < spinCost) { setShowDeposit(true); setAutoSpin(false); autoSpinRef.current = false; setPlayer({ ...player, credits: currentCredits }); return false; }
    const newCredits = currentCredits - spinCost;
    setPlayer({ ...player, credits: newCredits });
    try {
      await fetch(`${supabaseUrl}/rest/v1/Players?name=eq.${player.name}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ credits: newCredits }) });
      return true;
    } catch (e) { return false; }
  };

  const runSpin = async (fromAuto = false) => {
    if (isSpinning || prizes.length === 0) return;
    if (!player) { setAuthMode("choose"); setShowAuthModal(true); return; }
    if (fromAuto) setModalOpen(false);
    const success = await deductCredits();
    if (!success) return;
    const count = prizes.length;
    const weights = prizes.map((p) => Number(p.weight) || 10);
    const index = weightedRandomIndex(weights);
    const wonPrize = prizes[index];
    setIsSpinning(true);
    if (spinAudioRef.current && soundEnabled) { spinAudioRef.current.currentTime = 0; spinAudioRef.current.play().catch(() => {}); }
    setRotation((prev) => {
      const currentMod = prev % 360;
      const targetMod = (360 - index * (360 / count)) % 360;
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
          method: "POST", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ player_name: player.name, prize_name: wonPrize.name, delivered: false })
      }).catch(e => { });
      if (spinAudioRef.current) spinAudioRef.current.pause();
      if (winAudioRef.current && soundEnabled) { winAudioRef.current.currentTime = 0.6; winAudioRef.current.play().catch(() => {}); }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#FF1493", "#f3c96a", "#8a5b13", "#ff4d4d", "#ef4444"], zIndex: 9999 });
    }, SPIN_DURATION + 80);
  };

  const handleManualSpin = () => { if (!isSpinning && !autoSpin) runSpin(false); };
  const handleToggleAutoSpin = () => {
    if (autoSpin) { autoSpinRef.current = false; setAutoSpin(false); return; }
    if (isSpinning) return;
    autoSpinRef.current = true; setAutoSpin(true);
  };

  const openWhatsApp = (text: string, isWithdrawal = false) => { 
    window.location.href = `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(text)}`; 
    if (isWithdrawal) { setAccumulatedPrizes([]); setShowProfile(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Carregando...</div>;

  return (
    <div className="min-h-screen font-sans text-white bg-black">
      <MobileShell>
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit]">
          <div className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat" style={ bgUrl ? { backgroundImage: `url(${bgUrl})` } : { backgroundColor: "#120008" } } />
          {bgUrl && <div className="absolute inset-0 bg-black/55" />}
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between pointer-events-auto">
          <div className="relative pt-4 px-4">
            <div className="flex justify-end mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase font-bold text-white/90 shadow-md">
                {player ? `Logado: ${player.name.split(" ")[0]}` : "Online"} <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl italic font-serif text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-none tracking-wide">
                Roleta Sexy<br/><span className="text-[14px] text-white/90 uppercase tracking-[0.2em] not-italic font-sans">da {modelName}</span>
              </h1>
              <div className="flex items-center gap-3">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.2)] text-[#FFD700] transition-all active:scale-90">
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button onClick={() => player ? setShowProfile(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.2)] text-[#FFD700] transition-all active:scale-90"><User size={16} /></button>
                <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 border border-[#FFD700]/50 shadow-[0_0_10px_rgba(255,215,0,0.2)] text-[#FFD700] transition-all active:scale-90"><ShoppingCart size={16} /></button>
              </div>
            </div>

            {/* FEED DE GANHADORES COM DOURADO EXATO */}
            <div className="relative w-full h-8 bg-black/40 border-y border-[#FFD700]/30 overflow-hidden backdrop-blur-sm">
              <div className="flex whitespace-nowrap animate-marquee items-center h-full">
                {[...winnerFeed, ...winnerFeed].map((w, i) => (
                  <span key={i} className="mx-12 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                    <Sparkles size={11} className="text-[#FFD700] animate-pulse" />
                    <span className="text-white/80">{w.name}</span>
                    <span className="text-[#FF1493] drop-shadow-[0_0_5px_rgba(255,20,147,0.5)]">ganhou {w.prize}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center w-full mt-2 scale-[0.80]">
            {prizes.length > 0 && <RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={handleManualSpin} durationMs={SPIN_DURATION} />}
          </div>

          <div className="relative pb-6 pt-2 px-4 shrink-0">
            <div className="grid grid-cols-[1fr_1.4fr_1fr] items-end gap-3">
              <div className="rounded-2xl bg-black/70 p-4 ring-1 ring-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)] backdrop-blur-md flex flex-col">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Saldo</span>
                <span className="text-sm font-black text-white">{player ? player.credits : 0} CR</span>
              </div>
              <button onClick={handleManualSpin} disabled={isSpinning} className="h-16 rounded-2xl bg-gradient-to-b from-[#FF1493] to-[#8B0045] text-lg font-black uppercase tracking-tighter text-white shadow-[0_12px_32px_rgba(255,20,147,0.45)] active:scale-95 disabled:opacity-50 transition-all border border-[#FF1493]/50">Girar</button>
              <div className="rounded-2xl bg-black/70 p-4 ring-1 ring-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)] backdrop-blur-md flex flex-col text-right">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Custo</span>
                <span className="text-sm font-black text-[#FFD700]">{spinCost} CR</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => player ? setShowDeposit(true) : setShowAuthModal(true)} className="flex-1 py-3 rounded-xl border border-[#FFD700]/30 bg-black/60 text-[#FFD700] text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(255,215,0,0.1)]">Depositar</button>
              <button onClick={handleToggleAutoSpin} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ autoSpin ? "bg-[#FF1493] text-white shadow-[#FF1493]/40 border border-[#FF1493]" : "bg-black/60 border border-white/20 text-white" }`}>{autoSpin ? "Parar Auto" : "Auto Giro"}</button>
            </div>
          </div>
        </div>
      </MobileShell>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 90s linear infinite; width: fit-content; }
      `}</style>

      {/* MODAIS (LOGIN, DEPÓSITO, PERFIL)... */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-8 rounded-3xl w-full max-w-sm relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/30"><X size={20} /></button>
            {authError && <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] p-3 rounded-xl text-center uppercase font-bold tracking-widest">{authError}</div>}
            {authMode === "choose" && (
              <div className="text-center">
                <h2 className="text-xl font-black uppercase mb-2 text-[#FF1493]">Amor, já tem uma conta?</h2>
                <div className="space-y-3 mt-8">
                  <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="w-full bg-[#FF1493] text-white shadow-[0_0_15px_rgba(255,20,147,0.4)] font-black uppercase text-xs py-4 rounded-xl">Já tenho conta</button>
                  <button onClick={() => { setAuthMode("register"); setAuthError(""); }} className="w-full bg-white/5 border border-white/20 text-white font-black uppercase text-xs py-4 rounded-xl">Não tenho conta</button>
                </div>
              </div>
            )}
            {authMode === "login" && (
              <form onSubmit={handleLogin}>
                <h2 className="text-xl font-black uppercase mb-6 text-center text-[#FF1493]">Entrar</h2>
                <input type="tel" placeholder="WHATSAPP" required value={logUser} onChange={(e) => setLogUser(formatPhone(e.target.value))} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-xs mb-3 outline-none focus:border-[#FF1493]" />
                <div className="relative mb-6">
                  <input type={showPass ? "text" : "password"} placeholder="SENHA" required value={logPass} onChange={(e) => setLogPass(e.target.value)} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-[#FF1493] pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-4 rounded-xl">{authLoading ? "Aguarde..." : "Logar"}</button>
                <button type="button" onClick={() => setAuthMode("choose")} className="w-full text-[10px] text-white/30 mt-4 uppercase font-bold tracking-widest">Voltar</button>
              </form>
            )}
            {authMode === "register" && (
              <form onSubmit={handleRegister}>
                <h2 className="text-xl font-black uppercase mb-6 text-center text-[#FF1493]">Criar Conta</h2>
                <input type="text" placeholder="APELIDO (SIGILO TOTAL)" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs mb-2 outline-none focus:border-[#FF1493]" />
                <input type="tel" placeholder="WHATSAPP" required value={regZap} onChange={(e) => setRegZap(formatPhone(e.target.value))} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs mb-2 outline-none focus:border-[#FF1493]" />
                <input type="email" placeholder="EMAIL" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs mb-2 outline-none focus:border-[#FF1493]" />
                <div className="relative mb-2"><input type={showPass ? "text" : "password"} placeholder="SENHA" required value={regPass} onChange={(e) => setRegPass(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#FF1493]" /></div>
                <div className="relative mb-6"><input type={showPass ? "text" : "password"} placeholder="CONFIRME A SENHA" required value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs outline-none pr-10 focus:border-[#FF1493]" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
                <button type="submit" disabled={authLoading} className="w-full bg-[#FF1493] text-white font-black uppercase text-xs py-4 rounded-xl">Criar e Jogar</button>
                <button type="button" onClick={() => setAuthMode("choose")} className="w-full text-[10px] text-white/30 mt-4 uppercase font-bold tracking-widest">Voltar</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-3xl w-full max-w-sm relative">
            <button onClick={() => { setShowDeposit(false); setDepositOption(null); }} className="absolute top-4 right-4 text-white/30"><X size={20} /></button>
            <h2 className="text-xl font-black uppercase text-center mb-1 text-[#FFD700]">Recarregar</h2>
            <p className="text-[10px] text-white/50 text-center uppercase tracking-widest mb-6 font-bold">{player?.credits < spinCost ? "Amor, seus créditos acabaram!" : "Escolha um pacote"}</p>
            {!depositOption ? (
              <div className="space-y-3">
                <button onClick={() => setDepositOption(10)} className="w-full flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl"><div className="text-left"><span className="block text-sm font-black text-white">15 CRÉDITOS</span><span className="text-[9px] text-white/40 tracking-widest">R$ 10,00</span></div><span className="bg-[#FF1493] text-white font-black text-[10px] px-3 py-1 rounded-lg">PIX</span></button>
                <button onClick={() => setDepositOption(20)} className="w-full flex justify-between items-center p-4 bg-amber-500/10 border border-[#FFD700]/30 rounded-2xl relative overflow-hidden"><div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg">+5 BÔNUS</div><div className="text-left"><span className="block text-sm font-black text-[#FFD700]">25 CRÉDITOS</span><span className="text-[9px] text-[#FFD700]/40 tracking-widest">R$ 20,00</span></div><span className="bg-[#FFD700] text-black font-black text-[10px] px-3 py-1 rounded-lg">PIX</span></button>
                <button onClick={() => setDepositOption(50)} className="w-full flex justify-between items-center p-4 bg-[#FF1493]/10 border border-[#FF1493]/30 rounded-2xl relative overflow-hidden"><div className="absolute top-0 right-0 bg-[#FF1493] text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg">+10 BÔNUS</div><div className="text-left"><span className="block text-sm font-black text-[#FF1493]">60 CRÉDITOS</span><span className="text-[9px] text-[#FF1493]/40 tracking-widest">R$ 50,00</span></div><span className="bg-[#FF1493] text-white font-black text-[10px] px-3 py-1 rounded-lg">PIX</span></button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-black/40 border border-[#FFD700]/20 p-4 rounded-2xl mb-4">
                  <p className="text-[10px] text-white/50 uppercase mb-2">Chave Pix Copia e Cola:</p>
                  <div className="bg-black p-3 rounded-lg text-[8px] break-all font-mono text-[#FFD700] mb-3 border border-[#FFD700]/10 max-h-20 overflow-y-auto">{pixKeys[depositOption]}</div>
                  <button onClick={() => { navigator.clipboard.writeText(pixKeys[depositOption]); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[10px] font-black uppercase text-[#FF1493] flex items-center justify-center gap-2 w-full">{copied ? <CheckCircle2 size={12} /> : <Copy size={12} />} {copied ? "Copiado!" : "Copiar Código"}</button>
                </div>
                <button onClick={() => openWhatsApp(`Oi amor! Sou o ${player.name} e acabei de pagar R$ ${depositOption} via PIX. Pode liberar meu saldo?`)} className="w-full bg-[#FF1493] text-white font-black py-4 rounded-xl text-xs uppercase shadow-2xl">Já Paguei! Enviar Comprovante</button>
                <button onClick={() => setDepositOption(null)} className="mt-4 text-[10px] text-white/30 uppercase font-black hover:text-white">Voltar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showProfile && player && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#0f0f0f] border border-[#FFD700]/30 p-6 rounded-3xl w-full max-w-sm text-center relative shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-white/30"><X size={20} /></button>
            <h2 className="text-lg font-black uppercase text-[#FF1493] mb-1">{player.name}</h2>
            <p className="text-[9px] text-white/40 uppercase mb-6 tracking-[0.2em]">{player.whatsapp}</p>
            <div className="bg-black/50 border border-white/5 p-4 rounded-2xl mb-4"><span className="text-[10px] text-[#FFD700]/50 uppercase block mb-1 font-bold">Créditos Atuais</span><span className="text-3xl font-black text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">{player.credits} CR</span></div>
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mb-6"><h3 className="text-[10px] font-bold text-white/50 uppercase mb-3 flex items-center gap-2 justify-center"><Gift size={12} className="text-[#FF1493]" /> Prêmios desta sessão</h3><div className="max-h-24 overflow-y-auto space-y-2">{accumulatedPrizes.length === 0 ? <p className="text-[9px] text-white/20 italic">Gire para ganhar prêmios!</p> : accumulatedPrizes.map((p, i) => <div key={i} className="text-[10px] text-white/70 uppercase font-bold bg-white/5 border border-white/10 p-2 rounded-lg">{p.name}</div>)}</div></div>
            <button onClick={() => openWhatsApp(`Oi amor, ganhei estes prêmios:\n${accumulatedPrizes.map((p) => `- ${p.name}`).join("\n")}`, true)} className="w-full bg-[#FF1493] text-white font-black py-4 rounded-xl text-xs uppercase mb-3">Retirar com a Modelo</button>
            <button onClick={() => { localStorage.removeItem("savanah_player_name"); window.location.reload(); }} className="text-white/30 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all">Sair da Conta</button>
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} onClose={() => setModalOpen(false)} />
    </div>
  );
}