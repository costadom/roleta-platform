"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
// Importamos o Modal de Autenticação
import AuthModal from "@/components/AuthModal";

export default function VitrinePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // A FECHADURA DE SEGURANÇA COM BLUR
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("labz_player_logged");
    
    if (!isLoggedIn) {
      // Se não estiver logado, não autoriza e ABRE o modal de login
      setIsAuthorized(false);
      setShowAuthModal(true);
    } else {
      // Se estiver logado, libera a tela normalmente
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, []);

  // Evita tela piscando enquanto checa o cache do navegador
  if (isChecking) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-[#FF1493] selection:text-white">
      {/* Fundo padronizado */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.12)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      <div className="fixed top-0 w-full h-1/2 bg-gradient-to-b from-[#FF1493]/10 to-transparent z-0 blur-3xl pointer-events-none" />

      {/* CONTEÚDO DA VITRINE (Recebe o Blur se não tiver logado) */}
      <div className={`relative z-10 w-full max-w-md mx-auto px-6 py-10 min-h-screen flex flex-col transition-all duration-500 ${!isAuthorized ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
        
        {/* Barra Superior / Navbar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/")} 
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#FF1493] hover:border-[#FF1493] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Vitrine <span className="text-[#FF1493]">VIP</span>
          </h1>
          
          <div className="w-10"></div> {/* Espaçador invisível */}
        </div>

        {/* Título Central */}
        <div className="text-center mb-8">
          <p className="text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2 mb-2">
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
            <span>Escolha a sua Musa</span>
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
          </p>
          <p className="text-xs text-white/50 font-medium">Selecione uma modelo para aceder aos jogos exclusivos.</p>
        </div>

        {/* Grelha de Modelos (Exemplos Visuais) */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] hover:shadow-[0_0_20px_rgba(255,20,147,0.2)] transition-all cursor-pointer group relative overflow-hidden">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">
              Rapha Savanah
            </span>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] hover:shadow-[0_0_20px_rgba(255,20,147,0.2)] transition-all cursor-pointer group relative overflow-hidden">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">
              Outra Musa
            </span>
          </div>
          
        </div>

        {/* Rodapé da Vitrine */}
        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center pb-6">
          <p className="text-[9px] text-white/30 uppercase font-black tracking-widest flex items-center gap-1">
            Plataforma 100% Segura <ShieldCheck size={10} />
          </p>
        </div>

      </div>

      {/* MODAL DE LOGIN (Só aparece se o cara não estiver logado) */}
      {!isAuthorized && (
        <AuthModal 
          isOpen={showAuthModal} 
          // Se ele fechar o modal no "X" sem logar, mandamos ele pra Home
          onClose={() => router.push("/")} 
        />
      )}
    </div>
  );
}
