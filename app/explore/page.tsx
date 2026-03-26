"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Search, Flame, Lock, Coins, Sparkles, Loader2, User } from "lucide-react";

export default function ExploreLivePage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [balance, setBalance] = useState(15.00); // MOCK: Saldo do Cliente. Em produção, puxe do Supabase.
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<any[]>([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function loadModels() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        // Puxa as modelos e as configurações do Supabase
        const [mRes, cRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (mRes.ok && cRes.ok) {
            const mData = await mRes.json();
            const cData = await cRes.json();

            // Junta os dados e simula um status online para a vitrine
            const combinedData = mData.map((m: any, index: number) => {
                const config = cData.find((c: any) => c.model_id === m.id);
                // Simulação de status para a vitrine (1 VIP, 1 Offline, os outros Online)
                let mockStatus = "online";
                if (index === 1) mockStatus = "vip";
                if (index === 2) mockStatus = "offline";

                return {
                    id: m.id,
                    name: config?.model_name || m.slug,
                    slug: m.slug,
                    image: config?.profile_url || null,
                    status: mockStatus, 
                    price: 3.10 // MOCK: Preço do VIP por minuto. Futuramente, puxe do banco se houver.
                };
            });
            setModels(combinedData);
        }
      } catch (e) {
        console.error("Erro ao carregar vitrine:", e);
      } finally {
        setInitialLoading(false);
      }
    }
    loadModels();
  }, [supabaseUrl, supabaseKey]);

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.slug.toLowerCase().includes(search.toLowerCase()));

  const handleJoinLive = (slug: string, status: string) => {
    if (status === "offline") return alert("Esta musa não está transmitindo no momento.");
    router.push(`/live/${slug}`);
  };

  if (initialLoading) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
              <Loader2 className="animate-spin text-[#00f0ff] mb-6" size={50} />
              <h2 className="text-xl font-black uppercase italic animate-pulse tracking-widest">Carregando Vitrine...</h2>
          </div>
      );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white pb-20 font-sans">
      
      {/* HEADER LIQUID GLASS FIXO */}
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/hub')}>
          <Sparkles className="text-[#00f0ff]" size={20} />
          <h1 className="text-xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
            Labz <span className="text-[#00f0ff]">Live</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-inner">
            <Wallet size={14} className="text-[#00f0ff]" />
            <span className="font-black text-[12px] text-[#00f0ff]">{balance.toFixed(2).replace('.', ',')} LT</span>
          </div>
          <button className="bg-[#00f0ff] hover:bg-[#00d0dd] text-black w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Coins size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        
        {/* BARRA DE PESQUISA */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="Buscar musas ao vivo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/40 outline-none focus:border-[#00f0ff] transition-colors"
          />
        </div>

        {/* DESTAQUE PRINCIPAL (BANNER) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-[#ff0055]" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Em Alta Agora</h2>
          </div>
          <div className="h-40 rounded-[2rem] bg-gradient-to-r from-[#ff0055]/20 to-[#00f0ff]/20 border border-white/10 overflow-hidden relative flex items-center justify-center cursor-pointer hover:border-[#00f0ff]/50 transition-colors">
             <div className="absolute inset-0 bg-black opacity-40 mix-blend-overlay"></div>
             <div className="relative z-10 text-center">
               <h3 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-2xl">Descubra</h3>
               <p className="text-[#00f0ff] font-bold text-xs uppercase tracking-widest mt-1 animate-pulse">Shows Exclusivos</p>
             </div>
          </div>
        </section>

        {/* GRID DE MODELOS */}
        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Câmeras Ao Vivo</h2>
              <span className="text-[10px] text-white/40 font-bold uppercase">{filteredModels.length} Musas</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredModels.map((model) => (
              <div 
                key={model.id} 
                onClick={() => handleJoinLive(model.slug, model.status)}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer bg-[#0a0a0a] border border-white/10 hover:border-[#00f0ff]/50 transition-all duration-300 shadow-xl"
              >
                {/* Imagem de Fundo */}
                {model.image ? (
                    <img src={model.image} alt={model.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${model.status === 'offline' ? 'grayscale opacity-30' : 'opacity-80 group-hover:opacity-100'}`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <User size={40} className="text-white/20" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none"></div>

                {/* Status Badge (Topo Esquerdo) */}
                <div className="absolute top-3 left-3 z-10">
                  {model.status === 'online' && (
                    <span className="bg-black/60 backdrop-blur-md border border-[#00f0ff]/50 text-[#00f0ff] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span> Ao Vivo
                    </span>
                  )}
                  {model.status === 'vip' && (
                    <span className="bg-black/60 backdrop-blur-md border border-[#ff0055]/50 text-[#ff0055] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,0,85,0.3)]">
                      <Lock size={10} /> Privado VIP
                    </span>
                  )}
                  {model.status === 'offline' && (
                    <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white/50 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                      Offline
                    </span>
                  )}
                </div>

                {/* Info da Modelo (Rodapé) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start transform translate-y-2 group-hover:translate-y-0 transition-transform z-10">
                  <h3 className="text-white font-black text-lg leading-tight truncate w-full drop-shadow-md">{model.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    <Coins size={12} className="text-[#00f0ff]" />
                    <span className="text-[#00f0ff] font-bold text-[10px]">{model.price.toFixed(2).replace('.', ',')} LT/min VIP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredModels.length === 0 && !initialLoading && (
              <div className="py-20 text-center text-white/20 italic font-black uppercase border border-dashed border-white/5 rounded-3xl w-full">
                  Nenhuma musa encontrada.
              </div>
          )}
        </section>
      </main>
    </div>
  );
}