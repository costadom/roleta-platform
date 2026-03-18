"use client";

import { Heart, Sparkles, MessageCircle, Crown } from "lucide-react";

export default function HomePage() {
  const whatsappNumber = "5515996587248";

  const handlePlayerClick = () => {
    const text = encodeURIComponent("Olá, gostaria conhecer as modelos parceiras da Labz Sexy Roll");
    window.location.href = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${text}`;
  };

  const handleModelClick = () => {
    const text = encodeURIComponent("Olá, tenho interesse em ser uma modelo parceira.");
    window.location.href = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${text}`;
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-6">
      {/* Background Degradê de Luxo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,20,147,0.15)_0%,rgba(0,0,0,1)_100%)] z-0" />
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#FF1493]/10 to-transparent z-0 blur-3xl" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        
        {/* Logo SB Brilhante */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-[#FF1493]/50 bg-black shadow-[0_0_30px_rgba(255,20,147,0.3)] flex items-center justify-center mb-6 relative group">
          <div className="absolute inset-0 rounded-full border-2 border-[#FFD700]/30 animate-[spin_4s_linear_infinite] opacity-50" />
          <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#FF1493] to-[#FFD700] tracking-tighter">
            SB
          </span>
        </div>

        {/* Título e Slogan */}
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tighter mb-2">
          Savanah <span className="text-[#FF1493]">Labz</span>
        </h1>
        <p className="text-[9px] sm:text-[10px] text-[#FFD700] uppercase font-black tracking-[0.2em] mb-12 flex items-center gap-2 justify-center">
          <Sparkles size={12} className="text-[#FF1493]" />
          De criadora de conteúdos para criadoras de conteúdos
          <Sparkles size={12} className="text-[#FF1493]" />
        </p>

        {/* Botões de Ação */}
        <div className="w-full space-y-6">
          
          {/* Caixa do Cliente */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-xl backdrop-blur-md">
            <Heart className="text-[#FF1493] mb-3" size={28} />
            <h2 className="text-lg font-black uppercase text-white mb-1">Quer curtir, amor?</h2>
            <p className="text-[11px] text-white/50 mb-6 font-medium uppercase tracking-widest">Procure uma modelo parceira clicando aqui</p>
            <button
              onClick={handlePlayerClick}
              className="w-full bg-gradient-to-r from-[#FF1493] to-[#9c0a58] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#FF1493]/20 hover:scale-[1.02] transition-transform active:scale-95"
            >
              <MessageCircle size={18} /> Ver Modelos Parceiras
            </button>
          </div>

          {/* Caixa da Modelo */}
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 p-6 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden shadow-xl backdrop-blur-md">
            <Crown className="text-[#FFD700] mb-3" size={28} />
            <h2 className="text-lg font-black uppercase text-[#FFD700] mb-1 text-center leading-tight">Quer ser uma<br/>modelo parceira?</h2>
            <p className="text-[11px] text-white/50 mb-6 font-medium uppercase tracking-widest text-center">Faça parte da maior roleta sexy do brasil</p>
            <button
              onClick={handleModelClick}
              className="w-full bg-transparent border-2 border-[#FFD700] text-[#FFD700] py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-all active:scale-95"
            >
              <MessageCircle size={18} /> Quero ser parceira
            </button>
          </div>

        </div>
      </div>
      
      {/* Assinatura de rodapé invisível (opcional) */}
      <div className="absolute bottom-4 text-[8px] text-white/20 uppercase font-black tracking-[0.3em]">
        Powered by Savanah Labz © 2026
      </div>
    </div>
  );
}
