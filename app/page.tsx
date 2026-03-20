"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, MessageCircle, Crown, ChevronDown } from "lucide-react";

function TridenteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V2" /><path d="M7 6.5C7 6.5 9 8.5 12 8.5C15 8.5 17 6.5 17 6.5" /><path d="M12 11.5H8.5" /><path d="M12 11.5H15.5" /><path d="M12 2L10 4.5" /><path d="M12 2L14 4.5" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("savanah_referral_id", ref);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-[#FF1493] selection:text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.12)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      <div className="fixed top-0 w-full h-1/2 bg-gradient-to-b from-[#FF1493]/10 to-transparent z-0 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 min-h-[100dvh] flex flex-col items-center justify-center pt-12 pb-6">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="flex items-center gap-3 mb-4 mt-6">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white">Savanah <span className="text-[#FF1493]">Labz</span></h1>
            <TridenteIcon className="w-9 h-9 sm:w-11 sm:h-11 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.7)]" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] mb-12 flex items-center gap-2 justify-center text-center">
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
            <span>De criadora de conteúdos para criadoras de conteúdos</span>
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
          </p>

          <div className="w-full space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-xl backdrop-blur-md">
              <Heart className="text-[#FF1493] mb-3" size={28} />
              <h2 className="text-lg font-black uppercase text-white mb-1">Quer curtir, amor?</h2>
              <p className="text-[11px] text-white/50 mb-6 font-medium uppercase tracking-widest leading-relaxed text-center">Procure uma modelo parceira clicando aqui</p>
              
              <button onClick={() => router.push("/vitrine")} className="w-full bg-gradient-to-r from-[#FF1493] to-[#9c0a58] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#FF1493]/20 hover:scale-[1.02] transition-transform active:scale-95">
                <Heart size={18} /> Conheça as modelos em nossa vitrine de musas
              </button>
            </div>

            <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 p-6 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-xl backdrop-blur-md">
              <Crown className="text-[#FFD700] mb-3" size={28} />
              <h2 className="text-lg font-black uppercase text-[#FFD700] mb-1 text-center leading-tight">Quer ser uma<br/>modelo parceira?</h2>
              <p className="text-[11px] text-white/50 mb-6 font-medium uppercase tracking-widest text-center leading-relaxed">Faça parte da maior roleta sexy do brasil</p>
              <button onClick={() => router.push("/cadastro")} className="w-full bg-transparent border-2 border-[#FFD700] text-[#FFD700] py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-all active:scale-95">
                <Crown size={18} /> Quero ser parceira
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-12 opacity-50 animate-bounce">
          <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white/50 mb-2">Role para baixo</span>
          <ChevronDown size={20} className="text-white/50" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 pb-24 pt-10 flex flex-col items-center text-center space-y-8">
        <h2 className="text-2xl font-black uppercase text-white tracking-tighter flex items-center gap-3 italic"><TridenteIcon className="w-6 h-6 text-[#FF1493]" /> Muito Além do Jogo</h2>
        <div className="w-full bg-black/40 border border-[#FF1493]/20 p-8 rounded-[2.5rem] text-left shadow-2xl backdrop-blur-md">
          <h3 className="text-[#FF1493] font-black uppercase text-sm mb-4 flex items-center gap-2">Para quem quer se divertir</h3>
          <p className="text-white/70 text-[12px] leading-relaxed font-medium">Sabe aquela safadeza e intimidade que você sempre teve com a Rapha e com nossas parceiras? Ela continua aqui, mas agora com muito mais adrenalina! A Labz Sexy Roll foi criada para te colocar mais perto das suas modelos favoritas através de um jogo viciante. É o melhor custo-benefício do mercado.</p>
        </div>

        <div className="w-full bg-black/40 border border-[#FFD700]/20 p-8 rounded-[2.5rem] text-left shadow-2xl backdrop-blur-md">
          <h3 className="text-[#FFD700] font-black uppercase text-sm mb-4 flex items-center gap-2">Para quem cria o desejo</h3>
          <p className="text-white/70 text-[12px] leading-relaxed font-medium">Idealizada por <strong className="text-white font-black">Rapha Savanah (Savanah Cos)</strong>, a Savanah Labz nasceu de uma vivência real. A Roleta Sexy é uma novidade explosiva para engajar seu público, multiplicar seus ganhos e ditar as suas próprias regras. Afinal, somos de criadora de conteúdos para criadoras de conteúdos.</p>
        </div>
      </div>
      <div className="relative z-10 w-full text-center pb-8 shrink-0"><div className="text-[8px] text-white/20 uppercase font-black tracking-[0.3em]">Powered by Savanah Labz © 2026</div></div>
    </div>
  );
}
