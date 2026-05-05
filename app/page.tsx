"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radio, Gamepad2, MessageCircle, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import AuthModal from "@/components/AuthModal";

// 🔥 AS PALAVRAS QUE VÃO SURGIR NO FUNDO 🔥
const THEME_WORDS = [
  "FETICHES", "DESEJO", "ORGASMOS", "VIP", "SEDUÇÃO", 
  "EXCLUSIVO", "PRAZER", "CÂMERAS", "MÍDIAS", "SEGREDOS", 
  "DOMINAÇÃO", "INTIMIDADE", "PREMIUM", "HOT"
];

// Doblamos a lista para preencher bem até telas grandes de Notebook
const ALL_WORDS = [...THEME_WORDS, ...THEME_WORDS];

// Componente do fundo animado (Nítido, Rápido e Espalhado)
function PulsingWordsBackground() {
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    const generated = ALL_WORDS.map((word, i) => {
      // Divide a tela em 4 colunas verticais e 7 linhas horizontais
      const col = i % 4; // 0, 1, 2, 3
      const row = Math.floor(i / 4); // 0 até 6

      // Calcula a posição garantindo que cubra de ponta a ponta (0% a 90%)
      const leftBase = col * 24; 
      const topBase = row * 14; 

      // Adiciona uma leve aleatoriedade dentro da própria área para ficar natural
      const left = leftBase + (Math.random() * 8);
      const top = topBase + (Math.random() * 8);

      return {
        id: i,
        word,
        left: left,
        top: top,
        // Duração bem mais rápida: 5s a 10s (Antes estava 10s a 20s)
        duration: Math.random() * 5 + 5, 
        // Delay negativo! Faz com que as palavras já comecem na tela sem você ter que esperar.
        delay: -(Math.random() * 10), 
        size: Math.random() * 0.7 + 1.0, // Fonte controlada (1.0rem a 1.7rem)
      };
    });
    
    setElements(generated);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none select-none">
      
      {/* Palavras que Surgem e Somem (Agora na camada certa, bem visíveis) */}
      <div className="absolute inset-0 z-10">
        {elements.map((el) => (
          <span
            key={el.id}
            className="absolute text-[#D946EF] font-black uppercase tracking-[0.3em] whitespace-nowrap"
            style={{
              top: `${el.top}%`,
              left: `${el.left}%`,
              fontSize: `${el.size}rem`,
              opacity: 0,
              // Animação de pulso (Surgir e Sumir sem sair do lugar)
              animation: `pulsePop ${el.duration}s infinite ease-in-out ${el.delay}s`,
            }}
          >
            {el.word}
          </span>
        ))}
      </div>

      {/* Sombreamento das bordas beeeem mais fraco para não engolir as palavras da ponta */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,5,0.7)_100%)] z-20"></div>

      {/* CSS da Animação (Nítido e Brilhante) */}
      <style jsx>{`
        @keyframes pulsePop {
          0% { opacity: 0; transform: scale(0.95); }
          20% { opacity: 0.35; transform: scale(1); text-shadow: 0 0 15px rgba(217,70,239,0.8); }
          80% { opacity: 0.35; transform: scale(1); text-shadow: 0 0 15px rgba(217,70,239,0.8); }
          100% { opacity: 0; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem("labz_player_logged") === "true";
    if (logged) {
      router.push('/vitrine');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans relative pb-20 overflow-x-hidden">
      
      {/* 🔥 O NOVO FUNDO PULSANTE ESPALHADO E NÍTIDO 🔥 */}
      <PulsingWordsBackground />

      {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
      <div className="relative z-30 flex flex-col items-center justify-center pt-16 pb-16 px-6 animate-in fade-in duration-500">
        
        {/* LOGO CENTRALIZADO */}
        <div className="flex flex-col items-center justify-center mb-8 pointer-events-none">
            <span className="text-6xl sm:text-7xl mb-2 text-[#D946EF] drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                🔱
            </span>
            <h1 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
                Labz<span className="text-[#D946EF]">Sexy</span>
            </h1>
        </div>

        {/* BOTÃO ÚNICO DE ENTRAR/CADASTRAR */}
        <div className="w-full max-w-sm mb-16">
            <button onClick={() => setShowAuthModal(true)} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:scale-[1.02] active:scale-95 cursor-pointer">
                <LogIn size={18} className="pointer-events-none" /> 
                <span className="pointer-events-none">Entre ou Cadastre-se</span>
            </button>
        </div>

        {/* SEÇÃO EXPERIÊNCIA PREMIUM */}
        <div className="w-full max-w-5xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden mb-12">
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-white mb-10 tracking-tighter pointer-events-none">
                <span className="text-[#D946EF]">Experiência</span> Premium
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 pointer-events-none">
                <div className="flex flex-col items-start text-left">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5">
                        <Radio size={20} className="text-white/80" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Câmeras Ao Vivo</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Shows públicos ou convide sua musa favorita para uma sessão VIP trancada a sete chaves, cobrada por minuto.</p>
                </div>

                <div className="flex flex-col items-start text-left">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5">
                        <Gamepad2 size={20} className="text-white/80" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Jogos Picantes</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Gire a Roleta ou raspe as cartelas premiadas para ganhar vídeos exclusivos, áudios e chamadas de vídeo na hora.</p>
                </div>

                <div className="flex flex-col items-start text-left">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5">
                        <MessageCircle size={20} className="text-white/80" />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm mb-3">Chat Desbloqueado</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">Converse diretamente com as modelos. Compre mídias trancadas ou envie mimos e presentes virtuais pelo chat.</p>
                </div>
            </div>
        </div>

        {/* SEÇÃO PARA MODELOS */}
        <div className="w-full max-w-5xl bg-black/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left pointer-events-none">
                <h2 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-3 tracking-tighter">
                    É Criadora de <span className="text-[#D946EF]">Conteúdo?</span>
                </h2>
                <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium max-w-xl mx-auto md:mx-0">
                    Monetize suas fotos, vídeos e lives em um ambiente seguro. Receba 70% direto na sua conta através de transações automatizadas via PIX.
                </p>
            </div>
            
            <div className="flex flex-col w-full md:w-auto gap-4">
                <button onClick={() => router.push('/cadastro')} className="w-full bg-[#D946EF] hover:bg-[#f062ff] text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer">
                    <UserPlus size={16} className="pointer-events-none" />
                    <span className="pointer-events-none">Quero ser Modelo</span>
                </button>
                
                <button onClick={() => router.push('/admin')} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <ShieldCheck size={16} className="pointer-events-none" />
                    <span className="pointer-events-none">Sou Modelo (Login)</span>
                </button>
            </div>
        </div>

      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
