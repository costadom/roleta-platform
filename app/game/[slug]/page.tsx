"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Home, User, Crown } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import RouletteGame from '@/components/RouletteGame'; 
import AuthModal from "@/components/AuthModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Segurança de Login
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // 1. Verifica o Login
    const isLoggedIn = localStorage.getItem("labz_player_logged");
    if (!isLoggedIn) {
      setIsAuthorized(false);
      setShowAuthModal(true);
    } else {
      setIsAuthorized(true);
      setShowAuthModal(false);
    }

    // 2. Busca a foto da modelo no banco
    async function fetchModelData() {
      if (!slug) return;
      try {
        setLoading(true);
        const { data: modelData, error: modelError } = await supabase
          .from('Models')
          .select('id, name')
          .eq('slug', slug)
          .single();

        if (modelError || !modelData) throw modelError;
        setModelName(modelData.name || slug);

        const { data: configData, error: configError } = await supabase
          .from('Configs')
          .select('bg_url')
          .eq('model_id', modelData.id)
          .single();

        if (configError) throw configError;

        if (configData && configData.bg_url) {
          setBackgroundUrl(configData.bg_url);
        }
      } catch (err) {
        console.error("Erro ao buscar dados da modelo:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchModelData();
  }, [slug]);

  const handleReturnToVitrine = () => {
    window.location.href = "/vitrine"; 
  };

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-black">
      
      {/* 1. Imagem de Fundo Dinâmica */}
      {backgroundUrl && (
        <div 
            className={`fixed inset-0 bg-cover bg-center z-0 transition-all duration-500 
            ${!isAuthorized ? 'blur-md opacity-50' : 'animate-in fade-in'}`}
            style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}
      
      {/* 2. O Pano Preto da Roleta */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-0 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#D946EF]/20 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* CONTEÚDO DA ROLETA (Trava de click se não logado) */}
      <div className={`relative z-10 w-full min-h-screen flex flex-col ${!isAuthorized ? 'pointer-events-none select-none' : ''}`}>
        
        {/* Navbar */}
        <div className="w-full p-4 flex justify-between items-center max-w-md mx-auto">
          <Link 
            href={`/${slug}`} 
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

        {/* Centro da Tela */}
        <div className="flex flex-col items-center justify-center flex-1 p-4 pb-10">
          <div className="w-full max-w-md text-center mb-6">
            <h1 className="text-3xl font-black text-white uppercase italic drop-shadow-[0_0_15px_rgba(217,70,239,0.6)] tracking-tighter">
              Savanah <span className="text-[#D946EF]">Labz</span>
            </h1>
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-2">
              Roleta de {modelName || 'Musa VIP'}
            </p>
          </div>

          {/* NOVO: Botão Visitar Perfil da Modelo */}
          {!isAuthorized && (
            <button 
              onClick={() => router.push(`/${slug}`)}
              className="mb-8 w-full max-w-[280px] bg-white/5 border border-white/20 hover:border-[#D946EF] backdrop-blur-md text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 pointer-events-auto transition-all"
            >
              <Crown size={14} className="text-[#D946EF]" /> Visitar Perfil da Modelo
            </button>
          )}
          
          {loading ? (
              <div className="text-[#D946EF] animate-pulse text-xs font-bold uppercase tracking-widest">
                Carregando Jogo...
              </div>
          ) : (
              <RouletteGame />
          )}
        </div>
      </div>

      {/* O MODAL DE LOGIN NEON POR CIMA DE TUDO */}
      {!isAuthorized && showAuthModal && (
        <AuthModal 
          isOpen={true} 
          onClose={handleReturnToVitrine} // O X manda voltar pra vitrine
        />
      )}
    </div>
  );
}
