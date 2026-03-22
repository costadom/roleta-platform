"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, Timer, ExternalLink, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";
import AuthModal from "@/components/AuthModal";

// LISTAS QUE ESTAVAM FALTANDO E CAUSARAM O ERRO:
const NAMES = ["Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Gustavo", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const NICKNAMES = ["MlkPiranha", "Sexy", "Delícia", "VIP", "Top", "Hot", "Moreno", "Loira", "Papi", "Baby", "Brabo", "Safadinho", "Malvadão", "Explosão", "Noite"];

const SPIN_DURATION = 4000;

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
        const dataMod = await resMod.json();
        if (!dataMod?.[0]) return;
        const mId = dataMod[0].id;

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

        if (isLoggedIn && savedPhone) {
          const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${savedPhone}&select=*`, { headers });
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

  const winnerFeed = useMemo(() => {
    if (prizes.length === 0) return [];
    return Array.from({ length: 15 }).map((_, i) => ({
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      prize: prizes[Math.floor(Math.random() * prizes.length)]?.name || "PRÊMIO"
    }));
  }, [prizes]);

  const runSpin = async (isSuper = false) => {
    if (!isAuthorized) { setShowAuthModal(true); return; }
    if (isSpinning || prizes.length === 0) return;
    const cost = isSuper ? 6 : 3;
    const balance = player?.credits || 0;
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
      setPlayer({ ...player, credits: newBal });
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { 
        method: "PATCH", 
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ credits: newBal }) 
      });
      if (soundEnabled) winAudioRef.current?.play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }, SPIN_DURATION + 100);
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] mb-4" size={40} /><p className="text-[10px] font-black uppercase tracking-widest">Carregando...</p></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        <div className="absolute inset-0 z-0">
           <div className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${!isAuthorized ? 'blur-xl brightness-[0.2]' : 'brightness-[0.4]'}`} style={{ backgroundImage: `url(${bgUrl})` }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          
          {/* Header com botão de perfil de volta */}
          <div className="p-5 flex justify-between items-center shrink-0">
             <button onClick={() => router.push('/vitrine')} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white"><ArrowLeft size={20}/></button>
             <div className="flex flex-col items-center">
                <span className="text-[#D946EF] font-black italic text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-[#FFD700]">{soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
                <button onClick={() => isAuthorized ? router.push('/perfil') : setShowAuthModal(true)} className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white"><User size={20}/></button>
             </div>
          </div>

          <div className="w-full h-10 bg-black/60 border-y border-white/5 backdrop-blur-sm overflow-hidden flex items-center relative shrink-0">
            <div className="flex whitespace-nowrap animate-marquee py-2">
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

          {/* Roleta: Prêmios visíveis mas bloqueados */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative min-h-[350px]">
             <div className={`transition-all duration-700 w-full flex justify-center ${!isAuthorized ? 'blur-[2px] opacity-40 pointer-events-none' : ''}`}>
                <RouletteWheel segments={prizes.map(p => ({ label: p.name, color: p.color }))} rotation={rotation} spinning={isSpinning} onClick={() => runSpin()} />
             </div>
             {!isAuthorized && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-white font-black uppercase italic text-lg mb-2">Acesso VIP</h3>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-6">Cadastre-se para ver os prêmios reais e girar</p>
                    <button onClick={() => setShowAuthModal(true)} className="bg-[#D946EF] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-95">Começar Agora</button>
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-4 shrink-0">
            <div className="bg-[#111] border border-white/5 p-4 rounded-[1.5rem] flex justify-between items-center mb-4 shadow-2xl">
               <div className="flex flex-col pl-2">
                  <span className="text-[9px] text-white/40 font-black uppercase">Seu Saldo</span>
                  <span className="text-xl font-black text-white italic tracking-tighter">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
               </div>
               <button onClick={() => isAuthorized ? setShowDeposit(true) : setShowAuthModal(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                 <PlusIcon size={14}/> Depositar
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => runSpin(false)} disabled={isSpinning} className="bg-[#D946EF] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 disabled:opacity-50">
                <span className="text-xs font-black uppercase italic">Giro Normal</span>
                <span className="text-[9px] font-bold text-white/60 uppercase">3 CRÉDITOS</span>
              </button>
              <button onClick={() => runSpin(true)} disabled={isSpinning} className="bg-[#FFD700] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)] active:scale-95 disabled:opacity-50 text-black">
                <span className="text-xs font-black uppercase italic flex items-center gap-1"><Zap size={14}/> Super Giro</span>
                <span className="text-[9px] font-bold text-black/60 uppercase">6 CRÉDITOS</span>
              </button>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 bg-black/40 backdrop-blur-md">
            <button onClick={() => router.push(`/${slug}`)} className="mb-6 w-full max-w-[340px] bg-[#141414]/90 border border-[#D946EF]/50 text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-2xl transition-all hover:bg-[#D946EF]/20"><ExternalLink size={16} className="text-[#D946EF]" /> Perfil da Modelo</button>
            <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
          </div>
        )}
      </div>

      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-[0_0_50px_rgba(217,70,239,0.15)]">
            <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase text-white italic text-center mb-6">Recarregar</h2>
            <div className="space-y-3">
              {[ { cr: 25, rs: 15, bonus: 5 }, { cr: 45, rs: 30, bonus: 10 }, { cr: 75, rs: 50, bonus: 15 } ].map((p) => (
                <button key={p.rs} onClick={() => handleGeneratePix(p.rs, p.cr)} className="w-full flex justify-between items-center p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-[#D946EF]/50 transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+{p.bonus} BÔNUS</div>
                  <div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono text-xs">R$ {p.rs},00</span></div>
                  <div className="bg-[#D946EF] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Pagar</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; }
      `}</style>
    </div>
  );
}

function PlusIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>; }
