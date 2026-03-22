"use client";

import { useState, useEffect } from "react";
import ScratchCardGame from '@/components/ScratchCardGame';
import { ArrowLeft, Home, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// Importamos o cliente do supabase
import { createClient } from '@supabase/supabase-js';

// Configuração rápida do cliente Supabase (usando as env vars que você já tem na Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RaspadinhaPage() {
  const params = useParams();
  const slug = params.slug as string; // Puxa o nome da modelo direto da URL (ex: "savanah")

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModelData() {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // 1. Primeiro acha o ID da modelo pelo Slug
        const { data: modelData, error: modelError } = await supabase
          .from('Models')
          .select('id')
          .eq('slug', slug)
          .single();

        if (modelError || !modelData) throw modelError;

        // 2. Com o ID, busca a foto de fundo na tabela Configs
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

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden bg-black">
      {/* Imagem de Fundo Dinâmica vinda do Supabase */}
      {backgroundUrl && (
        <div 
            className="fixed inset-0 bg-cover bg-center z-0 animate-in fade-in duration-500"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}
      
      {/* Sobreposição Escura (Overlay) para dar contraste */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-0" />

      {/* Navbar Superior de Navegação */}
      <div className="fixed top-0 w-full p-4 z-50 flex justify-between items-center max-w-md mx-auto left-0 right-0">
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

      {/* Conteúdo Central do Jogo */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-20 pb-10">
        <div className="w-full max-w-md text-center mb-6">
          <h1 className="text-3xl font-black text-white uppercase italic drop-shadow-lg tracking-tighter">
            Savanah <span className="text-[#D946EF]">Labz</span>
          </h1>
        </div>
        
        {loading ? (
            <div className="text-white/50 animate-pulse text-xs font-bold uppercase tracking-widest">Carregando Jogo...</div>
        ) : (
            <ScratchCardGame />
        )}
      </div>
    </div>
  );
}
