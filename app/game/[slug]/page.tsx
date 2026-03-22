"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, Timer, ExternalLink, ArrowLeft } from "lucide-react";
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
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };

        // 1. Busca Modelo
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
        const dataMod = await resMod.json();
        if (!dataMod?.[0]) return;
        const mId = dataMod[0].id;
        setModelId(mId);

        // 2. Busca Prêmios e Configs
        const [resPrizes, resConfig] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers })
        ]);

        setPrizes(await resPrizes.json());
        const dataConfig = await resConfig.json();
        if (dataConfig?.[0]) {
          setBgUrl(dataConfig[0].bg_url || "");
          setModelName(slug.toString().toUpperCase());
        }

        // 3. Busca Jogador Real (Sistema Novo)
        if (isLoggedIn && savedPhone) {
          const cleanPhone = savedPhone.replace(/\D/g, "");
          const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?phone=eq.${cleanPhone}&select=*`, { headers });
          const dataPlayer = await resPlayer.json();
          if (dataPlayer?.[0]) {
            setPlayer(dataPlayer[0]);
            setIsAuthorized(true);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

  const segments = useMemo(() => prizes.map((p) => ({ color: p.color || "#ff0000", label: p.name })), [prizes]);
  
  const winnerFeed = useMemo(() => {
    if (prizes.length === 0) return [];
    return Array.from({ length: 20 }).map(() => ({
      name: Math.random() > 0.5 ? NAMES[Math.floor(Math.random() * NAMES.length)] : NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
      prize: prizes[Math.floor(Math.random() * prizes.length)]?.name || "PRÊMIO"
    }));
  }, [prizes]);

  const handleGeneratePix = async (val: number, credits: number) => {
    if (!player) return;
    setPixLoading(true);
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, userId: player.id }),
      });
      const data = await res.json();
      if (data.qr_code_base64) {
        setPixData(data);
        setPixTimeLeft(600);
      }
    } catch (e) {} finally { setPixLoading(false); }
  };

  const runSpin = async (isSuper = false) => {
    if (!isAuthorized) { setShowAuthModal(true); return; }
    if (isSpinning || prizes.length === 0) return;
    
    const cost = isSuper ? 6 : 3;
    const balance = player?.credits_balance || 0;

    if (balance < cost) { setShowDeposit(true); return; }

    setIsSpinning(true);
    if (soundEnabled) spinAudioRef.current?.play().catch(() => {});
    
    const weights = prizes.map(p => Number(p.weight) || 10);
    const index = weightedRandomIndex(weights);
    const won = prizes[index];

    setRotation(prev => {
      const slice = 360 / prizes.length;
      const target = (360 - index * slice) % 360;
      return prev + (360 * 6) + (target - (prev % 360) + 360) % 360;
    });

    setTimeout(async () => {
      setIsSpinning(false);
      setSelectedPrize(won);
      setModalOpen(true);
      const newBal = balance - cost;
      setPlayer({ ...player, credits_balance: newBal });
      
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { 
        method: "PATCH", 
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ credits_balance: newBal }) 
      });

      if (soundEnabled) winAudioRef.current?.play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }, SPIN_DURATION + 100);
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] mb-4" size={40} /><p className="text-[10px] font-black uppercase tracking-widest">Carregando Luxúria...</p></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col shadow-[0_0_50px_rgba(0,0,0,1)] border-x border-white/5">
        
        {/* Background c/ Blur dinâmico */}
        <div className="absolute inset-0 z-0">
           <div className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${!isAuthorized ? 'blur-xl brightness-[0.3]' : 'brightness-[0.5]'}`} style={{ backgroundImage: `url(${bgUrl})` }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          
          {/* Top Bar */}
          <div className="p-5 flex justify-between items-center">
             <button onClick={() => router.push('/vitrine')} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white"><ArrowLeft size={20}/></button>
             <div className="flex flex-col items-center">
                <span className="text-[#D946EF] font-black italic text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
                <span className="text-[8px] text-white/40 uppercase font-black tracking-[0.3em]">Roleta VIP</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-[#FFD700]">{soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
                <div className="px-3 h-10 bg-black/60 border border-emerald-500/30 rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-white/80">{player ? player.email.split('@')[0] : 'Online'}</span>
                </div>
             </div>
          </div>

          {/* Marquee Feed - CORRIGIDO */}
          <div className="w-full h-9 bg-[#D946EF]/10 border-y border-[#D946EF]/20 backdrop-blur-sm overflow-hidden flex items-center">
            <div className="flex whitespace-nowrap animate-marquee">
              {winnerFeed.concat(winnerFeed).map((w, i) => (
                <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter">
                  <Sparkles size={12} className="text-[#FFD700]" />
                  <span className="text-white/60">{w.name}</span>
                  <span className="text-white">GANHOU</span>
                  <span className="text-[#D946EF]">{w.prize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roleta Central */}
          <div className="flex-1 flex items-center justify-center px-4 relative">
             <div className={`transition-all duration-700 w-full flex justify-center ${!isAuthorized ? 'blur-md scale-95 opacity-50' : 'scale-100'}`}>
                <RouletteWheel segments={segments} rotation={rotation} spinning={isSpinning} onClick={() => runSpin()} />
             </div>
             {!isAuthorized && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-white font-black uppercase italic text-lg mb-2">Acesso Restrito</h3>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-6">Crie sua conta para ver os prêmios e girar</p>
                  <button onClick={() => setShowAuthModal(true)} className="bg-[#D946EF] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-95 transition-all">Começar Agora</button>
               </div>
             )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-10">
            <div className="bg-[#111] border border-white/5 p-4 rounded-[2rem] flex justify-between items-center mb-4 shadow-2xl">
               <div className="flex flex-col pl-2">
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Sua Carteira</span>
                  <span className="text-xl font-black text-white italic tracking-tighter">{player?.credits_balance || 0} <span className="text-[#D946EF]">CR</span></span>
               </div>
               <button onClick={() => isAuthorized ? setShowDeposit(true) : setShowAuthModal(true)} className="bg-white/5 hover:bg-[#D946EF] border border-white/10 hover:border-[#D946EF] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                 <ShoppingCart size={14}/> Depositar
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => runSpin(false)} disabled={isSpinning} className="bg-[#D946EF] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)] border border-white/10 active:scale-95 disabled:opacity-50">
                <span className="text-xs font-black uppercase italic">Giro Normal</span>
                <span className="text-[9px] font-bold text-white/60">3 CRÉDITOS</span>
              </button>
              <button onClick={() => runSpin(true)} disabled={isSpinning} className="bg-[#FFD700] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)] border border-white/10 active:scale-95 disabled:opacity-50 text-black">
                <span className="text-xs font-black uppercase italic flex items-center gap-1"><Zap size={14}/> Super Giro</span>
                <span className="text-[9px] font-bold text-black/60">6 CRÉDITOS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NOVO MODAL DE DEPÓSITO NEON */}
      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-[0_0_50px_rgba(217,70,239,0.15)] animate-in zoom-in duration-300">
            <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase text-white italic text-center mb-2">Recarregar <span className="text-[#D946EF]">CR</span></h2>
            
            {pixData ? (
              <div className="mt-6 text-center">
                 <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl mb-4 animate-pulse">
                    <p className="text-red-500 text-[10px] font-black uppercase">🔥 Expira em {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</p>
                 </div>
                 <div className="bg-white p-4 rounded-3xl inline-block mb-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <img src={pixData.qr_code_base64} alt="QR" className="w-44 h-44" />
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">
                    {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? "Copiado!" : "Copiar Código Pix"}
                 </button>
              </div>
            ) : (
              <div className="space-y-3 mt-6">
                {[ { cr: 25, rs: 20 }, { cr: 35, rs: 30 }, { cr: 55, rs: 50 } ].map((p) => (
                  <button key={p.rs} onClick={() => handleGeneratePix(p.rs, p.cr)} className="w-full flex justify-between items-center p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-[#D946EF]/50 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+5 BÔNUS</div>
                    <div className="text-left">
                       <span className="block text-sm font-black text-white group-hover:text-[#D946EF] transition-colors">{p.cr} CRÉDITOS</span>
                       <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">R$ {p.rs},00</span>
                    </div>
                    <div className="bg-[#D946EF] text-white p-2 rounded-lg"><ShoppingCart size={14}/></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN */}
      {showAuthModal && (
        <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; width: fit-content; }
      `}</style>
    </div>
  );
}
