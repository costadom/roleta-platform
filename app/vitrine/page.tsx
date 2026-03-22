"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Sparkles, ArrowLeft, LogOut, User } from "lucide-react";

export default function VitrinePage() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerPhone, setPlayerPhone] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    // Verifica login do cliente
    const logged = localStorage.getItem("labz_player_logged") === "true";
    const phone = localStorage.getItem("labz_player_phone") || "";
    setIsLoggedIn(logged);
    setPlayerPhone(phone);

    async function fetchModels() {
      try {
        const headers = { 
          apikey: supabaseKey!, 
          Authorization: `Bearer ${supabaseKey}`,
          "Cache-Control": "no-cache" 
        };
        
        // 🔥 CORREÇÃO: Filtramos apenas onde showcase_visible é igual a true
        const res = await fetch(
          `${supabaseUrl}/rest/v1/Configs?showcase_visible=eq.true&select=*,Models(slug)`, 
          { headers }
        );
        
        const data = await res.json();
        
        // Organiza os dados para garantir que temos o slug necessário para o clique
        setModels(data || []);
      } catch (e) {
        console.error("Erro ao carregar vitrine:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  const handleLogout = () => {
    if (confirm("Deseja realmente sair da sua conta?")) {
      localStorage.clear();
      window.location.href = "/vitrine"; // Recarrega para limpar o estado global
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#D946EF] mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Vitrine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      
      {/* HEADER SUPERIOR */}
      <div className="p-6 flex justify-between items-center max-w-2xl mx-auto">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[7px] text-[#D946EF] font-black uppercase tracking-tighter">Cliente VIP</span>
                <span className="text-[10px] text-white/50 font-mono">{playerPhone}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 text-center mt-4">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
          ESCOLHA SUA <br />
          <span className="text-[#D946EF] drop-shadow-[0_0_15px_rgba(217,70,239,0.5)] text-5xl">MUSA</span>
        </h1>
        
        <div className="flex items-center justify-center gap-2 mt-4 mb-12 bg-white/5 py-2 px-4 rounded-full w-fit mx-auto border border-white/5">
          <Sparkles size={12} className="text-[#FFD700]" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Modelos Verificadas & Ativas</p>
          <Sparkles size={12} className="text-[#FFD700]" />
        </div>

        {/* LISTA DE CARDS */}
        <div className="grid gap-10">
          {models.length > 0 ? (
            models.map((item) => (
              <div 
                key={item.id}
                className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:border-[#D946EF]/50 hover:scale-[1.02]"
                onClick={() => router.push(`/game/${item.Models.slug}`)}
              >
                {/* Imagem de Fundo */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img 
                    src={item.bg_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000"} 
                    alt={item.model_name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.75] group-hover:brightness-[0.9]"
                  />
                  
                  {/* Overlay Gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
                  
                  {/* Nome da Musa */}
                  <div className="absolute bottom-28 left-8 text-left">
                    <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter drop-shadow-2xl">
                      {item.model_name || item.Models.slug}
                    </h3>
                    <div className="w-12 h-1 bg-[#D946EF] mt-2 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                  </div>

                  {/* Botão Jogar */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <button className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(217,70,239,0.4)] transition-all group-hover:bg-[#f062ff]">
                      <Play size={14} fill="currentColor" /> Acessar Roleta
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 border border-dashed border-white/10 rounded-[2.5rem]">
                <p className="text-[10px] uppercase font-black text-white/20 italic tracking-widest">Nenhuma musa disponível no momento...</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        body { background-color: #050505; }
      `}</style>
    </div>
  );
}
