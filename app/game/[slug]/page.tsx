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
        
        // 1. Dados da Modelo (Fundo e Nome)
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
          if (currentPlayer) {
            setPlayer(currentPlayer);
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false); // Logado global mas não aqui -> Pede associação
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

  const handleGeneratePix = async (val: number) => {
    if (!player) return;
    setPixLoading(true);
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, userId: player.id }),
      });
      const data = await res.json();
      if (data.qr_code_base64) { setPixData(data); setPixTimeLeft(600); }
    } finally { setPixLoading(false); }
  };

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
        
        {/* FUNDO VISÍVEL SEMPRE */}
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})`, opacity: isAuthorized ? 0.4 : 0.25 }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {/* HEADER SUPERIOR */}
          <div className="p-4 flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center px-1">
                <div className="flex gap-2">
                   <button onClick={() => router.push('/vitrine')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all">
                      <LayoutGrid size={12} /> Vitrine
                   </button>
                   <button onClick={() => router.push(`/${slug}`)} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all">
                      <User size={12} /> Perfil
                   </button>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-[#FFD700] active:scale-90">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
                   <button onClick={() => isAuthorized ? setShowProfile(true) : setShowAuthModal(true)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90"><User size={18}/></button>
                </div>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[#D946EF] font-black italic text-xl tracking-tighter">Savanah <span className="text-white">Labz</span></span>
                <span className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest mt-0.5">Musa {modelName}</span>
             </div>
          </div>

          {/* ROLETA COM PRÊMIOS VISÍVEIS */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
             <div className={`transition-all duration-700 w-full flex justify-center ${!isAuthorized ? 'blur-[1px] opacity-40 grayscale-[0.5]' : ''}`}>
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

          {/* FOOTER */}
          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-4 shrink-0">
            <div className="bg-[#111] border border-white/5 p-4 rounded-[1.5rem] flex justify-between items-center mb-4 shadow-2xl">
               <div className="flex flex-col pl-2">
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Saldo para {modelName}</span>
                  <span className="text-xl font-black text-white italic tracking-tighter">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
               </div>
               <button onClick={() => isAuthorized ? setShowDeposit(true) : setShowAuthModal(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-[#D946EF]"><ShoppingCart size={14}/> Depositar</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => runSpin(false)} disabled={isSpinning} className="bg-[#D946EF] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 disabled:opacity-50"><span className="text-xs font-black uppercase italic">Giro Normal</span><span className="text-[9px] font-bold text-white/60">3 CRÉDITOS</span></button>
              <button onClick={() => runSpin(true)} disabled={isSpinning} className="bg-[#FFD700] h-16 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)] active:scale-95 disabled:opacity-50 text-black"><span className="text-xs font-black uppercase italic flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[9px] font-bold text-black/60">6 CRÉDITOS</span></button>
            </div>
          </div>
        </div>

        {/* MODAL DE LOGIN */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 bg-black/40 backdrop-blur-md">
            <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />
          </div>
        )}
      </div>

      {/* PERFIL DO JOGADOR COM MÚLTIPLOS SALDOS */}
      {showProfile && player && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative text-center shadow-2xl animate-in zoom-in">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <div className="w-20 h-20 bg-[#D946EF]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><User size={40} className="text-[#D946EF]"/></div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{player.whatsapp}</h2>
            
            <div className="mt-8 text-left">
               <h3 className="text-[10px] text-white/40 uppercase font-black mb-4 flex items-center gap-2"><Coins size={12} className="text-[#FFD700]"/> Seus Saldos por Modelo</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {allAssociations.map((assoc: any) => (
                    <div key={assoc.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                       <span className="text-[11px] font-black uppercase text-white/80">{assoc.Models?.slug}</span>
                       <span className="text-xs font-black text-[#D946EF]">{assoc.credits} CR</span>
                    </div>
                  ))}
               </div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-white/20 text-[10px] font-black uppercase hover:text-red-500 transition-colors">Sair da Conta</button>
          </div>
        </div>
      )}

      {/* MODAL DE DEPÓSITO */}
      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl animate-in zoom-in">
            <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase text-white italic text-center mb-6">Recarregar <span className="text-[#D946EF]">{modelName}</span></h2>
            {pixLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#D946EF]" /></div> : pixData ? (
              <div className="mt-4 text-center">
                 <div className="bg-white p-4 rounded-3xl inline-block mb-4"><img src={pixData.qr_code_base64} alt="QR" className="w-44 h-44" /></div>
                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">{copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? "Copiado!" : "Copiar Pix"}</button>
              </div>
            ) : (
              <div className="space-y-3">
                {[ { cr: 25, rs: 15, bonus: 5 }, { cr: 45, rs: 30, bonus: 10 }, { cr: 75, rs: 50, bonus: 15 } ].map((p) => (
                  <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-[#D946EF]/50 transition-all relative group">
                    <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+{p.bonus} BÔNUS</div>
                    <div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/40 font-bold uppercase font-mono">R$ {p.rs},00</span></div>
                    <div className="bg-[#D946EF] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase">Pagar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.name || ""} modelName={modelName} onClose={() => setModalOpen(false)} />
    </div>
  );
}
