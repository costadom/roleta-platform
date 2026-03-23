"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X as CloseIcon, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  LayoutGrid, Zap, Trophy, MessageCircle, Star, Home, Heart, Sparkles
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const NAMES = ["Tiago", "Lucas", "Ana", "Felipe", "Mariana", "João", "Beatriz", "Ricardo", "Camila", "Larissa", "Bruno", "Thiago", "Fernanda", "Rafael", "Julia", "Diego", "Amanda", "Gabriel", "Vitor"];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RaspadinhaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [model, setModel] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [modelPhotos, setModelPhotos] = useState<any[]>([]);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // PIX Estados
  const [pixData, setPixData] = useState<any>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [slug]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const phone = localStorage.getItem("labz_player_phone");
      const { data: modelData } = await supabase.from('Models').select('*, Configs(*)').eq('slug', slug).single();
      
      if (!modelData) return;
      setModel(modelData);
      const config = Array.isArray(modelData.Configs) ? modelData.Configs[0] : modelData.Configs;
      setBackgroundUrl(config?.bg_url || "");
      setModelName(config?.model_name || slug);

      const { data: photos } = await supabase.from('ModelScratchPhotos').select('*').eq('model_id', modelData.id).eq('active', true);
      setModelPhotos(photos || []);

      if (phone) {
        const { data: playerData } = await supabase.from('Players').select('*').eq('whatsapp', phone).eq('model_id', modelData.id).single();
        if (playerData) {
          setPlayer(playerData);
          const { data: history } = await supabase.from('ScratchHistory').select('*').eq('player_id', playerData.id);
          setUnlockedPhotos(history || []);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // 🔥 MOTOR SÊNIOR: Lógica de raspada com probabilidade de perda 🔥
  const handlePlay = async (bundleSize: number = 1) => {
    if (!player) return;
    const cost = bundleSize === 10 ? 14 : bundleSize === 5 ? 8 : 2;
    if (player.credits < cost) return setShowDeposit(true);

    setIsProcessing(true);
    
    // Win Rate: 1x (35%), 5x (55%), 10x (70%)
    const winThreshold = bundleSize === 10 ? 0.30 : bundleSize === 5 ? 0.45 : 0.65;
    let currentCredits = player.credits - cost;
    let newUnlocks: any[] = [];

    // Busca apenas fotos que o cliente NÃO TEM AINDA
    const availablePhotos = modelPhotos.filter(mp => !unlockedPhotos.find(up => up.photo_url === mp.photo_url));

    for (let i = 0; i < bundleSize; i++) {
        if (Math.random() > winThreshold && availablePhotos.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePhotos.length);
            const wonPhoto = availablePhotos.splice(randomIndex, 1)[0];
            newUnlocks.push({
                player_id: player.id,
                model_id: model.id,
                photo_url: wonPhoto.photo_url
            });
        }
    }

    if (newUnlocks.length > 0) {
        await supabase.from('ScratchHistory').insert(newUnlocks);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 999 });
    }

    await supabase.from('Players').update({ credits: currentCredits }).eq('id', player.id);
    setPlayer({...player, credits: currentCredits});
    
    setTimeout(() => {
        setIsProcessing(false);
        fetchInitialData();
        if (newUnlocks.length === 0) alert("Poxa amor, veio o X! Tente de novo, minha foto está quase saindo... 🔥");
    }, 1800);
  };

  // Monitor Pix
  useEffect(() => {
    let interval: any;
    if (pixData && !pixPaid) {
      interval = setInterval(async () => {
        const { data } = await supabase.from('Players').select('credits').eq('id', player.id).single();
        if (data && data.credits > player.credits) {
          setPixPaid(true);
          setPlayer({ ...player, credits: data.credits });
          clearInterval(interval);
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, pixPaid]);

  useEffect(() => {
    let timer: any;
    if (pixData && !pixPaid && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixPaid, pixTimeLeft]);

  const handleGeneratePix = async (amount: number) => {
    setPixLoading(true);
    try {
      const res = await fetch('/api/checkout/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: player.id }),
      });
      const data = await res.json();
      setPixData(data);
      setPixTimeLeft(600);
    } catch (e) { alert("Erro ao gerar Pix"); } finally { setPixLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-[10px] animate-pulse">Carregando Raspadinha...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 shadow-2xl overflow-hidden">
        
        {/* Background Estilo Roleta */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-all duration-1000" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        {/* Header Premium (Mesmo da Roleta) */}
        <div className="relative z-10 p-4 flex flex-col gap-3 shrink-0">
           <div className="flex justify-between items-center px-1">
              <button onClick={() => router.push(`/${slug}`)} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-white/70 hover:text-white transition-all"><ArrowLeft size={12} /> Vitrine</button>
              <div className="flex gap-2">
                 <button onClick={() => setShowProfile(true)} className="w-9 h-9 bg-black/40 border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><User size={18}/></button>
              </div>
           </div>
           <div className="flex flex-col items-center">
              <span className="text-[#D946EF] font-black italic text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
              <span className="text-[10px] text-[#FFD700] font-black uppercase mt-0.5 tracking-widest italic flex items-center gap-1"><Sparkles size={10} fill="currentColor"/> Raspadinha {modelName}</span>
           </div>
        </div>

        {/* Marquee de Ganhadores (Igual da Roleta) */}
        <div className="w-full h-9 bg-black/60 border-y border-white/5 backdrop-blur-sm overflow-hidden flex items-center relative shrink-0">
          <div className="flex whitespace-nowrap animate-marquee">
            { NAMES.map((name, i) => (
              <div key={i} className="flex items-center gap-2 mx-8 text-[10px] font-black uppercase tracking-tighter"><Star size={11} className="text-[#FFD700]" fill="currentColor"/><span className="text-white/60">{name}</span><span className="text-white">CONQUISTOU</span><span className="text-[#D946EF]">FOTO RARA</span></div>
            ))}
          </div>
        </div>

        {/* Área do Jogo (Raspadinha no Lugar da Roleta) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full aspect-[4/5] bg-[#0a0a0a]/80 backdrop-blur-md border-2 border-[#D946EF]/30 rounded-[3rem] p-5 shadow-[0_0_60px_rgba(217,70,239,0.2)] relative overflow-hidden group">
             <div className="w-full h-full border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-black relative">
                <ImageIcon size={60} className="text-[#D946EF]/20 mb-4 animate-pulse" />
                <h3 className="text-white font-black uppercase italic text-lg tracking-tighter">Raspadinha VIP</h3>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 text-center px-8">Revele as 10 fotos secretas de {modelName}</p>
             </div>
             
             {isProcessing && (
               <div className="absolute inset-0 bg-black/90 backdrop-blur-lg z-30 flex flex-col items-center justify-center text-center">
                  <Loader2 className="animate-spin text-[#D946EF] mb-2" size={40} />
                  <p className="text-white font-black uppercase text-[10px] tracking-widest">REVELANDO...</p>
               </div>
             )}
          </div>

          {/* Saldo e Progresso */}
          <div className="mt-8 flex flex-col items-center gap-3 w-full">
             <div className="px-6 py-2.5 bg-[#111] border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
                <Coins size={16} className="text-[#FFD700]" />
                <span className="text-lg font-black italic text-white">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
             </div>
             <div className="flex flex-col items-center gap-1.5">
                <div className="h-1.5 w-40 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Sua Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
             </div>
          </div>
        </div>

        {/* Footer (Botões de Compra Padrão Roleta) */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black/95 to-transparent shrink-0">
          <div className="grid grid-cols-2 gap-3 mb-3">
             <button onClick={() => handlePlay(1)} disabled={isProcessing} className="bg-white/5 border border-white/10 h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all">
                <span className="text-[9px] font-black uppercase text-white/40">1 Raspada</span>
                <span className="text-sm font-black text-white">2 CR</span>
             </button>
             <button onClick={() => handlePlay(5)} disabled={isProcessing} className="bg-white/5 border border-[#D946EF]/40 h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg">ECONOMIZE 20%</div>
                <span className="text-[9px] font-black uppercase text-white/40">Pack 5x</span>
                <span className="text-sm font-black text-[#D946EF]">8 CR</span>
             </button>
          </div>

          <button onClick={() => handlePlay(10)} disabled={isProcessing} className="w-full py-5 bg-[#FFD700] text-black rounded-2xl font-black uppercase text-xs flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(255,215,0,0.2)] active:scale-95 transition-all mb-4">
             <span className="flex items-center gap-2 font-black italic"><Zap size={14} fill="currentColor"/> SUPER PACK COLEÇÃO (10x)</span>
             <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">Apenas 14 CR - Garanta as fotos raras</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push(`/${slug}`)} className="py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:text-white transition-all"><LayoutGrid size={14} /> Vitrine</button>
            <button onClick={() => isAuthorized ? setShowDeposit(true) : router.push('/')} className="py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:text-[#D946EF] transition-all"><ShoppingCart size={14} /> Depositar</button>
          </div>
        </div>

        {/* Perfil com Galeria (Mesmo Estilo Roleta) */}
        {showProfile && (
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl p-6 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm mx-auto relative flex flex-col max-h-[90vh] shadow-2xl">
              <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><CloseIcon size={24} /></button>
              <div className="w-20 h-20 bg-[#D946EF]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><User size={40} className="text-[#D946EF]"/></div>
              <h2 className="text-xl font-black text-white uppercase italic mb-8 text-center flex items-center justify-center gap-3"><Trophy className="text-[#FFD700]" /> Sua Galeria</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {unlockedPhotos.length === 0 ? (
                  <div className="py-20 text-center opacity-20"><ImageIcon size={40} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Nada desbloqueado</p></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedPhotos.map((img, i) => (
                      <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg">
                        <img src={img.photo_url} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-[10px] font-black uppercase text-white/20 hover:text-red-500 transition-colors text-center">Sair da Conta</button>
            </div>
          </div>
        )}

        {/* Modal PIX (Mesmo Estilo Roleta) */}
        {showDeposit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[3.5rem] w-full max-w-sm relative shadow-2xl">
              <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/20 hover:text-white"><CloseIcon size={24} /></button>
              {pixLoading ? (
                <div className="py-20 flex flex-col items-center text-[#D946EF] font-black text-xs uppercase animate-pulse"><Loader2 className="animate-spin mb-4" size={40} /> Gerando Pix...</div>
              ) : pixData ? (
                <div className="text-center">
                  <h2 className="text-xl font-black text-white uppercase italic mb-6">Pagar com PIX</h2>
                  <div className="bg-white p-4 rounded-[2.5rem] inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]"><img src={pixData.qr_code_base64} className="w-52 h-52" /></div>
                  <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-2xl animate-pulse">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                  <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                    {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <h2 className="text-xl font-black text-white uppercase italic text-center mb-6">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                  {[ { rs: 20, cr: 25 }, { rs: 40, cr: 55 }, { rs: 70, cr: 100 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative">
                      <div className="text-left"><span className="block text-lg font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">R$ {p.rs},00</span></div>
                      <div className="bg-[#D946EF] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase">Comprar</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 35s linear infinite; width: fit-content; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
