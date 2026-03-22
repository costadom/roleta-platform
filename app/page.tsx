"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, Crown, ChevronDown, Camera, Video, Gamepad2, User, Key } from "lucide-react";
import AuthModal from "@/components/AuthModal";

function TridenteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V2" /><path d="M7 6.5C7 6.5 9 8.5 12 8.5C15 8.5 17 6.5 17 6.5" /><path d="M12 11.5H8.5" /><path d="M12 11.5H15.5" /><path d="M12 2L10 4.5" /><path d="M12 2L14 4.5" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("savanah_referral_id", ref);

    const logged = localStorage.getItem("labz_player_logged") === "true";
    setIsLoggedIn(logged);
  }, []);

  // FUNÇÃO QUE ABRE O MODAL SE NÃO TIVER LOGADO
  const handleClientAction = () => {
      if (!isLoggedIn) {
          setShowAuthModal(true);
      } else {
          router.push("/vitrine");
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative font-sans overflow-x-hidden selection:bg-[#D946EF] selection:text-white">
      
      {/* HEADER: BOTÃO DE LOGIN OU MEU PERFIL */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-end z-50">
          {!isLoggedIn ? (
            <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#D946EF] hover:border-[#D946EF] transition-all shadow-xl">
                <Key size={14}/> Login Cliente VIP
            </button>
          ) : (
            <button onClick={() => router.push('/hub')} className="px-5 py-2.5 bg-[#D946EF] text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#f062ff] transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <User size={14}/> Meu Perfil VIP
            </button>
          )}
      </header>

      {/* BACKGROUNDS */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.08)_0%,rgba(5,5,5,1)_100%)] z-0 pointer-events-none" />
      <div className="fixed top-0 w-full h-1/2 bg-gradient-to-b from-[#D946EF]/5 to-transparent z-0 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 min-h-[100dvh] flex flex-col items-center justify-center pt-12 pb-6">
        <div className="flex-1 flex flex-col items-center justify-center w-full mt-8">
          
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">
              Savanah <span className="text-[#D946EF]">Labz</span>
            </h1>
            <TridenteIcon className="w-9 h-9 sm:w-11 sm:h-11 text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] mb-12 flex items-center gap-2 justify-center text-center">
            <Sparkles size={12} className="text-[#D946EF] shrink-0" />
            <span>De criadora de conteúdos para criadoras de conteúdos</span>
            <Sparkles size={12} className="text-[#D946EF] shrink-0" />
          </p>

          <div className="w-full space-y-6">
            {/* CARD 1: CLIENTES (ABRE CADASTRO SE NÃO LOGADO) */}
            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-2xl backdrop-blur-md">
              <Heart className="text-[#D946EF] mb-4" size={32} />
              <h2 className="text-xl font-black uppercase italic text-white mb-2 tracking-tighter">Quer curtir, amor?</h2>
              <p className="text-[11px] text-white/50 mb-8 font-medium uppercase tracking-widest leading-relaxed text-center">Cadastre-se ou entre para ver a vitrine</p>
              
              <button 
                onClick={handleClientAction} 
                className="w-full bg-[#D946EF] text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:scale-[1.03] transition-all active:scale-95"
              >
                <Heart size={18} fill="currentColor" /> {isLoggedIn ? "Entrar na Vitrine VIP" : "Login / Cadastro VIP"}
              </button>
            </div>

            {/* CARD 2: MODELOS */}
            <div className="bg-[#FFD700]/5 border border-[#FFD700]/30 p-8 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-2xl backdrop-blur-md">
              <Crown className="text-[#FFD700] mb-4" size={32} />
              <h2 className="text-xl font-black uppercase italic text-[#FFD700] mb-2 text-center leading-tight tracking-tighter">Quer ser uma<br/>modelo parceira?</h2>
              <p className="text-[11px] text-white/50 mb-8 font-medium uppercase tracking-widest text-center leading-relaxed">Faça parte da maior plataforma sexy do brasil</p>
              
              <button onClick={() => router.push("/cadastro")} className="w-full bg-transparent border-2 border-[#FFD700] text-[#FFD700] py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-all active:scale-95">
                <Crown size={18} fill="currentColor" /> Quero ser parceira
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mt-12 opacity-50 animate-bounce">
          <span className="text-[8px] uppercase tracking-[0.3em] font-black text-white/50 mb-2">Role para descobrir</span>
          <ChevronDown size={20} className="text-white/50" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto px-6 pb-24 pt-10 flex flex-col items-center text-center space-y-8">
        
        {/* A SEÇÃO QUE EXPLICA O NOVO ECOSSISTEMA */}
        <div className="w-full mb-8">
            <h2 className="text-2xl font-black uppercase text-white tracking-tighter flex items-center justify-center gap-3 italic mb-8">
                <Sparkles className="text-[#D946EF]" size={24}/> Uma Plataforma Completa
            </h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-[#D946EF]/30 transition-all">
                    <User className="text-[#D946EF] mb-3" size={28}/>
                    <h3 className="text-xs font-black uppercase text-white mb-2">Hubs Exclusivos</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest leading-relaxed">Perfis privados e coleções VIP.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-[#D946EF]/30 transition-all">
                    <Camera className="text-[#D946EF] mb-3" size={28}/>
                    <h3 className="text-xs font-black uppercase text-white mb-2">Galeria Premium</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest leading-relaxed">Desbloqueio de fotos na hora via PIX.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-[#D946EF]/30 transition-all">
                    <Video className="text-[#D946EF] mb-3" size={28}/>
                    <h3 className="text-xs font-black uppercase text-white mb-2">Vídeos Encomendados</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest leading-relaxed">Peça seu vídeo e receba em 2 dias.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-[#FFD700]/30 transition-all">
                    <Gamepad2 className="text-[#FFD700] mb-3" size={28}/>
                    <h3 className="text-xs font-black uppercase text-[#FFD700] mb-2">A Roleta Sexy</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest leading-relaxed">Jogue e ganhe prêmios exclusivos.</p>
                </div>
            </div>
        </div>

        {/* TEXTOS ORIGINAIS (MANTIDOS INTACTOS) */}
        <h2 className="text-2xl font-black uppercase text-white tracking-tighter flex items-center gap-3 italic mt-8">
            <TridenteIcon className="w-6 h-6 text-[#D946EF]" /> Muito Além do Jogo
        </h2>
        
        <div className="w-full bg-[#0a0a0a] border border-[#D946EF]/20 p-8 rounded-[2.5rem] text-left shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Heart size={80}/></div>
          <h3 className="text-[#D946EF] font-black uppercase text-sm mb-4 tracking-widest">Para quem quer se divertir</h3>
          <p className="text-white/70 text-[12px] leading-relaxed font-medium">Sabe aquela safadeza e intimidade que você sempre teve com a Rapha e com nossas parceiras? Ela continua aqui, mas agora com muito mais adrenalina! A Labz Sexy Roll foi criada para te colocar mais perto das suas modelos favoritas através de um ecossistema viciante. É o melhor custo-benefício do mercado.</p>
        </div>

        <div className="w-full bg-[#0a0a0a] border border-[#FFD700]/20 p-8 rounded-[2.5rem] text-left shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Crown size={80}/></div>
          <h3 className="text-[#FFD700] font-black uppercase text-sm mb-4 tracking-widest">Para quem cria o desejo</h3>
          <p className="text-white/70 text-[12px] leading-relaxed font-medium">Idealizada por <strong className="text-white font-black">Rapha Savanah (Savanah Cos)</strong>, a Savanah Labz nasceu de uma vivência real. A plataforma é uma novidade explosiva para engajar seu público, multiplicar seus ganhos e ditar as suas próprias regras. Afinal, somos de criadora de conteúdos para criadoras de conteúdos.</p>
        </div>
      </div>

      <div className="relative z-10 w-full text-center pb-8 shrink-0">
          <div className="text-[8px] text-white/20 uppercase font-black tracking-[0.3em]">Powered by Savanah Labz © 2026</div>
      </div>

      {/* O MODAL DE CADASTRO/LOGIN ABRE AQUI */}
      {showAuthModal && <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
