"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radio, Gamepad2, MessageCircle, Sparkles, Key, CheckCircle, AlertTriangle } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modelsBgs, setModelsBgs] = useState<string[]>([]);
  const [bgIndex, setBgIndex] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        // Puxa fotos de modelos para o fundo animado translúcido
        const resMedia = await fetch(`${supabaseUrl}/rest/v1/Media?select=bg_url,profile_url&limit=20`, { headers }).then(r=>r.json());
        
        if (resMedia.ok && resMedia.length > 0) {
            const bgs = resMedia.map((m:any) => m.bg_url || m.profile_url).filter(Boolean);
            setModelsBgs(bgs);
        }
      } catch (err) {} finally { setInitialLoading(false); }
    }
    fetchData();
  }, [supabaseUrl, supabaseKey]);

  // Lógica do slideshow de fundo
  useEffect(() => {
    if (modelsBgs.length === 0) return;
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % modelsBgs.length);
    }, 7000); 
    return () => clearInterval(interval);
  }, [modelsBgs]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando LabzSexy...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative pb-20 overflow-x-hidden">
      
      {/* 🔥 FUNDO ANIMADO LIQUID GLASS DINÂMICO 🔥 */}
      <div className="fixed inset-0 z-0 bg-black">
        {modelsBgs.map((bg, idx) => (
            <img 
              key={idx} 
              src={bg} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${idx === bgIndex ? 'opacity-20 scale-105' : 'opacity-0 scale-100'}`} 
            />
        ))}
        {/* Camada de degradê/vidro sobre as fotos flutuantes */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/95 via-black/80 to-[#050505] backdrop-blur-[10px]"></div>
      </div>

      {/* HEADER LIQUID GLASS */}
      <header className="fixed top-0 left-0 w-full h-20 bg-black/60 backdrop-blur-2xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="flex items-center gap-2">
                <img src="/tridente-logo.svg" className="w-6 h-6 text-[#D946EF] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]" /> {/* Requer o SVG do tridente */}
                <h1 className="text-xl font-black italic text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">LABZSEXY</h1>
            </div>
            <p className="text-[8px] text-white/30 uppercase font-black tracking-widest -mt-1 hidden sm:block">ESCOLHA SUA MUSA</p>
          </div>
          
          <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white/70 font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all shadow-xl">
              <Key size={14}/> ENTRAR / CADASTRAR (FÃ)
          </button>
      </header>

      {/* CONTEÚDO PRINCIPAL (Z-INDEX ACIMA DO FUNDO) */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 mt-28">
        
        {/* 🔥 TÍTULO COM BRILHO NEON 🔥 */}
        <div className="text-center mb-16 relative">
            <h2 className="text-4xl sm:text-5xl font-black uppercase italic text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">ESCOLHA SUA <span className="text-[#D946EF]">MUSA</span></h2>
            <div className="absolute -inset-1 bg-[#D946EF]/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* grid de modelos omitido para brevidade, use seu código existente */}

        {/* 🔥 SEÇÃO EXPERIÊNCIA PREMIUM (Copy image_7, Visual Glass/Neon) 🔥 */}
        <div className="mt-24 mb-12">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D946EF]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#D946EF]/20 transition-all"></div>
                
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-white mb-10 tracking-tighter relative z-10">
                    <span className="text-[#D946EF]">EXPERIÊNCIA</span> PREMIUM
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 relative z-10">
                    {/* Item 1: Câmeras ao Vivo (Neon Cyan) */}
                    <div className="flex flex-col items-start text-left">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <Radio size={24} className="text-[#00f0ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
                        </div>
                        <h3 className="font-black text-white uppercase text-sm mb-3">CÂMERAS AO VIVO</h3>
                        <p className="text-xs text-white/50 leading-relaxed font-medium">Shows públicos ou convide sua musa favorita para uma sessão VIP trancada a sete chaves, cobrada por minuto.</p>
                    </div>

                    {/* Item 2: Jogos Picantes (Neon Yellow) */}
                    <div className="flex flex-col items-start text-left">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                            <Gamepad2 size={24} className="text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                        </div>
                        <h3 className="font-black text-white uppercase text-sm mb-3">JOGOS PICANTES</h3>
                        <p className="text-xs text-white/50 leading-relaxed font-medium">Gire a Roleta ou raspe as cartelas premiadas para ganhar vídeos exclusivos, áudios e chamadas de video na hora.</p>
                    </div>

                    {/* Item 3: Chat Desbloqueado (Neon Pink) */}
                    <div className="flex flex-col items-start text-left">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
                            <MessageCircle size={24} className="text-[#ff0055] drop-shadow-[0_0_10px_rgba(255,0,85,0.8)]" />
                        </div>
                        <h3 className="font-black text-white uppercase text-sm mb-3">CHAT DESBLOQUEADO</h3>
                        <p className="text-xs text-white/50 leading-relaxed font-medium">Converse diretamente com as modelos. Compre mídias trancadas ou envie mimos e presentes virtuais pelo chat.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 🔥 SEÇÃO PARA MODELOS (Copy image_7, Visual Glass/Neon) 🔥 */}
        <div className="mb-12">
            <div className="bg-black/50 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-inner flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D946EF]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#D946EF]/20 transition-all"></div>

                <div className="flex-1 text-center md:text-left relative z-10">
                    <h2 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-3 tracking-tighter">
                        É CRIADORA DE <span className="text-[#D946EF]">CONTEÚDO?</span>
                    </h2>
                    <p className="text-xs text-white/60 leading-relaxed font-medium max-w-xl mx-auto md:mx-0">
                        Junte-se à Savanah Labz. Monetize suas fotos, vídeos e lives em um ambiente seguro, livre de taxas abusivas. Receba 70% direto na sua conta através de transações automatizadas via PIX.
                    </p>
                </div>
                {/* BOTÃO CADASTRO MODELO: Visual Vidro Escuro e Neon Magenta */}
                <button onClick={() => router.push('/admin')} className="w-full md:w-auto bg-black hover:bg-white/5 backdrop-blur-md border-2 border-[#D946EF] text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] flex items-center justify-center gap-2 relative z-10">
                   <ShieldCheck size={16} className="text-[#D946EF]"/> SOU MODELO
                </button>
            </div>
        </div>

      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
