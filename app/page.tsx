"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, UserPlus, LogIn, Radio, Gamepad2, MessageCircle, Sparkles } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Se já estiver logado, joga direto pra Vitrine 🔥
    const logged = localStorage.getItem("labz_player_logged") === "true";
    if (logged) {
      router.push('/vitrine');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50}/></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col relative overflow-x-hidden">
      
      {/* HEADER SIMPLES */}
      <header className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-xl sm:text-2xl text-[#D946EF] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">🔱</span>
             <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                 Labz<span className="text-[#D946EF]">Sexy</span>
             </h1>
          </div>
          <button onClick={() => setShowAuthModal(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all">
              Login
          </button>
      </header>

      {/* HERO SECTION (A Porta de Entrada) */}
      <div className="relative w-full min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=1000&q=80')] bg-cover bg-center opacity-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#050505]/90 to-[#050505]"></div>

        <div className="relative z-10 max-w-md w-full mt-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(217,70,239,0.3)]">
                <span className="text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(217,70,239,0.8)] text-[#D946EF]">🔱</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white drop-shadow-2xl">
                O Universo <br/><span className="text-[#D946EF]">Privado</span>
            </h2>
            <p className="text-white/60 text-xs sm:text-sm font-bold mb-12 tracking-widest uppercase leading-relaxed">
                Lives, Jogos e Conteúdos Exclusivos das melhores Musas.
            </p>

            <div className="flex flex-col gap-4 w-full">
                <button onClick={() => setShowAuthModal(true)} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white py-5 sm:py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:scale-[1.02] active:scale-95">
                    <LogIn size={18} /> Entrar na Plataforma
                </button>
                <button onClick={() => setShowAuthModal(true)} className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white py-5 sm:py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                    <UserPlus size={18} /> Criar Conta VIP
                </button>
            </div>
        </div>
      </div>

      {/* SEÇÃO EXPERIÊNCIA PREMIUM (A que você gostou) */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="bg-gradient-to-br from-[#0a0a0a]/80 to-black/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D946EF]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-white mb-10 tracking-tighter relative z-10"><span className="text-[#D946EF]">Experiência</span> Premium</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 relative z-10">
                <div className="flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                        <Radio size={24} className="text-[#00f0ff]" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Câmeras Ao Vivo</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Shows públicos ou convide sua musa favorita para uma sessão VIP trancada a sete chaves, cobrada por minuto.</p>
                </div>

                <div className="flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                        <Gamepad2 size={24} className="text-[#FFD700]" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Jogos Picantes</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Gire a Roleta ou raspe as cartelas premiadas para ganhar vídeos exclusivos, áudios e chamadas de vídeo na hora.</p>
                </div>

                <div className="flex flex-col items-start text-left">
                    <div className="w-14 h-14 bg-[#ff0055]/10 border border-[#ff0055]/30 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
                        <MessageCircle size={24} className="text-[#ff0055]" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Chat Desbloqueado</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Converse diretamente com as modelos. Compre mídias trancadas ou envie mimos e presentes virtuais pelo chat.</p>
                </div>
            </div>
        </div>
      </div>

      {/* SEÇÃO PARA MODELOS */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-20">
        <div className="bg-[#0a0a0a]/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-3 tracking-tighter">É Criadora de <span className="text-[#D946EF]">Conteúdo?</span></h2>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium max-w-xl mx-auto md:mx-0">
                    Junte-se à LabzSexy. Monetize suas fotos, vídeos e lives em um ambiente seguro. Receba 70% direto na sua conta através de transações automatizadas via PIX.
                </p>
            </div>
            <div className="flex flex-col w-full md:w-auto gap-3">
                <button onClick={() => router.push('/admin')} className="w-full bg-[#D946EF] hover:bg-[#f062ff] text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02]">
                    Criar Conta de Musa
                </button>
                <button onClick={() => router.push('/admin')} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2">
                    <ShieldCheck size={16} /> Já sou cadastrada
                </button>
            </div>
        </div>
      </div>

      {showAuthModal && <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
