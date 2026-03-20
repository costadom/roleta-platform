"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft, Loader2, Play, Sparkles } from "lucide-react";

export default function Vitrine() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    async function fetchShowcase() {
      try {
        const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
        
        // 🔥 A MÁGICA AQUI: Só puxa as configs onde showcase_visible é TRUE
        const [resConfigs, resModels] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Configs?showcase_visible=eq.true&select=model_id,profile_url,model_name`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug,full_name`, { headers })
        ]);

        const dataConfigs = await resConfigs.json();
        const dataModels = await resModels.json();

        // Monta a vitrine só com quem ligou o botão
        const showcaseData = dataConfigs.map((config: any) => {
          const model = dataModels.find((m: any) => m.id === config.model_id);
          if (!model) return null;
          return {
            ...model,
            profile_url: config.profile_url || "https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=500&auto=format&fit=crop",
            displayName: config.model_name || model.slug
          };
        }).filter(Boolean);

        setModels(showcaseData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchShowcase();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans relative selection:bg-[#FF1493] selection:text-white pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,20,147,0.1)_0%,rgba(0,0,0,1)_100%)] z-0 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white transition-all">
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black uppercase text-white mb-4 italic tracking-tighter">Escolha sua <span className="text-[#FF1493]">Roleta</span></h1>
          <p className="text-[11px] text-[#FFD700] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2">
            <Sparkles size={14}/> Nossas modelos parceiras <Sparkles size={14}/>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#FF1493] mb-4" size={40} />
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest animate-pulse">Carregando Vitrine...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 uppercase font-black tracking-widest">A vitrine está sendo atualizada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {models.map((model) => (
              <div key={model.id} className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl hover:border-[#FF1493]/50 transition-all duration-300">
                <div className="relative h-72 w-full overflow-hidden">
                  <img src={model.profile_url} alt={model.displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-6">
                    <h3 className="text-2xl font-black uppercase text-white tracking-tighter drop-shadow-lg">{model.displayName}</h3>
                    <p className="text-[10px] text-[#FF1493] font-black uppercase tracking-widest mt-1 drop-shadow-md">Gire e Ganhe Mimos</p>
                  </div>
                </div>
                <div className="p-6 bg-black">
                  <button onClick={() => router.push(`/game/${model.slug}`)} className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF1493] hover:border-[#FF1493] transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,20,147,0.3)]">
                    <Play size={14} className="text-[#FFD700]" /> Jogar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
