"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Volume2, VolumeX, ShoppingCart, X, Copy, CheckCircle2, Gift, Sparkles, Loader2, Zap, LayoutGrid, Coins, DollarSign, CheckCircle, PackageCheck, Image, Video, Award, Trophy, MessageCircle, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { RouletteWheel } from "@/components/RouletteWheel";
import { PrizeModal } from "@/components/PrizeModal";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const SPIN_DURATION = 5000; 

export default function TelegramMiniApp() {
  const params = useParams();
  const slug = params.slug;

  const [tgUser, setTgUser] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modelName, setModelName] = useState("");

  const [player, setPlayer] = useState<any | null>(null);
  
  const [showDeposit, setShowDeposit] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false); 
  const [copied, setCopied] = useState(false);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); 

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [superMsg, setSuperMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [clickCount, setClickCount] = useState(0);

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          setTgUser(user);
          initializeData(user);
        } else {
          setErrorMsg("Abra este link pelo botão do Bot no Telegram!");
          setLoading(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      spinAudioRef.current = new Audio("/sounds/spin.mp3");
      winAudioRef.current = new Audio("/sounds/gemido.mp3");
    }
  }, [slug]);

  async function initializeData(user: any) {
    if (!slug || !supabaseUrl) return;

    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers }).catch(() => null);
      if (!resMod || !resMod.ok) throw new Error("Musa não encontrada.");
      
      const dataMod = await resMod.json();
      const mId = dataMod[0]?.id;
      if (!mId) throw new Error("Musa não encontrada.");

      let prizesRes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*&order=created_at.asc`, { headers }).catch(() => null);
      if (!prizesRes || !prizesRes.ok) prizesRes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mId}&select=*`, { headers }).catch(() => null);
      const prizesData = prizesRes && prizesRes.ok ? await prizesRes.json() : [];

      const resConfig = await fetch(`${supabaseUrl}/rest/v1/Configs?model_id=eq.${mId}&select=*`, { headers }).then(r => r.json()).catch(() => []);
      
      const fetchedPrizes = Array.isArray(prizesData) ? prizesData : [];
      fetchedPrizes.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
          const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
          return dateA - dateB;
      });
      setPrizes(fetchedPrizes);
      
      if (resConfig?.[0]) {
        setBgUrl(resConfig[0].bg_url || "");
        setModelName(resConfig[0].model_name || slug.toString().toUpperCase());
        setModel({ id: mId, ...resConfig[0] });
      }

      const pseudoWhatsapp = user.id.toString();
      const resPlayer = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${pseudoWhatsapp}&model_id=eq.${mId}&select=*`, { headers });
      let playerData = await resPlayer.json();

      if (!playerData || playerData.length === 0) {
        const newPlayerPayload = {
          whatsapp: pseudoWhatsapp,
          name: user.first_name || "Visitante TG", 
          nickname: user.first_name || "VIP",
          full_name: `${user.first_name} ${user.last_name || ''}`.trim() || "Usuário Telegram",
          email: `${user.id}@tg.labzsexy.com`, 
          password: `${user.id}TgAuth!`,
          credits: 3, 
          model_id: mId
        };

        const createRes = await fetch(`${supabaseUrl}/rest/v1/Players`, { 
            method: "POST", 
            headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" }, 
            body: JSON.stringify(newPlayerPayload) 
        });
        
        const createdData = await createRes.json();
        
        if (createdData && Array.isArray(createdData) && createdData.length > 0) {
            playerData = createdData;
        } else {
            console.error("Erro banco de dados:", createdData);
            throw new Error("Erro Crítico: O banco rejeitou a criação do jogador. Avise o Dev.");
        }
      }
      
      setPlayer(playerData[0]);

    } catch (e: any) {
      setErrorMsg(e.message || "Erro de conexão com o Labz.");
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => {
    let interval: any;
    if (pixData && !pixPaid && player) {
      interval = setInterval(async () => {
        try {
            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
            const res = await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}&select=credits`, { headers }).catch(() => null);
            if (!res || !res.ok) return; 
            const data = await res.json();
            if (data[0]?.credits > player.credits) {
              setPixPaid(true);
              setPlayer({ ...player, credits: data[0].credits });
              if (activeCartId) {
                fetch(`${supabaseUrl}/rest/v1/AbandonedCarts?id=eq.${activeCartId}`, {
                  method: 'PATCH',
                  headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'pago' })
                }).catch(() => null);
              }
              clearInterval(interval);
            }
        } catch(err) {}
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid, player, activeCartId]);

  useEffect(() => {
    let timer: any;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleGeneratePix = async (val: number) => {
    if (!player) {
        if ((window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.showAlert("Erro: Identificação perdida. Feche a roleta e abra de novo.");
        } else {
            alert("Erro: Identificação perdida. Feche a roleta e abra de novo.");
        }
        return;
    }
    
    setPixLoading(true);
    setPixData(null);
    setPixPaid(false);
    setActiveCartId(null);
    setPixTimeLeft(600); 
    
    try {
      const resCart = await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
        method: 'POST',
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
          player_name: player.nickname || player.full_name || "Cliente TG",
          player_phone: player.whatsapp,
          model_name: modelName || slug,
          amount: val,
          status: 'pendente'
        })
      });
      if (resCart.ok) {
        const cartData = await resCart.json();
        if (cartData && cartData[0]) setActiveCartId(cartData[0].id);
      }
    } catch (e) { console.error("Erro carrinho:", e); }

    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, userId: player.id }),
      });
      if(!res.ok) throw new Error("Erro API Pix");
      const data = await res.json();
      if (data.qr_code_base64) { 
          setPixData(data); 
      }
    } catch (e) {
        if ((window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.showAlert("Falha de conexão com o banco. Tente novamente.");
        } else {
            alert("Falha ao gerar o PIX. Tente novamente.");
        }
    } finally { setPixLoading(false); }
  };

  const addDevCredits = async () => {
      if (!player) return;
      const newTokens = player.credits + 50;
      setPlayer({ ...player, credits: newTokens });
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, {
         method: "PATCH", 
         headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" }, 
         body: JSON.stringify({ credits: newTokens })
      });
      if ((window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.showAlert("🤖 MODO DEV: 50 Giros adicionados com sucesso!");
      } else {
          alert("MODO DEV ATIVADO! 50 Giros adicionados.");
      }
  };

  const handleDevHack = () => {
      setClickCount((prev) => {
          const next = prev + 1;
          if (next >= 5) {
              addDevCredits();
              return 0; 
          }
          return next;
      });
      
      setTimeout(() => {
          setClickCount(0);
      }, 2000);
  };

  const runSpin = async (cost: number = 3) => {
    if (isSpinning || prizes.length === 0 || !player) return;
    
    if (player.credits < cost) { 
        setShowDeposit(true); 
        return; 
    }

    setIsSpinning(true);
    if (soundEnabled) spinAudioRef.current?.play().catch(() => {});
    if (cost === 6) setSuperMsg("🔥 Isso amor! Com o Super Giro suas chances são GIGANTES! Vem ganhar... 🍀💖");

    const validOptions: any[] = [];
    let totalWeight = 0;
    prizes.forEach((p, i) => {
        const n = String(p.name).toUpperCase();
        if (!n.includes("PIX") && !n.includes("PRESENCIAL") && !n.includes("100") && !n.includes("R$")) {
            const w = parseFloat(p.weight) || 1;
            validOptions.push({ index: i, weight: w });
            totalWeight += w;
        }
    });

    let targetIndex = 0;
    if (validOptions.length > 0) {
        let random = Math.random() * totalWeight;
        for (let opt of validOptions) {
            if (random < opt.weight) { targetIndex = opt.index; break; }
            random -= opt.weight;
        }
    }

    const newBal = player.credits - cost;
    setPlayer({ ...player, credits: newBal });

    const sliceAngle = 360 / prizes.length;
    const stopAngle = (360 - (targetIndex * sliceAngle)) % 360;
    const currentSpins = Math.floor(rotation / 360);
    const finalRotation = ((currentSpins + 10) * 360) + stopAngle;

    setRotation(finalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      setSuperMsg("");
      const won = prizes[targetIndex];
      setSelectedPrize(won);
      setModalOpen(true);
      
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", 'Prefer': 'return=representation' };
      await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${player.id}`, { method: "PATCH", headers, body: JSON.stringify({ credits: newBal }) });

      if (soundEnabled) winAudioRef.current?.play().catch(() => {});
      
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });

      try {
          if(!String(won.name).toUpperCase().includes("TENTE")) {
              await fetch("/api/tg-send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      telegramId: tgUser.id,
                      prizeName: won.name,
                      deliveryValue: won.delivery_value || `Chame a musa e fale: Ganhei o ${won.name}`,
                      modelName: modelName || slug,
                      modelSlug: slug
                  })
              });
              
              setTimeout(() => {
                if ((window as any).Telegram?.WebApp) {
                    (window as any).Telegram.WebApp.showAlert(`🎉 O prêmio "${won.name}" foi enviado para o seu chat privado com o Bot!`);
                }
              }, 1500);
          }
      } catch (e) {
          console.error("Erro ao entregar prêmio no TG");
      }

    }, SPIN_DURATION);
  };

  if (loading) return <div className="h-[100dvh] w-full bg-black flex items-center justify-center text-[#D946EF] font-black uppercase text-[10px] animate-pulse">Carregando Telegram App...</div>;
  if (errorMsg) return <div className="h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center"><AlertCircle size={40} className="text-red-500 mb-4"/><p className="font-bold text-sm">{errorMsg}</p></div>;

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0a] flex items-start justify-center font-sans overflow-hidden">
      {/* 🔥 ALTERAÇÃO DE LAYOUT AQUI: Libera o scroll (overflow-y-auto) se a tela for pequena 🔥 */}
      <div className="relative w-full h-full max-w-md bg-black flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar pb-6">
        
        <div className="absolute inset-0 z-0 h-[100vh] fixed">
           <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 blur-[2px]" style={{ backgroundImage: `url(${bgUrl})`, opacity: 0.4 }} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 flex flex-col min-h-full">
          <div className="p-4 flex flex-col gap-3 shrink-0">
             <div className="flex justify-between items-center px-1">
                <button onClick={() => setShowDeposit(true)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 flex items-center gap-1.5 shadow-lg"><ShoppingCart size={12} /> Recarregar</button>
                <div className="flex gap-2">
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-[#FFD700] active:scale-90 transition-all shadow-lg">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
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

          <div className="flex-1 flex flex-col items-center justify-center px-4 relative mt-4 min-h-[300px]">
             {superMsg && (
                 <div className="absolute top-0 left-4 right-4 z-[60] bg-gradient-to-r from-[#FFD700]/20 via-[#D946EF]/30 to-[#FFD700]/20 border border-[#FFD700]/50 backdrop-blur-md p-4 rounded-2xl text-center animate-in slide-in-from-top-4 fade-in duration-300 shadow-[0_0_30px_rgba(217,70,239,0.5)]">
                     <p className="text-[11px] font-black text-white italic drop-shadow-md leading-relaxed">{superMsg}</p>
                 </div>
             )}
             <div className={`transition-all duration-700 w-full flex justify-center ${superMsg ? 'scale-105 drop-shadow-[0_0_40px_rgba(255,215,0,0.3)]' : ''}`}>
                <RouletteWheel segments={prizes.map(p => ({ label: p.name, color: p.color }))} rotation={rotation} spinning={isSpinning} onClick={() => runSpin(3)} durationMs={SPIN_DURATION} />
             </div>
          </div>

          <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-4 shrink-0 mt-auto">
            <div className="bg-[#111] border border-white/5 p-4 rounded-[1.5rem] flex justify-between items-center mb-4 shadow-2xl relative">
               <div className="flex flex-col pl-2 z-10 cursor-pointer select-none" onClick={handleDevHack}>
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-widest pointer-events-none">Seu Saldo Restante</span>
                  <span className="text-xl font-black text-white italic tracking-tighter pointer-events-none">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
               </div>
               <button onClick={() => setShowDeposit(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-[#D946EF] z-10 flex items-center gap-1.5 shadow-lg"><ShoppingCart size={14}/> Comprar</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => runSpin(3)} disabled={isSpinning} className="bg-[#D946EF] h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 shadow-lg transition-all"><span className="text-xs font-black uppercase italic">Giro Normal</span><span className="text-[9px] font-bold text-white/60">3 CR</span></button>
              <button onClick={() => runSpin(6)} disabled={isSpinning} className="bg-[#FFD700] h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 text-black shadow-lg transition-all"><span className="text-xs font-black uppercase italic flex items-center gap-1"><Zap size={14}/> Super Giro</span><span className="text-[9px] font-bold text-black/60">6 CR</span></button>
            </div>
            <p className="text-[8px] text-center text-white/30 uppercase tracking-widest font-black">Prêmios são entregues no Chat Deste Bot.</p>
          </div>
        </div>
      </div>

      {showDeposit && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl my-auto">
            <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X size={24} /></button>
            
            {pixPaid ? (
               <div className="py-10 text-center animate-in zoom-in">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 animate-bounce"><CheckCircle className="text-emerald-500" size={40} /></div>
                  <h2 className="text-2xl font-black text-white uppercase italic mb-2">Aprovado!</h2>
                  <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">Seus créditos já caíram na conta.</p>
                  <button onClick={() => { setShowDeposit(false); setPixData(null); setPixPaid(false); }} className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Voltar para a Roleta</button>
               </div>
            ) : pixLoading ? (
              <div className="py-20 flex flex-col justify-center items-center text-[#D946EF] font-black text-xs animate-pulse uppercase"><Loader2 className="animate-spin mb-2" /> Gerando Pix...</div>
            ) : pixData ? (
              <div className="mt-4 text-center">
                 <h2 className="text-xl font-black text-white uppercase italic mb-6">Pague com PIX</h2>
                 <div className="bg-white p-4 rounded-3xl inline-block mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]"><img src={pixData.qr_code_base64} alt="QR" className="w-48 h-48" /></div>
                 <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-xl animate-pulse">⏱ {formatTime(pixTimeLeft)}</div>
                 <div className="text-left bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
                    <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Pague o Pix Cópia e Cola.<br/>2. O saldo cai na hora aqui no Telegram!</p>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                 </button>
                 <p className="mt-4 text-[8px] text-white/30 uppercase font-black animate-pulse">Aguardando confirmação...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-black text-white uppercase italic text-center mb-6">Recarregar <span className="text-[#D946EF]">{modelName}</span></h2>
                {[ { rs: 20, cr: 25 }, { rs: 30, cr: 35 }, { rs: 40, cr: 45 }, { rs: 50, cr: 55 } ].map((p) => (
                  <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-5 bg-[#141414] border border-white/5 rounded-2xl hover:border-[#D946EF]/50 relative transition-all active:scale-95 group shadow-inner">
                    <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[7px] font-black px-2 py-0.5 rounded-bl-lg">+5 BÔNUS</div>
                    <div className="text-left"><span className="block text-sm font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/40 font-bold uppercase font-mono tracking-tighter">R$ {p.rs},00</span></div>
                    <div className="bg-[#D946EF] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase shadow-md">Comprar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <PrizeModal open={modalOpen} prize={selectedPrize} playerName={player?.nickname || "Fã VIP"} modelName={modelName} onClose={() => setModalOpen(false)} />
      
      <style jsx global>{` 
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } 
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; } 
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
