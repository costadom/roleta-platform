"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, User, Key, LayoutGrid } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function VitrinePage() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        const logged = localStorage.getItem("labz_player_logged") === "true";
        setIsLoggedIn(logged);

        // CORREÇÃO: Busca tudo e filtra no código para garantir que nenhuma musa se perca.
        const modelsRes = await fetch(`${supabaseUrl}/rest/v1/Models?select=*,Configs(*)`, { headers }).then(r => r.json());
        
        const activeModels = Array.isArray(modelsRes) ? modelsRes.filter(m => {
            const config = m.Configs && m.Configs.length > 0 ? m.Configs[0] : null;
            return config && config.showcase_visible === true && config.model_name;
        }) : [];
        
        setModels(activeModels);

      } catch (err) { console.error(err); } finally { setInitialLoading(false); }
    }
    fetchData();
  }, []);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Musas...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative pb-20">
      
      <header className="fixed top-0 left-0 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
          <div>
            <h1 className="text-xl font-black italic text-[#D946EF] tracking-tighter">SAVANAH <span className="text-white">LABZ</span></h1>
            <p className="text-[8px] text-white/30 uppercase font-black tracking-widest -mt-1">Escolha sua Musa</p>
          </div>
          
          {!isLoggedIn ? (
            <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#D946EF] hover:text-white transition-all shadow-xl">
                <Key size={14}/> Login VIP
            </button>
          ) : (
            <button onClick={() => router.push('/hub')} className="px-5 py-2.5 bg-[#D946EF] text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#f062ff] transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <User size={14}/> Meu Perfil
            </button>
          )}
      </header>

      <div className="max-w-7xl mx-auto p-6 mt-28">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase italic text-white tracking-tighter drop-shadow-lg">ESCOLHA SUA <span className="text-[#D946EF]">MUSA</span></h2>
            <p className="text-[#FFD700] text-[10px] font-bold uppercase tracking-[0.3em] mt-2 flex items-center justify-center gap-2"><Sparkles size={12}/> HUB PRIVADO E ROLETA VIP <Sparkles size={12}/></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {models.length > 0 ? models.map((m) => {
            const config = m.Configs?.[0];
            return (
              <div key={m.id} className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group border border-white/5 bg-[#0a0a0a] shadow-2xl">
                <img src={config?.profile_url} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col p-8 items-center justify-end text-center">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl mb-1">{config?.model_name}</h3>
                    <p className="text-white/70 text-xs italic mb-6 line-clamp-2 px-2">{m.bio || "Acesse meu Hub para ver meus conteúdos e roleta."}</p>
                    
                    <button onClick={() => router.push(`/profile/${m.slug}`)} className="w-full flex items-center justify-center gap-3 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-2xl transition-all hover:scale-[1.03] active:scale-95">
                        <User size={16}/> Acessar Hub Privado
                    </button>
                </div>
              </div>
            );
          }) : (
              <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-[3rem] col-span-full">Nenhuma musa ativa na vitrine no momento.</div>
          )}
        </div>
      </div>

      <button 
          onClick={() => { if(!isLoggedIn) return setShowAuthModal(true); router.push('/hub'); }} 
          className="fixed bottom-6 right-6 z-[999] bg-[#D946EF] text-white p-4 rounded-full shadow-[0_10px_40px_rgba(217,70,239,0.5)] hover:scale-110 hover:bg-[#f062ff] transition-all flex items-center justify-center group border border-white/20"
      >
          <User size={24} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs tracking-widest">
              Meu Perfil VIP
          </span>
      </button>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
