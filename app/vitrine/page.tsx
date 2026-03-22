"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ShieldCheck, Home } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function VitrinePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Removemos o 'isChecking' que estava a deixar a tela preta.
  // Agora ele carrega a vitrine por padrão e decide no primeiro milissegundo se embaça ou não.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isLoggedIn = localStorage.getItem("labz_player_logged");
    
    if (!isLoggedIn) {
      setIsAuthorized(false);
      setShowAuthModal(true);
    } else {
      setIsAuthorized(true);
      setShowAuthModal(false);
    }
  }, []);

  // Previne erros de hidratação no Next.js
  if (!isMounted) return null;

  // Função garantida para voltar à Home
  const handleReturnHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-[#FF1493] selection:text-white">
      {/* Fundo padronizado */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.12)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      <div className="fixed top-0 w-full h-1/2 bg-gradient-to-b from-[#FF1493]/10 to-transparent z-0 blur-3xl pointer-events-none" />

      {/* CONTEÚDO DA VITRINE
        A classe de blur é aplicada diretamente aqui se não estiver autorizado.
        A luminosidade baixa (brightness-50) ajuda o modal a ter contraste.
      */}
      <div 
        className={`relative z-10 w-full max-w-md mx-auto px-6 py-10 min-h-[100dvh] flex flex-col transition-all duration-700 ease-in-out
        ${!isAuthorized ? 'blur-[10px] pointer-events-none select-none brightness-50' : ''}`}
      >
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleReturnHome}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#FF1493] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Vitrine <span className="text-[#FF1493]">VIP</span>
          </h1>
          
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-8">
          <p className="text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2 mb-2">
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
            <span>Escolha a sua Musa</span>
            <Sparkles size={12} className="text-[#FF1493] shrink-0" />
          </p>
          <p className="text-xs text-white/50 font-medium">Selecione uma modelo para aceder aos jogos exclusivos.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] transition-all cursor-pointer group relative overflow-hidden">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-[10px] font-black uppercase">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">Rapha Savanah</span>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center h-48 hover:border-[#FF1493] transition-all cursor-pointer group relative overflow-hidden">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full mb-4 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-[10px] font-black uppercase">Foto</div>
            </div>
            <span className="text-xs font-black uppercase text-white tracking-widest text-center group-hover:text-[#FF1493] transition-colors">Outra Musa</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center pb-6">
          <p className="text-[9px] text-white/30 uppercase font-black tracking-widest flex items-center gap-1">
            Plataforma 100% Segura <ShieldCheck size={10} />
          </p>
        </div>
      </div>

      {/* OVERLAY DE LOGIN
        Fica por cima de tudo se não estiver logado.
        Adicionei um botão grande de voltar à Home caso o cliente queira desistir.
      */}
      {!isAuthorized && showAuthModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 bg-transparent">
          
          <AuthModal 
            isOpen={true} 
            onClose={handleReturnHome} // O "X" do modal chama a mesma função de voltar
          />

          {/* Botão de segurança para forçar a volta caso o X do modal falhe no mobile */}
          <button 
            onClick={handleReturnHome}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl"
          >
            <Home size={16} /> Voltar ao Início
          </button>
        </div>
      )}
      
    </div>
  );
}
