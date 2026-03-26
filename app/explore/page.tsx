"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Search, Flame, Lock, Coins, Sparkles, Loader2, User, Home, Heart, Maximize2, X, QrCode, Copy, CheckCircle, Bell } from "lucide-react";

export default function ExploreLivePage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [balance, setBalance] = useState(15.00); // MOCK: Saldo
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<any[]>([]);

  // Estados do Mini Perfil
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Estados da Loja de Créditos
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [pixTimeLeft, setPixTimeLeft] = useState(180);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function loadModels() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        const [mRes, cRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (mRes.ok && cRes.ok) {
            const mData = await mRes.json();
            const cData = await cRes.json();

            const combinedData = mData.map((m: any, index: number) => {
                const config = cData.find((c: any) => c.model_id === m.id);
                let mockStatus = "online";
                if (index === 1) mockStatus = "vip";
                if (index === 2) mockStatus = "offline";

                return {
                    id: m.id,
                    name: config?.model_name || m.slug,
                    slug: m.slug,
                    image: config?.profile_url || null,
                    bio: config?.bio || "Bem-vindo ao meu mundo exclusivo. Aqui você encontra meus melhores conteúdos e lives quentes. Siga para não perder nada!",
                    status: mockStatus, 
                    price: 3.10,
                    // Mock de fotos públicas para o mini perfil
                    publicPhotos: [
                        config?.profile_url,
                        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80"
                    ].filter(Boolean)
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

  const openMiniProfile = (e: React.MouseEvent, model: any) => {
    e.stopPropagation(); // Evita clicar no card e ir pra live direto
    setSelectedModel(model);
    setIsFollowing(false); // Resetar ou puxar do banco se já segue
  };

  // 🔥 LÓGICA DA LOJA DE LIVETOKENS 🔥
  const handleBuyPackage = (amount: number) => {
    setSelectedPackage(amount);
    setShowShopModal(false);
    setShowPixModal(true);
    setPixTimeLeft(180);
  };

  const simulatePaymentWebhook = () => {
    setBalance(prev => prev + selectedPackage); 
    setShowPixModal(false);
    alert(`PIX Confirmado! ${selectedPackage} LiveTokens adicionados.`);
  };

  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0) pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    else if (pixTimeLeft === 0) setShowPixModal(false);
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft]);


  if (initialLoading) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
              <Loader2 className="animate-spin text-[#00f0ff] mb-6" size={50} />
              <h2 className="text-xl font-black uppercase italic animate-pulse tracking-widest">Carregando Vitrine...</h2>
          </div>
      );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white pb-20 font-sans relative">
      
      {/* MODAL DE LOJA DE LIVETOKENS */}
      {showShopModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
          <Coins size={40} className="text-[#00f0ff] mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Comprar LiveTokens</h2>
          <p className="text-white/60 text-xs font-bold mb-8">1 LiveToken = R$ 1,00. Adicione saldo à sua carteira.</p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => handleBuyPackage(pkg.p)} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#00f0ff]/50 transition-all">
                <span className="text-white font-black uppercase text-sm">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black text-xs">{pkg.p} LT (R$ {pkg.p})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PIX */}
      {showPixModal && (
        <div className="fixed inset-0 z-[210] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0a0a0a] border border-[#00f0ff] rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_rgba(0,240,255,0.3)] relative">
                <div className="flex items-center justify-between w-full mb-6">
                    <h3 className="text-[#00f0ff] font-black uppercase tracking-widest text-xs">PIX: R$ {selectedPackage},00</h3>
                    <button onClick={() => setShowPixModal(false)} className="text-white/50 hover:text-white"><X size={16} /></button>
                </div>
                <div className="bg-white p-2 rounded-xl mb-6"><QrCode size={150} className="text-black" /></div>
                <button className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-full border border-white/10 text-[10px] font-black uppercase mb-3 hover:bg-white/20 transition-all"><Copy size={14} /> Copiar Chave PIX</button>
                <button onClick={simulatePaymentWebhook} className="w-full bg-[#00f0ff] text-black py-3 rounded-full font-black uppercase text-[10px] shadow-[0_0_20px_rgba(0,240,255,0.4)]">Pago (Simular Webhook)</button>
                <div className="mt-4 text-[#00f0ff] font-mono text-xl font-black">{Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
            </div>
        </div>
      )}

      {/* MINI PERFIL MODAL (HUB) */}
      {selectedModel && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModel(null)}></div>
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden z-10 animate-slideUp">
                
                {/* Header com Imagem e Fechar */}
                <div className="h-48 relative bg-black border-b border-white/10">
                    <img src={selectedModel.image} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                    <button onClick={() => setSelectedModel(null)} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white/50 hover:text-white border border-white/10"><X size={18}/></button>
                    
                    {/* Avatar Redondo que sobrepõe */}
                    <div className="absolute -bottom-10 left-6 w-24 h-24 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-black shadow-xl">
                        <img src={selectedModel.image} className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="pt-12 px-6 pb-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedModel.name}</h2>
                            <p className="text-[10px] text-[#00f0ff] font-bold uppercase tracking-widest mt-1">@{selectedModel.slug}</p>
                        </div>
                        {/* Botão Seguir */}
                        <button onClick={() => setIsFollowing(!isFollowing)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-lg ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-[#ff0055] text-white shadow-[#ff0055]/40'}`}>
                            {isFollowing ? <><CheckCircle size={14}/> Seguindo</> : <><Bell size={14}/> Seguir Musa</>}
                        </button>
                    </div>

                    <p className="text-sm text-white/70 italic leading-relaxed mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                        "{selectedModel.bio}"
                    </p>

                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Prévia da Galeria</h3>
                    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 mb-6">
                        {selectedModel.publicPhotos.map((photo: string, idx: number) => (
                            <div key={idx} className="w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                <img src={photo} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button onClick={() => router.push(`/profile/${selectedModel.slug}`)} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all border border-white/10">
                            <Maximize2 size={14}/> Expandir Perfil
                        </button>
                        <button onClick={() => handleJoinLive(selectedModel.slug, selectedModel.status)} className="flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00d0dd] text-black py-4 rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                            <Sparkles size={14}/> Entrar na Live
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}


      {/* HEADER LIQUID GLASS FIXO */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#00f0ff]" size={20} />
          <h1 className="text-xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 hidden sm:block">
            Labz <span className="text-[#00f0ff]">Live</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão Vitrine Principal */}
          <button onClick={() => router.push('/vitrine')} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all">
            <Home size={14} className="text-white/70" />
            <span className="font-black text-[9px] uppercase text-white/70 tracking-widest">Vitrine</span>
          </button>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-inner">
            <Wallet size={14} className="text-[#00f0ff]" />
            <span className="font-black text-[12px] text-[#00f0ff]">{balance.toFixed(2).replace('.', ',')} LT</span>
          </div>
          <button onClick={() => setShowShopModal(true)} className="bg-[#00f0ff] hover:bg-[#00d0dd] text-black w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
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
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/40 outline-none focus:border-[#00f0ff] transition-colors shadow-inner"
          />
        </div>

        {/* DESTAQUE PRINCIPAL (BANNER) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-[#ff0055]" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Em Alta Agora</h2>
          </div>
          <div className="h-40 rounded-[2rem] bg-gradient-to-r from-[#ff0055]/20 to-[#00f0ff]/20 border border-white/10 overflow-hidden relative flex items-center justify-center cursor-pointer hover:border-[#00f0ff]/50 transition-colors shadow-2xl">
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

                {/* Botão HUB (Topo Direito) */}
                <div className="absolute top-3 right-3 z-20">
                  <button 
                    onClick={(e) => openMiniProfile(e, model)}
                    className="bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2 rounded-full transition-all shadow-lg"
                  >
                    <User size={14} />
                  </button>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}