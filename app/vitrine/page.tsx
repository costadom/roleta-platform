"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Sparkles } from "lucide-react";

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
        
        // Buscamos todas as modelos primeiro
        const resModels = await fetch(`${supabaseUrl}/rest/v1/Models?select=id,slug`, { headers });
        const dataModels = await resModels.json();

        // Buscamos as configs de quem está na vitrine
        const resConfigs = await fetch(`${supabaseUrl}/rest/v1/Configs?select=model_id,profile_url,model_name`, { headers });
        const dataConfigs = await resConfigs.json();

        const showcaseData = dataModels.map((model: any) => {
          const config = dataConfigs.find((c: any) => c.model_id === model.id);
          return {
            ...model,
            profile_url: config?.profile_url || "https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=500&auto=format&fit=crop",
            displayName: config?.model_name || model.slug.toUpperCase()
          };
        });

        setModels(showcaseData);
      } catch (error) {
        console.error("Erro Vitrine:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShowcase();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.15)_0%,rgba(0,0,0,1)_100%)] z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => router.push("/")} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-[#D946EF] transition-all">
          <ArrowLeft size={16} /> Voltar ao Início
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Escolha sua <span className="text-[#D946EF]">Musa</span></h1>
          <p className="text-[10px] text-[#FFD700] uppercase font-black tracking-[0.2em] mt-2 flex items-center justify-center gap-2">
            <Sparkles size={12}/> Giros exclusivos aguardam você <Sparkles size={12}/>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20"><Loader2 className="animate-spin text-[#D946EF]" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {models.map((model) => (
              <div key={model.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#D946EF]/40 transition-all shadow-2xl">
                <div className="relative h-80 overflow-hidden">
                  <img src={model.profile_url} alt={model.displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-2xl font-black uppercase italic text-white drop-shadow-xl">{model.displayName}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <button onClick={() => router.push(`/game/${model.slug}`)} className="w-full bg-[#D946EF] text-white py-4 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.3)] active:scale-95 transition-all">
                    <Play size={14} fill="currentColor" /> Jogar Agora
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
