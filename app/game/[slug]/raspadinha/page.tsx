"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Coins, ShoppingCart, X as CloseIcon, 
  Image as ImageIcon, Lock, CheckCircle2, Copy, Loader2, 
  LayoutGrid, Zap, Trophy, MessageCircle, Heart, Star
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import confetti from "canvas-confetti";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RaspadinhaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [model, setModel] = useState<any>(null);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [unlockedPhotos, setUnlockedPhotos] = useState<any[]>([]);
  const [modelPhotos, setModelPhotos] = useState<any[]>([]);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados do PIX
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
      setBackgroundUrl(modelData.Configs[0]?.bg_url || "");

      // Busca as fotos da raspadinha
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

  // 🔥 Lógica de Jogo Calculista 🔥
  const handlePlay = async (bundleSize: number = 1) => {
    if (!player) return;
    const cost = bundleSize === 10 ? 14 : bundleSize === 5 ? 8 : 2;
    if (player.credits < cost) return setShowDeposit(true);

    setIsProcessing(true);
    
    // Taxa de acerto: 10x (75%), 5x (60%), 1x (40%)
    const winThreshold = bundleSize === 10 ? 0.25 : bundleSize === 5 ? 0.4 : 0.6;
    let currentCredits = player.credits - cost;
    let newUnlocks: any[] = [];

    // Filtra apenas fotos que ele AINDA NÃO TEM
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
        if (newUnlocks.length === 0) alert("Dessa vez veio o X! Tente de novo, minha foto está quase saindo... 🔥");
    }, 1500);
  };

  // Monitoramento de Pagamento
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-xs animate-pulse tracking-widest">Carregando Raspadinha...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center overflow-hidden font-sans">
      <div className="relative w-full h-[100dvh] max-w-[430px] bg-black flex flex-col border-x border-white/5 shadow-2xl overflow-hidden">
        
        {/* Background Estilo Roleta */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 scale-105" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black" />
        </div>

        {/* Header Premium */}
        <div className="relative z-10 p-5 flex justify-between items-center shrink-0">
          <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 bg-black/40 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><ArrowLeft size={20} /></button>
          <div className="flex flex-col items-center">
            <span className="text-[#D946EF] font-black italic text-2xl tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-white">Labz</span></span>
            <span className="text-[9px] text-[#FFD700] font-black uppercase mt-0.5 tracking-[0.3em] italic flex items-center gap-1"><Star size={8} fill="currentColor"/> Raspadinha VIP</span>
          </div>
          <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-black/40 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><User size={20} /></button>
        </div>

        {/* Área de Jogo */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full aspect-[4/5] bg-[#0a0a0a]/80 backdrop-blur-md border-2 border-[#D946EF]/30 rounded-[3rem] p-5 shadow-[0_0_60px_rgba(217,70,239,0.2)] relative overflow-hidden group">
             <div className="w-full h-full border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <ImageIcon size={70} className="text-[#D946EF]/20 mb-6 animate-pulse" />
                <h3 className="text-white font-black uppercase italic text-xl tracking-tighter">Sua Sorte está aqui</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-3 text-center px-8 leading-relaxed">Raspe e complete minha coleção de 10 fotos exclusivas</p>
             </div>
             
             {isProcessing && (
               <div className="absolute inset-0 bg-black/90 backdrop-blur-lg z-30 flex flex-col items-center justify-center text-center">
                  <div className="relative w-20 h-20 mb-4">
                    <Loader2 className="animate-spin text-[#D946EF] absolute inset-0" size={80} strokeWidth={1} />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] text-white">REVELANDO</div>
                  </div>
               </div>
             )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
             <div className="px-8 py-3 bg-[#111] border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
                <Coins size={20} className="text-[#FFD700]" />
                <span className="text-2xl font-black italic text-white">{player?.credits || 0} <span className="text-[#D946EF]">CR</span></span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-[#D946EF] to-[#FFD700] transition-all duration-1000" style={{ width: `${(unlockedPhotos.length / 10) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Coleção: <span className="text-[#FFD700]">{unlockedPhotos.length}/10 FOTOS</span></span>
             </div>
          </div>
        </div>

        {/* Footer Estratégico */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black/95 to-transparent shrink-0">
          <div className="grid grid-cols-2 gap-3 mb-3">
             <button onClick={() => handlePlay(1)} className="bg-white/5 border border-white/10 h-20 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all">
                <span className="text-[10px] font-black uppercase text-white/40">1 Raspada</span>
                <span className="text-base font-black text-white">2 CR</span>
             </button>
             <button onClick={() => handlePlay(5)} className="bg-white/5 border border-[#D946EF]/40 h-20 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[#D946EF] text-white text-[7px] font-black px-2 py-1 rounded-bl-lg group-hover:scale-110 transition-all">ECONOMIZE 20%</div>
                <span className="text-[10px] font-black uppercase text-white/40">Pack 5x</span>
                <span className="text-base font-black text-[#D946EF]">8 CR</span>
             </button>
          </div>

          <button onClick={() => handlePlay(10)} className="w-full py-5 bg-[#FFD700] text-black rounded-2xl font-black uppercase text-xs flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(255,215,0,0.3)] active:scale-95 transition-all mb-4">
             <span className="flex items-center gap-2 text-sm"><Zap size={16} fill="currentColor"/> SUPER PACK COLEÇÃO (10x)</span>
             <span className="text-[9px] font-bold opacity-70">APENAS 14 CRÉDITOS - COMPLETE SEU ÁLBUM</span>
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push(`/${slug}`)} className="py-4 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:text-white transition-all"><LayoutGrid size={14} /> Vitrine</button>
            <button onClick={() => router.push(`/hub`)} className="py-4 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 hover:text-white transition-all"><MessageCircle size={14} /> Hub Modelos</button>
          </div>
        </div>

        {/* Perfil com Galeria */}
        {showProfile && (
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl p-6 animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[3rem] w-full max-w-sm mx-auto relative flex flex-col max-h-[90vh] shadow-2xl">
              <button onClick={() => setShowProfile(false)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><CloseIcon size={24} /></button>
              <div className="w-20 h-20 bg-[#D946EF]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-[#D946EF]/30"><User size={40} className="text-[#D946EF]"/></div>
              <h2 className="text-xl font-black text-white uppercase italic mb-8 text-center flex items-center justify-center gap-3"><Trophy className="text-[#FFD700]" /> Sua Galeria</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {unlockedPhotos.length === 0 ? (
                  <div className="py-20 text-center opacity-20"><ImageIcon size={40} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase">Vazio</p></div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {unlockedPhotos.map((img, i) => (
                      <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl group relative">
                        <img src={img.photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute top-2 right-2"><Star size={12} fill="#FFD700" className="text-[#FFD700]" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-8 text-[10px] font-black uppercase text-white/20 hover:text-red-500 transition-colors">Sair da Conta</button>
            </div>
          </div>
        )}

        {/* Modal PIX Modernizado */}
        {showDeposit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 rounded-[3.5rem] w-full max-w-sm relative shadow-2xl">
              <button onClick={() => { setShowDeposit(false); setPixData(null); }} className="absolute top-6 right-6 text-white/20 hover:text-white"><CloseIcon size={24} /></button>
              {pixLoading ? (
                <div className="py-20 flex flex-col items-center text-[#D946EF] font-black text-xs uppercase animate-pulse"><Loader2 className="animate-spin mb-4" size={40} /> Gerando Pix...</div>
              ) : pixData ? (
                <div className="text-center">
                  <h2 className="text-xl font-black text-white uppercase italic mb-6">Pague com PIX</h2>
                  <div className="bg-white p-4 rounded-[2.5rem] inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]"><img src={pixData.qr_code_base64} className="w-52 h-52" /></div>
                  <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-2xl animate-pulse">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                  
                  <div className="text-left bg-white/5 border border-white/10 p-5 rounded-2xl mb-6">
                    <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Copie o código abaixo.<br/>2. Pague no app do seu banco.<br/>3. Seus créditos caem na hora!</p>
                  </div>

                  <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                    {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <h2 className="text-xl font-black text-white uppercase italic text-center mb-6">Recarregar <span className="text-[#D946EF]">Labz</span></h2>
                  {[ { rs: 20, cr: 25, b: 5 }, { rs: 40, cr: 55, b: 15 }, { rs: 70, cr: 100, b: 30 } ].map((p) => (
                    <button key={p.rs} onClick={() => handleGeneratePix(p.rs)} className="w-full flex justify-between items-center p-6 bg-[#141414] border border-white/5 rounded-3xl hover:border-[#D946EF]/50 active:scale-95 transition-all relative">
                      <div className="absolute top-0 right-0 bg-[#FFD700] text-black text-[8px] font-black px-3 py-1 rounded-bl-xl">+{p.b} BÔNUS</div>
                      <div className="text-left"><span className="block text-lg font-black text-white">{p.cr} CRÉDITOS</span><span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Apenas R$ {p.rs},00</span></div>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
