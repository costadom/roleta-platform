"use client";

import ScratchCardGame from '@/components/ScratchCardGame';
import { ArrowLeft, Home, User } from 'lucide-react';
import Link from 'next/link';

export default function RaspadinhaTestPage() {
  // Simulação da foto de fundo da modelo (igual na roleta)
  const backgroundUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden">
      {/* Imagem de Fundo Dinâmica */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      
      {/* Sobreposição Escura (Overlay) para dar contraste */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-0" />

      {/* Navbar Superior de Navegação */}
      <div className="fixed top-0 w-full p-4 z-50 flex justify-between items-center max-w-md mx-auto left-0 right-0">
        <Link 
          href="/modelo/test" 
          className="w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] hover:border-[#D946EF] transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        
        <div className="flex gap-2">
          <Link 
            href="/" 
            className="w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] hover:border-[#D946EF] transition-all"
          >
            <Home size={18} />
          </Link>
          <Link 
            href="/perfil" 
            className="w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] hover:border-[#D946EF] transition-all"
          >
            <User size={18} />
          </Link>
        </div>
      </div>

      {/* Conteúdo Central do Jogo */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-20 pb-10">
        <div className="w-full max-w-md text-center mb-6">
          <h1 className="text-3xl font-black text-white uppercase italic drop-shadow-lg">
            Savanah <span className="text-[#D946EF]">Labz</span>
          </h1>
        </div>
        
        <ScratchCardGame />
      </div>
    </div>
  );
}
