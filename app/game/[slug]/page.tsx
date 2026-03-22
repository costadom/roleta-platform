"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, ArrowLeft, LayoutGrid, Coins, DollarSign, CheckCircle } from "lucide-react";
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
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
        const dataMod = await resMod.json();
        const mId = dataMod[0]?.id;
        if (!mId) return;

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
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchData();
    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

  useEffect(() => {
    async function checkAccess() {
      const isLoggedIn = localStorage.getItem("labz_player_logged");
      const savedWhatsapp = localStorage.getItem("labz_player_phone");

      if (isLoggedIn === "true" && savedWhatsapp) {
        try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
          const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
          const mId = (await resMod.json())[0]?.id;

          const resAll = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${savedWhatsapp}&select=*,Models(slug)`, { headers });
          const dataAll = await resAll.json();
          setAllAssociations(dataAll);

          const currentPlayer = dataAll.find((p: any) => p.model_id === mId);
          if (currentPlayer && currentPlayer.full_name && currentPlayer.nickname) {
            setPlayer(currentPlayer);
            setIsAuthorized(true);
            setShowAuthModal(false);
          } else {
            setIsAuthorized(false);
          }
        } catch (e) {}
      }
    }
    if (prizes.length > 0) checkAccess();
  }, [slug, prizes]);

  // Monitoramento de pagamento aprovado
  useEffect(() => {
    let interval: any;
    if (pixData && !pixPaid && player) {
      interval = setInterval(async () => {
        try {
            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
            const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers });
            const data = await res.json();
            if (data[0]?.credits > player.credits) {
              setPixPaid(true);
              setPlayer({ ...player, credits: data[0].credits });
              clearInterval(interval);
            }
        } catch(err) { console.error(err); }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid, player]);

  const handleGeneratePix = async (val: number) => {
    if (!player) return;
    setPixLoading(true);
    setPixData(null);
    setPixPaid(false);
    
    // 🔥 ENVIANDO O CARRINHO ABANDONADO PARA O SUPABASE
    console.log("🕵️ [ESPIÃO] Salvando Carrinho Abandonado no Banco...");
    try {
      const cartPayload = {
        player_name: player.full_name || player.nickname || "Cliente",
        player_phone: player.whatsapp,
        model_name: modelName || slug,
        amount: val,
        status: 'pendente'
      };
      
      const resCart = await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
        method: 'POST',
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(cartPayload)
      });
      
      if (!resCart.ok) {
         console.error("🕵️ [ESPIÃO] Falha ao salvar carrinho!", await resCart.text());
      } else {
         console.log("🕵️ [ESPIÃO] Carrinho Salvo com Sucesso!");
      }
    } catch (e) { 
      console.error("🕵️ [ESPIÃO] Erro de conexão ao salvar carrinho:", e); 
    }

    // Gerando o PIX
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, userId: player.id }),
      });
      const data = await res.json();
      if (data.qr_code_base64) { setPixData(data); }
    } catch (e) {
        console.error("Erro Pix:", e);
    } finally { setPixLoading(false); }
  };

  const runSpin = async () => {
    if (!isAuthorized) { setShowAuthModal(true); return; }
    if (isSpinning || prizes.length === 0) return;
    if ((player?.credits || 0) < 3) { setShowDeposit(true); return; }

    setIsSpinning(true);
    spinAudioRef.current?.play().catch(() => {});
    const index = Math.floor(Math.random() * prizes.length); 
    setRotation(prev => prev + 3600 + (360 - (index * (360/prizes.length))));

    setTimeout(async () => {
      setIsSpinning(false); setSelectedPrize(prizes[index]); setModalOpen(true);
      const newBal = (player?.credits || 0) - 3;
      setPlayer({ ...player, credits: newBal });
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "PATCH", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ credits: newBal }) });
      winAudioRef.current?.play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }, SPIN_DURATION + 100);
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-black uppercase text-[10px] tracking-widest animate-pulse">Carregando...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 shadow-2xl overflow-hidden">
        
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${bgUrl})`, opacity: isAuthorized ? 0.45 : 0.25 }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="p-4 flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center px-1">
                <button onClick={() => router.push('/vitrine')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all"><LayoutGrid size={12} /> Vitrine</button>
                <div className="flex gap-2">
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
                   <button onClick={() => isAuthorized ? setShowProfile(true) : setShowAuthModal(true)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><User size={18}/></button>
                </div>
             </div>
             <div className="flex flex-col items-center"><span className="text-[#D946EF] font-black italic text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span><span className="text-[10px] text-[#FFD700] font-black uppercase mt-0.5 tracking-widest italic">Musa {modelName}</span></div>
          </div>

          <div className="w-full h-9 bg-black/60 border-y border-white/5 backdrop-blur-sm overflow-hidden flex items-center relative shrink-0">
            <div className="flex whitespace-nowrap animate-marquee">
              { NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter"><Sparkles size={11} className="text-[#FFD700]" /><span className="text-white/60">{name}</span><span className="text-white">GANHOU</span><span className="text-[#D946EF]">PRÊMIO VIP</span></div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
             <div className={`transition-all duration-700 w-full flex justify-center ${!isAuthorized ? 'blur-[3px] opacity-40 grayscale-[0.4]' : ''}`}>
                <RouletteWheel segments={prizes.map(p => ({ label: p.name, color: p.color }))} rotation={rotation} spinning={isSpinning} onClick={() => runSpin()} />
             </div>
             {!isAuthorized && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
                    <h3 className="text-white font-black uppercase italic text-lg mb-2 tracking-tighter">Área Vip: {modelName}</h3>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-6">Cadastre-se para ver os prêmios e jogar</p>
                    <button onClick={() => setShowAuthModal(true)} className="bg-[#D946EF] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-95 transition-all">Começar Agora</button>
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-4 shrink-0">
            <div className="bg-[#111] border border-white/5 p-4 rounded-[1.5rem] flex justify-between items-center mb-4 shadow-2xl relative">
               <div className="flex flex-col pl-2 z-10"><span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Seu Saldo em {modelName}</span><span className="text-xl font-black text-white italic tracking-tighter">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span></div>
               <button onClick={() => isAuthorized ? setShowDeposit(true) : setShowAuthModal(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-[#D946EF] z-10 flex items-center gap-1.5"><ShoppingCart size={14}/> Depositar</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => runSpin()} disabled={isSpinning} className="bg-[#D946EF] h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 shadow-lg transition-all"><span className="text-xs font-black uppercase italic">Giro Normal</span><span className="text-[9px] font-bold text-white/60">3 CR</span></button>
              <button onClick={() => runSpin()} disabled={isSpinning} className="bg-[#FFD700] h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 text-black shadow-lg transition-all"><span className="text-xs font-black uppercase italic flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[9px] font-bold text-black/60">6 CR</span></button>
            </div>
          </div>
        </div>

        {showAuthModal && <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />}
      </div>

      {showProfile && player && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative text-center shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-[210]"><X size={24} /></button>
            <div className="w-20 h-20 bg-[#D946EF]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><User size={40} className="text-[#D946EF]"/></div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{player.nickname}</h2>
            <div className="mt-8 text-left space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
               <h3 className="text-[10px] text-white/40 uppercase font-black mb-1 flex items-center gap-2 tracking-widest"><Coins size={12} className="text-[#FFD700]"/> Seus Saldos</h3>
                  {allAssociations.map((assoc: any) => (
                    <div key={assoc.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-[#D946EF]/30 transition-all">
                       <span className="text-[11px] font-black uppercase text-white/80">{assoc.Models?.slug}</span>
                       <span className="text-xs font-black text-[#D946EF]">{assoc.credits} CR</span>
                    </div>
                  ))}
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-white/20 text-[10px] font-black uppercase hover:text-red-500 transition-colors">Sair da Conta</button>
          </div>
        </div>
      )}

      {showDeposit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-[310]"><X size={24} /></button>
            
            {pixPaid ? (
               <div className="py-10 text-center animate-in zoom-in">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 animate-bounce">
                    <CheckCircle className="text-emerald-500" size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic mb-2">Aprovado!</h2>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">Seus créditos já caíram na conta.</p>
                  <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Voltar para a Roleta</button>
               </div>
            ) : pixLoading ? (
              <div className="py-20 flex flex-col justify-center items-center text-[#D946EF] font-black text-xs animate-pulse uppercase"><Loader2 className="animate-spin mb-2" /> Gerando Pix...</div>
            ) : pixData ? (
              <div className="mt-4 text-center">
                 <h2 className="text-xl font-black text-white uppercase italic mb-6">Pague com PIX</h2>
                 <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]"><img src={pixData.qr_code_base64} alt="QR" className="w-48 h-48" /></div>
                 
                 <div className="text-left bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                    <p className="text-[9px] text-[#D946EF] font-black uppercase mb-2">Instruções:</p>
                    <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Abra o app do seu banco.<br/>2. Escolha "Pagar com QR Code".<br/>3. Escaneie a imagem acima.<br/>4. O saldo cai automaticamente!</p>
                 </div>

                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                 </button>
                 <p className="mt-4 text-[8px] text-white/30 uppercase font-black animate-pulse">Aguardando confirmação do banco...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-black text-white uppercase italic text-center mb-6">Recarregar <span className="text-[#D946EF]">{modelName}</span></h2>
                {[ 
                  { rs: 20, cr: 25 }, 
                  { rs: 30, cr: 35 }, 
                  { rs: 40, cr: 45 }, 
                  { rs: 50, cr: 55 } 
                ].map((p) => (
                  <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-[#D946EF]/50 relative transition-all active:scale-95 group shadow-inner">
                    <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+{p.bonus} BÔNUS</div>
                    <div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-tighter">R$ {p.rs},00</span></div>
                    <div className="bg-[#D946EF] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase shadow-lg group-hover:shadow-[#D946EF]/20">Comprar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.nickname || ""} modelName={modelName} onClose={() => setModalOpen(false)} />
      <style jsx global>{` @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; }`}</style>
    </div>
  );
}
