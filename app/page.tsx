"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 VERIFICA SE O CLIENTE JÁ ESTÁ LOGADO. SE ESTIVER, JOGA PRA VITRINE! 🔥
    const logged = localStorage.getItem("labz_player_logged") === "true";
    if (logged) {
      router.push('/vitrine');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#D946EF]" size={50}/></div>;

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Fundo Estiloso Liquid Glass */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=1000&q=80')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/95 to-[#050505]"></div>

      <div className="relative z-10 flex flex-col items-center p-6 text-center max-w-sm w-full">
        
        {/* 🔥 IDENTIDADE VISUAL: O TRIDENTE 🔥 */}
        <div className="w-24 h-24 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(217,70,239,0.3)] animate-pulse">
            <span className="text-5xl drop-shadow-[0_0_15px_rgba(217,70,239,0.8)] text-[#D946EF]">🔱</span>
        </div>
        
        {/* 🔥 IDENTIDADE VISUAL: LABZ SEXY 🔥 */}
        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-2xl">
            Labz<span className="text-[#D946EF]">Sexy</span>
        </h1>
        <p className="text-white/50 text-[10px] font-bold mb-12 tracking-[0.3em] uppercase">
            O Universo Privado das Musas
        </p>

        {/* BOTOES DO CLIENTE */}
        <div className="flex flex-col gap-4 w-full">
            <button onClick={() => setShowAuthModal(true)} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:scale-105 active:scale-95">
                <LogIn size={18} /> Entrar na Plataforma
            </button>
            
            <button onClick={() => setShowAuthModal(true)} className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                <UserPlus size={18} /> Não tem conta? Inscreva-se
            </button>
        </div>

        {/* BOTÃO DA MODELO (ADMIN) */}
        <div className="mt-16 pt-8 border-t border-white/10 w-full flex flex-col items-center">
            <p className="text-[10px] text-white/40 mb-4 uppercase font-black tracking-widest">É criadora de conteúdo?</p>
            <button onClick={() => router.push('/admin')} className="w-full bg-black hover:bg-white/5 border border-white/20 text-white/50 hover:text-[#D946EF] hover:border-[#D946EF]/50 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Acessar Dashboard da Modelo
            </button>
        </div>
      </div>

      {/* O MODAL ABRE AQUI QUANDO CLICA */}
      {showAuthModal && <AuthModal isOpen={true} onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
