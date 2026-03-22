"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, Timer, ExternalLink, ArrowLeft, LayoutGrid, Coins } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";
import AuthModal from "@/components/AuthModal";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
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
  const [allAssociations, setAllAssociations] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [showDeposit, setShowDeposit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
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
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-store" };
        
        // 1. Dados da Modelo (SEMPRE CARREGA)
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
        const dataMod = await resMod.json();
        const mId = dataMod[0]?.id;

        const [resPrizes, resConfig] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers })
        ]);

        setPrizes(await resPrizes.json());
        const dataConfig = await resConfig.json();
        if (dataConfig?.[0]) {
          setBgUrl(dataConfig[0].bg_url || "");
          setModelName(dataConfig[0].model_name || slug.toString().toUpperCase());
        }

        // 2. Dados do Jogador e Saldos
        if (isLoggedIn && savedPhone) {
          const resAll = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${savedPhone}&select=*,Models(slug)`, { headers });
          const dataAll = await resAll.json();
          setAllAssociations(dataAll);

          const currentPlayer = dataAll.find((p: any) => p.model_id === mId);
          if (currentPlayer && currentPlayer.full_name && currentPlayer.nickname) {
            setPlayer(currentPlayer);
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false); 
            setShowAuthModal(true); // Abre para associar ou completar perfil
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

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
      setIsSpinning(false); setSelectedPrize(won); setModalOpen(true);
      const newBal = balance - cost;
      setPlayer({ ...player, credits: newBal });
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { 
        method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
        body: JSON.stringify({ credits: newBal }) 
      });
      if (soundEnabled) winAudioRef.current?.play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }, SPIN_DURATION + 100);
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#D946EF] mb-4" size={40} /><p className="text-[10px] font-black uppercase text-white tracking-widest">Carregando...</p></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 overflow-hidden shadow-2xl">
        
        {/* FUNDO VISÍVEL SEMPRE (Com Blur leve se deslogado) */}
        <div className="absolute inset-0 z-0">
           <div className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${!isAuthorized ? 'blur-xl brightness-[0.2]' : 'brightness-[0.45]'}`} style={{ backgroundImage: `url(${bgUrl})` }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="p-4 flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center px-1">
                <div className="flex gap-2">
                   <button onClick={() => router.push('/vitrine')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all"><LayoutGrid size={12} /> Vitrine</button>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-[#FFD700]">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
                   <button onClick={() => isAuthorized ? setShowProfile(true) : setShowAuthModal(true)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white"><User size={18}/></button>
                </div>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[#D946EF] font-black italic text-xl tracking-tighter">Savanah <span className="text-white">Labz</span></span>
                <span className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest mt-0.5">Musa {modelName}</span>
             </div>
          </div>

          {/* ROLETA COM PRÊMIOS VISÍVEIS MAS BLOQUEADOS */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
             <div className={`transition-all duration-700 w-full flex justify-center ${!isAuthorized ? 'blur-[3px] opacity-40 grayscale-[0.5]' : ''}`}>
                <RouletteWheel segments={prizes.map(p => ({ label: p.name, color: p.color }))} rotation={rotation} spinning={isSpinning} onClick={() => runSpin()} />
             </div>
             {!isAuthorized && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-white font-black uppercase italic text-lg mb-2">Associe-se a {modelName}</h3>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-6">Cada musa tem seu próprio saldo de créditos.</p>
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
               <button onClick={() => isAuthorized ? setShowDeposit(true) : setShowAuthModal(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-[#D946EF]"><ShoppingCart size={14}/> Depositar</button>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 bg-black/40 backdrop-blur-md">
            <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
          </div>
        )}
      </div>

      {/* PERFIL MULTI-MODELO */}
      {showProfile && player && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative text-center shadow-2xl">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <div className="w-20 h-20 bg-[#D946EF]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><User size={40} className="text-[#D946EF]"/></div>
            <h2 className="text-xl font-black text-white uppercase italic">{player.nickname}</h2>
            
            <div className="mt-8 text-left">
               <h3 className="text-[10px] text-white/40 uppercase font-black mb-4 flex items-center gap-2"><Coins size={12} className="text-[#FFD700]"/> Seus Saldos</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {allAssociations.map((assoc: any) => (
                    <div key={assoc.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                       <span className="text-[11px] font-black uppercase text-white/80">{assoc.Models?.slug}</span>
                       <span className="text-xs font-black text-[#D946EF]">{assoc.credits} CR</span>
                    </div>
                  ))}
               </div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-white/20 text-[10px] font-black uppercase">Sair da Conta</button>
          </div>
        </div>
      )}
      
      {/* PrizeModal, Marquee etc... (Abaixo do footer como antes) */}
      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; } `}</style>
    </div>
  );
}
