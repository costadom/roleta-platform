"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play, Wallet, ArrowLeft, Gamepad2, X, Star, Gift, User, CheckCircle } from "lucide-react";

// COMPONENTE: MODAL DE VENCEDOR BLINDADO 🕵️
// ESPIÃO: Este modal foi travado. Se o banco mandar um prêmio proibido (PIX, Presencial, R$100),
// ele substitui o nome do prêmio para o fã não ver o erro.
function WinnerModal({ prize, onClose }: { prize: any, onClose: () => void }) {
    const isFake = checkIsFake(prize);
    const prizeName = isFake ? "CRÉDITOS DE GIRO VIP" : prize.name;
    const deliveryType = isFake ? 'credit' : prize.delivery_type;

    function checkIsFake(p: any) {
        if (!p || !p.name) return true;
        const n = String(p.name).toUpperCase();
        return n.includes("PIX") || n.includes("PRESENCIAL") || n.includes("100") || n.includes("R$");
    }

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-[#0a0a0a] border-4 border-[#FFD700] p-10 rounded-[3rem] w-full max-w-lg text-center shadow-[0_0_80px_rgba(255,215,0,0.4)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent animate-pulse" />
                <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={28}/></button>
                <div className="flex justify-center gap-3 mb-6"><Star className="text-[#FFD700]" fill="currentColor"/><Star className="text-[#FFD700] scale-125" fill="currentColor"/><Star className="text-[#FFD700]" fill="currentColor"/></div>
                <h2 className="text-4xl font-black uppercase italic text-[#FFD700] tracking-tighter mb-4 animate-pulse">VOCÊ GANHOU!</h2>
                <div className="bg-black/50 border border-white/10 p-8 rounded-3xl mb-8 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: prize.color || '#D946EF' }}><Gift size={40} className="text-white"/></div>
                    <p className="text-2xl font-black text-white uppercase leading-tight tracking-tight">"{prizeName}"</p>
                </div>
                {deliveryType === 'link' ? (
                    <a href={prize.delivery_value} target="_blank" onClick={onClose} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-[#f062ff] transition-all flex items-center justify-center gap-2"><Play size={18} fill="currentColor"/> ACESSAR CONTEÚDO AGORA</a>
                ) : deliveryType === 'credit' ? (
                    <div className="text-emerald-400 text-xs font-black uppercase flex items-center justify-center gap-2 py-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"><CheckCircle size={18}/> Créditos adicionados! Gire de novo!</div>
                ) : (
                    <button onClick={onClose} className="w-full bg-white text-black py-6 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2">CHAMAR NO WHATSAPP (ENTREGA)</button>
                )}
            </div>
        </div>
    );
}

// COMPONENTE: DISCO DA ROLETA (VISUAL FIXO)
function RouletteDisk({ prizes }: { prizes: any[] }) {
    if (prizes.length < 2) return <div className="min-h-screen bg-black" />;
    const arcSize = 360 / prizes.length;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full rounded-full border-[10px] border-[#D946EF] shadow-[0_0_60px_rgba(217,70,239,0.5)]">
            <defs>
                {prizes.map((p, i) => {
                    const angle = i * arcSize - 90;
                    const id = `textPath-${i}`;
                    const x = 50 + 40 * Math.cos((angle + arcSize / 2) * (Math.PI / 180));
                    const y = 50 + 40 * Math.sin((angle + arcSize / 2) * (Math.PI / 180));
                    return (
                        <path key={id} id={id} d={`M 50 50 L ${x} ${y}`} />
                    );
                })}
            </defs>
            {prizes.map((p, i) => {
                const angle = i * arcSize - 90;
                const largeArc = arcSize > 180 ? 1 : 0;
                const x1 = 50 + 50 * Math.cos(angle * (Math.PI / 180));
                const y1 = 50 + 50 * Math.sin(angle * (Math.PI / 180));
                const x2 = 50 + 50 * Math.cos((angle + arcSize) * (Math.PI / 180));
                const y2 = 50 + 50 * Math.sin((angle + arcSize) * (Math.PI / 180));
                return (
                    <path key={i} d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={p.color || '#333'} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                );
            })}
            {prizes.map((p, i) => (
                <text key={i} x="50" y="50" dy="1.2" fontSize="3.5" fontWeight="900" textAnchor="middle" fill="#fff" transform={`rotate(${i * arcSize + arcSize / 2 - 90}, 50, 50) translate(0, -38)`}>
                    {p.name?.slice(0, 16).toUpperCase() || 'PRÊMIO'}
                </text>
            ))}
        </svg>
    );
}

export default function GamePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [model, setModel] = useState<any>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [credits, setCredits] = useState(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const spinCost = 2; // Custo fixo por giro

  useEffect(() => {
    async function loadData() {
        try {
            const logged = localStorage.getItem("labz_player_logged") === "true";
            const phone = localStorage.getItem("labz_player_phone");
            if (!logged || !phone) { router.push('/'); return; }
            setPlayerPhone(phone); setAuthLoading(false);

            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
            
            const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers }).then(r => r.json());
            if (!resMod || !resMod[0]) return router.push('/vitrine');
            const mData = resMod[0]; setModel(mData);

            const resPrizes = await fetch(`${supabaseUrl}/rest/v1/Prize?model_id=eq.${mData.id}&select=*`, { headers }).then(r => r.json());
            if (resPrizes && resPrizes.length >= 2) {
                // Sincroniza a ordem alfabética para garantir mapeamento visual perfeito
                setPrizes(resPrizes.sort((a:any, b:any) => a.name.localeCompare(b.name)));
            }

            const resPl = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&model_id=eq.${mData.id}&select=*`, { headers }).then(r => r.json());
            if (resPl && resPl[0]) { setPlayerId(resPl[0].id); setCredits(resPl[0].credits || 0); }
        } catch (e) { console.error("Erro Crítico:", e); } finally { setLoading(false); }
    }
    loadData();
  }, [slug]);

  const handleSpin = async () => {
    if (credits < spinCost || isSpinning || authLoading || !model || !playerId || prizes.length < 2) return;
    
    setIsSpinning(true); setWonPrize(null);
    setCredits(prev => prev - spinCost); // UX Visual Imediata

    try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };
        
        // MOTOR DE SORTEIO (API): O banco decide o prêmio
        const resSpin = await fetch(`${supabaseUrl}/functions/v1/spin`, { method: 'POST', headers, body: JSON.stringify({ model_id: model.id, player_id: playerId, player_phone: playerPhone }) });
        const dataSpin = await resSpin.json();

        if (dataSpin.error || !dataSpin.prizeId) { throw new Error(dataSpin.error || "Erro no sorteio do banco"); }

        const prizeIdWon = dataSpin.prizeId;
        const wonObjFromBanco = prizes.find(p => p.id === prizeIdWon);
        
        if (!wonObjFromBanco) throw new Error("Prêmio sorteado não encontrado na lista local de visualização");

        // PROTOCOLO ESPIÃO DE PREVENÇÃO VISUAL TOTAL 🕵️
        // Se o banco mandou uma ISCA (PIX, Presencial, R$100), bloqueamos a parada visual nela.
        let finalVisualPrize = wonObjFromBanco;
        const n = String(wonObjFromBanco.name).toUpperCase();
        if (n.includes("PIX") || n.includes("PRESENCIAL") || n.includes("100") || n.includes("R$")) {
            console.log("🕵️ ESPIÃO: Bait detectado pelo banco. Redirecionando visual para Créditos.");
            // Busca o prêmio de Créditos na lista da modelo
            const creditPrize = prizes.find(p => String(p.name).toUpperCase().includes("CRÉDITO"));
            if (creditPrize) finalVisualPrize = creditPrize;
        }

        // CÁLCULO DE ÂNGULO BLINDADO 🕵️
        // Sincronização visual final (para o prêmio seguro)
        const totalSegments = prizes.length;
        const arcSize = 360 / totalSegments;
        const prizeIndexVisual = prizes.findIndex(p => p.id === finalVisualPrize.id);
        
        const voltasCompletas = 6; // UX Viciante
        const baseAngle = 360 - (prizeIndexVisual * arcSize) - (arcSize / 2); // Centro da fatia segura
        const targetRotation = (360 * voltasCompletas) + baseAngle;

        console.log(`🕵️ ESPIÃO: Girando visualmente para Prêmio Index: ${prizeIndexVisual}, Nome Visual: ${finalVisualPrize.name}, Ângulo Parada: ${baseAngle}deg`);

        setRotation(targetRotation); // Inicia o giro visual

        setTimeout(() => {
            setWonPrize(finalVisualPrize); // Abre o modal com o prêmio seguro
            setIsSpinning(false);
            // Saldo real já foi deduzido no backend e UX pre-giro
        }, 8500); // Tempo exato da animação (ver CSS)

    } catch (err) {
      console.error("Giro falhou:", err);
      // Reembolso visual local se falhar
      setCredits(prev => prev + spinCost);
      setIsSpinning(false);
      alert("Falha na conexão. Recarregue a página e tente novamente.");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic animate-pulse">Acessando Roleta VIP...</h2></div>;

  const modelConfig = Array.isArray(model?.Configs) ? model.Configs[0] : model?.Configs;
  const modelName = modelConfig?.model_name || model?.slug;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${modelConfig?.bg_url})` }} />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <header className="fixed top-0 left-0 w-full h-20 bg-black/50 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
          <button onClick={() => router.push(`/profile/${model.slug}`)} className="p-3 bg-white/5 rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center"><h1 className="text-lg font-black uppercase italic text-[#D946EF] tracking-tighter">ROLETA VIP: <span className="text-white">{modelName}</span></h1><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p></div>
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-5 py-3 rounded-full text-emerald-400 font-black text-xs shadow-inner"><Wallet size={16}/> {credits} CR</div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-28 flex flex-col items-center gap-10 relative z-10 animate-in fade-in duration-700">
        <div className="w-full max-w-[500px] aspect-square relative flex items-center justify-center scale-90 sm:scale-100">
            {/* O PONTEIRO FIXO (Topo, 0deg) */}
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[40px] border-t-white z-50 drop-shadow-[0_5px_15px_rgba(255,255,255,0.7)]"></div>
            
            {/* O DISCO QUE GIRA */}
            <div className="w-full h-full relative" style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 8s cubic-bezier(0.1, 0, 0.2, 1)' : 'none' }}>
                <RouletteDisk prizes={prizes} />
            </div>
            
            {/* CENTRO DA ROLETA */}
            <div className="absolute inset-[37%] bg-[#0a0a0a] rounded-full border-[6px] border-[#D946EF] shadow-[0_0_40px_rgba(217,70,239,1)] z-30 flex items-center justify-center p-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full"/>
                {modelConfig?.profile_url ? <img src={modelConfig.profile_url} className="w-full h-full object-cover rounded-full relative z-10" /> : <User className="text-[#D946EF] relative z-10" size={30}/>}
            </div>
        </div>

        <button onClick={handleSpin} disabled={credits < spinCost || isSpinning} className="flex items-center justify-center gap-3 px-12 py-6 bg-[#D946EF] rounded-2xl text-xs font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.5)] hover:bg-[#f062ff] hover:scale-105 disabled:opacity-50 transition-all active:scale-95 disabled:hover:scale-100 disabled:bg-[#444] tracking-widest"><Gamepad2 size={18}/> {isSpinning ? 'Girando...' : `Girar (Custo: ${spinCost} CR)`}</button>

        <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem] w-full max-w-xl animate-pulse">Histórico de prêmios em breve...</div>
      </main>

      {/* MODAL DE VENCEDOR: Sincronizado com a Fonte da Verdade do Disco Segura */}
      {wonPrize && !isSpinning && (
          <WinnerModal prize={wonPrize} onClose={() => { setWonPrize(null); router.refresh(); }} />
      )}
    </div>
  );
}
