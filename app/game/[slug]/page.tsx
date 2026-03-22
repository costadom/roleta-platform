"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Home, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

import { RouletteWheel } from '@/components/RouletteWheel'; 
import AuthModal from "@/components/AuthModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GamePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log("🟢 [GamePage] Iniciando carregamento para o slug:", slug);
    
    // 1. Verifica Login
    const isLoggedIn = localStorage.getItem("labz_player_logged");
    console.log("🟢 [GamePage] Status de Login (localStorage):", isLoggedIn ? "Logado" : "Deslogado");
    if (isLoggedIn) {
      setIsAuthorized(true);
    }

    // 2. Busca dados (AGORA SEM PEDIR O 'name')
    async function fetchModelData() {
      if (!slug) return;
      try {
        setLoading(true);
        console.log("🟢 [GamePage] Buscando dados da modelo no Supabase...");
        
        // Pega só o ID e o Slug
        const { data: modelData, error: modelError } = await supabase
          .from('Models')
          .select('id, slug')
          .eq('slug', slug)
          .single();

        if (modelError) {
          console.error("🔴 [GamePage] Erro ao buscar tabela Models:", modelError);
          throw modelError;
        }
        
        console.log("🟢 [GamePage] Modelo encontrada:", modelData);
        setModelId(modelData.id);

        console.log("🟢 [GamePage] Buscando configuração (Configs) para o bg_url...");
        const { data: configData, error: configError } = await supabase
          .from('Configs')
          .select('bg_url')
          .eq('model_id', modelData.id)
          .single();

        if (configError) {
          console.error("🔴 [GamePage] Erro ao buscar tabela Configs (ou não tem config):", configError);
          // Não lançamos o erro aqui para não quebrar a tela inteira se ela não tiver fundo
        } else if (configData && configData.bg_url) {
          console.log("🟢 [GamePage] URL de fundo encontrada.");
          setBackgroundUrl(configData.bg_url);
        }

      } catch (err) {
        console.error("🔴 [GamePage] Erro fatal no fetchModelData:", err);
      } finally {
        setLoading(false);
        console.log("🟢 [GamePage] Fim do loading principal.");
      }
    }

    fetchModelData();
  }, [slug]);

  const handleGameInteraction = (e: React.MouseEvent) => {
    if (!isAuthorized) {
      console.log("🟡 [GamePage] Clique bloqueado. Usuário deslogado. Abrindo modal.");
      e.preventDefault();
      e.stopPropagation();
      setShowAuthModal(true);
    }
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-black">
      
      {backgroundUrl && (
        <div 
            className="fixed inset-0 bg-cover bg-center z-0 animate-in fade-in"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}
      
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-0 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#D946EF]/20 blur-[100px] rounded-full pointer-events-none z-0" />

      <div 
        className="relative z-10 w-full min-h-screen flex flex-col"
        onClickCapture={handleGameInteraction}
      >
        <div className="w-full p-4 flex justify-between items-center max-w-md mx-auto relative z-20">
          <Link 
            href={`/${slug}`} 
            className="w-10 h-10 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] transition-all"
            onClick={(e) => {
               if(!isAuthorized) { e.preventDefault(); setShowAuthModal(true); }
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          
          <div className="flex gap-2">
            <Link 
                href="/" 
                className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] transition-all"
                onClick={(e) => {
                   if(!isAuthorized) { e.preventDefault(); setShowAuthModal(true); }
                }}
            >
              <Home size={18} />
            </Link>
            <Link 
                href="/perfil" 
                className="w-10 h-10 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#D946EF] transition-all"
                onClick={(e) => {
                   if(!isAuthorized) { e.preventDefault(); setShowAuthModal(true); }
                }}
            >
              <User size={18} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 p-4 pb-10">
          <div className="w-full max-w-md text-center mb-6">
            <h1 className="text-3xl font-black text-white uppercase italic drop-shadow-[0_0_15px_rgba(217,70,239,0.6)] tracking-tighter">
              Savanah <span className="text-[#D946EF]">Labz</span>
            </h1>
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-2">
              Roleta de {slug} 
            </p>
          </div>

          {loading ? (
              <div className="text-[#D946EF] animate-pulse text-xs font-bold uppercase tracking-widest">
                Carregando Jogo...
              </div>
          ) : (
              // Envolto num try/catch visual para não deixar a tela preta se a roleta der pau
              <ErrorBoundary fallback={<div className="text-red-500 font-bold p-4 bg-black/50 rounded-xl border border-red-500/30">Erro ao carregar componente da Roleta. Verifique o console.</div>}>
                {/* Repassando o modelId para a roleta caso ela precise para buscar os prêmios (evitando o e.length) */}
                <RouletteWheel />
              </ErrorBoundary>
          )}
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 bg-black/80 backdrop-blur-md">
          
          <button 
            onClick={() => window.location.href = `/${slug}`}
            className="mb-6 w-full max-w-md bg-[#141414]/90 border border-[#D946EF]/50 hover:bg-[#D946EF]/20 backdrop-blur-md text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 pointer-events-auto transition-all shadow-[0_0_30px_rgba(217,70,239,0.15)]"
          >
            <ExternalLink size={16} className="text-[#D946EF]" /> Visitar Perfil da Modelo
          </button>

          <div className="pointer-events-auto w-full max-w-md">
            <AuthModal 
              isOpen={true} 
              onClose={closeAuthModal} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Utilitário simples de Error Boundary para impedir que o erro da roleta quebre a tela toda
import React from 'react';
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("🔴 [ErrorBoundary] Erro na Roleta:", error, errorInfo); }
  render() { if (this.state.hasError) { return this.props.fallback; } return this.props.children; }
}
