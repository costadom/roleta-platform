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
        
        // Busca modelos e suas configurações de fundo/nome
        const res = await fetch(`${supabaseUrl}/rest/v1/Configs?select=*,Models(slug,active)`, { headers });
        const data = await res.json();
        
        // Filtra apenas modelos ativas (se você tiver esse campo) ou todas
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
      localStorage.removeItem("labz_player_logged");
      localStorage.removeItem("labz_player_phone");
      setIsLoggedIn(false);
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#D946EF] mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Carregando Musas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
      
      {/* HEADER SUPERIOR */}
      <div className="p-6 flex justify-between items-center max-w-2xl mx-auto">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao início
        </button>

        {isLoggedIn && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[8px] text-[#D946EF] font-black uppercase leading-none">Cliente VIP</span>
                <span className="text-[10px] text-white/60 font-mono">{playerPhone}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
              title="Sair da conta"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 text-center mt-4">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
          ESCOLHA SUA <br />
          <span className="text-[#D946EF] drop-shadow-[0_0_15px_rgba(217,70,239,0.4)]">MUSA</span>
        </h1>
        
        <div className="flex items-center justify-center gap-2 mt-4 mb-12">
          <Sparkles size={14} className="text-[#FFD700]" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Modelos Verificadas & Ativas</p>
          <Sparkles size={14} className="text-[#FFD700]" />
        </div>

        {/* LISTA DE CARDS */}
        <div className="grid gap-8">
          {models.length > 0 ? (
            models.map((item) => (
              <div 
                key={item.id}
                className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#D946EF]/50"
                onClick={() => router.push(`/game/${item.Models.slug}`)}
              >
                {/* Imagem de Fundo */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img 
                    src={item.bg_url || "/placeholder-musa.jpg"} 
                    alt={item.model_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.7]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Nome da Musa */}
                  <div className="absolute bottom-24 left-8 text-left">
                    <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">
                      {item.model_name || item.Models.slug}
                    </h3>
                  </div>

                  {/* Botão Jogar */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <button className="w-full bg-[#D946EF] text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(217,70,239,0.3)] transition-all active:scale-95">
                      <Play size={14} fill="currentColor" /> Jogar Agora
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] uppercase font-black text-white/20 py-20 italic">Nenhuma musa disponível no momento...</p>
          )}
        </div>
      </div>

      <style jsx global>{`
        body { background-color: #050505; }
      `}</style>
    </div>
  );
}
