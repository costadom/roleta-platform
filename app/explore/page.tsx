"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Search, Flame, Lock, Coins, Sparkles, Loader2, User, Home, Heart, Maximize2, X, QrCode, Copy, CheckCircle, Bell, LogOut } from "lucide-react";

export default function ExploreLivePage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);
  const [balance, setBalance] = useState(0); 
  const [initialBalanceCheck, setInitialBalanceCheck] = useState(0);
  
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<any[]>([]);

  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const [showShopModal, setShowShopModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600);

  // 🔥 NOVO: MODAL DE LOGIN PARA VISITANTES 🔥
  const [showAuthModal, setShowAuthModal] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function loadRealData() {
      try {
        const phone = localStorage.getItem("labz_player_phone");
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };

        if (phone) {
            setPlayerPhone(phone);
            const pRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=*`, { headers });
            if (pRes.ok) {
                const pData = await pRes.json();
                if (pData && pData.length > 0) setBalance(pData[0].live_tokens || 0);
            }
        }

        const [mRes, cRes, medRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Media?price=eq.0&select=*`, { headers }) 
        ]);

        if (mRes.ok && cRes.ok) {
            const mData = await mRes.json();
            const cData = await cRes.json();
            const medData = medRes.ok ? await medRes.json() : [];

            const combinedData = mData.map((m: any) => {
                const config = cData.find((c: any) => c.model_id === m.id);
                const modelMedia = medData.filter((med: any) => med.model_id === m.id).map((med: any) => med.url);

                return {
                    id: m.id,
                    name: config?.model_name || m.slug,
                    slug: m.slug,
                    image: config?.profile_url || null,
                    bio: config?.bio || "Bem-vindo ao meu mundo exclusivo. Acompanhe minhas lives e conteúdos quentes!",
                    status: m.live_status || "offline",
                    price: config?.live_price || 3.10, 
                    publicPhotos: modelMedia
                };
            });
            
            setModels(combinedData);
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setInitialLoading(false);
      }
    }
    loadRealData();
  }, [supabaseUrl, supabaseKey]);

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.slug.toLowerCase().includes(search.toLowerCase()));
  
  const trendingModel = models.find(m => m.status === 'online' || m.status === 'vip') || models[0];

  // 🔥 INTERCEPTADOR DE AÇÕES (Exige Login) 🔥
  const requireAuth = (callback: () => void) => {
      if (!playerPhone) {
          setShowAuthModal(true);
      } else {
          callback();
      }
  };

  const handleJoinLive = (slug: string, status: string) => {
      requireAuth(() => router.push(`/live/${slug}`));
  };

  const openMiniProfile = (e: React.MouseEvent, model: any) => {
    e.stopPropagation();
    setSelectedModel(model);
    setIsFollowing(false); 
  };

  const handleLogout = () => {
    if(confirm("Deseja mesmo sair da sua conta?")) {
        localStorage.removeItem("labz_player_phone");
        localStorage.removeItem("labz_player_logged");
        setPlayerPhone(null);
        setBalance(0);
        router.refresh();
    }
  };

  const generatePix = async (amount: number) => {
    requireAuth(async () => {
        setGeneratingPix(true);
        setPixTimeLeft(600);
        try {
            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
            const pRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone!)}&select=id`, { headers });
            const pData = await pRes.json();
            const playerId = pData[0]?.id;

            if (!playerId) throw new Error("Jogador não encontrado no banco.");

            const response = await fetch('/api/checkout/hub', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, userId: playerId, type: 'live_tokens' }),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro API Pix");

            if (data.qr_code_base64 || data.qrCodeBase64) {
                setPixData({ 
                    qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, 
                    qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, 
                    value: amount
                });
                setInitialBalanceCheck(balance);
                setShowShopModal(false);
                setShowPixModal(true);
            }
        } catch (error: any) {
            alert(`Falha ao gerar PIX: ${error.message}`);
        } finally { 
            setGeneratingPix(false); 
        }
    });
  };

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (showPixModal && pixData && !paymentSuccess && playerPhone) {
          interval = setInterval(async () => {
              try {
                  const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
                  const res = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(playerPhone)}&select=live_tokens`, { headers });
                  const data = await res.json();
                  
                  const currentTokens = data[0]?.live_tokens || 0;
                  
                  if (currentTokens > initialBalanceCheck) {
                      setBalance(currentTokens);
                      clearInterval(interval); 
                      setPaymentSuccess(true);
                      setTimeout(() => { 
                          setShowPixModal(false); 
                          setPixData(null); 
                          setPaymentSuccess(false); 
                      }, 3000);
                  }
              } catch(e) {}
          }, 4000); 
      }
      return () => clearInterval(interval);
  }, [showPixModal, pixData, paymentSuccess, initialBalanceCheck, playerPhone, supabaseKey, supabaseUrl]);

  useEffect(() => {
    let pixTimer: NodeJS.Timeout;
    if (showPixModal && pixTimeLeft > 0 && !paymentSuccess) pixTimer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    else if (pixTimeLeft === 0) setShowPixModal(false);
    return () => clearInterval(pixTimer);
  }, [showPixModal, pixTimeLeft, paymentSuccess]);

  const handleCopyPix = () => {
      if (pixData?.qrCodeCopiaCola) { navigator.clipboard.writeText(pixData.qrCodeCopiaCola); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (initialLoading) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
              <Loader2 className="animate-spin text-[#00f0ff] mb-6" size={50} />
              <h2 className="text-xl font-black uppercase italic animate-pulse tracking-widest">Carregando Musas...</h2>
          </div>
      );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white pb-20 font-sans relative">
      
      {/* 🔥 MODAL DE ACESSO RESTRITO (LOGIN) 🔥 */}
      {showAuthModal && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#00f0ff]/30 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative text-center">
                  <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={20}/></button>
                  <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00f0ff]/30">
                      <Lock size={28} className="text-[#00f0ff]"/>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Acesso Restrito</h2>
                  <p className="text-xs text-white/60 mb-8 leading-relaxed">Você precisa fazer login para entrar nas lives, comprar créditos ou seguir musas.</p>
                  <button onClick={() => router.push('/')} className="w-full bg-[#00f0ff] hover:bg-[#00d0dd] text-black py-4 rounded-xl text-[11px] font-black uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all">
                      Fazer Login ou Cadastro
                  </button>
              </div>
          </div>
      )}

      {showShopModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><X size={24} /></button>
          <Coins size={40} className="text-[#00f0ff] mb-4" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Comprar LiveTokens</h2>
          <p className="text-white/60 text-xs font-bold mb-8">1 LiveToken = R$ 1,00. Adicione saldo exclusivo para Lives.</p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[ {name: "Básico", p: 30}, {name: "VIP", p: 50}, {name: "Premium", p: 100} ].map(pkg => (
              <button key={pkg.p} onClick={() => generatePix(pkg.p)} disabled={generatingPix} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-[#00f0ff]/50 transition-all disabled:opacity-50">
                <span className="text-white font-black uppercase text-sm">{pkg.name}</span>
                <span className="bg-[#00f0ff] text-black px-4 py-1.5 rounded-full font-black text-xs">{generatingPix ? <Loader2 size={12} className="animate-spin inline" /> : `${pkg.p} LT (R$ ${pkg.p})`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showPixModal && pixData && (
          <div className="fixed inset-0 z-[210] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-[#0a0a0a] border border-[#00f0ff]/30 p-8 sm:p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative text-center">
                  {!paymentSuccess && <button onClick={() => { setShowPixModal(false); setPixData(null); }} className="absolute top-6 right-6 text-white/30 hover:text-white"><X size={24}/></button>}
                  {paymentSuccess ? (
                      <div className="py-10 animate-in zoom-in duration-500"><div className="w-24 h-24 bg-[#00f0ff] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,240,255,0.6)]"><CheckCircle size={50} className="text-black"/></div><h2 className="text-3xl font-black uppercase italic text-[#00f0ff] mb-2">Pago!</h2><p className="text-xs text-white/60 uppercase font-black tracking-widest">{pixData.value} LiveTokens na Carteira.</p></div>
                  ) : (
                      <>
                          <h2 className="text-2xl font-black uppercase italic mb-2 text-[#00f0ff]">Comprar Tokens</h2>
                          <div className="bg-white p-4 rounded-[2rem] mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-6 flex items-center justify-center"><img src={pixData.qrCodeBase64.includes('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} className="w-full h-full object-contain rounded-xl" /></div>
                          <p className="text-3xl font-black text-white mb-6">R$ {pixData.value.toFixed(2)}</p>
                          <div className="mb-6 flex items-center justify-center gap-2 text-[#00f0ff] font-black font-mono text-xl animate-pulse">⏱ {Math.floor(pixTimeLeft/60)}:{(pixTimeLeft%60).toString().padStart(2,'0')}</div>
                          <button onClick={handleCopyPix} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black uppercase text-xs mb-4">{copied ? <CheckCircle size={18} className="text-[#00f0ff]" /> : <Copy size={18} />} {copied ? "Copiado!" : "Copiar Chave PIX"}</button>
                          <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 p-4 rounded-xl flex items-center justify-center gap-3"><Loader2 size={16} className="animate-spin text-[#00f0ff]" /><span className="text-[9px] text-[#00f0ff] uppercase font-black tracking-widest">Aguardando Pagamento...</span></div>
                      </>
                  )}
              </div>
          </div>
      )}

      {selectedModel && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModel(null)}></div>
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col shadow-2xl overflow-hidden z-10 animate-slideUp">
                
                <div className="h-48 relative bg-black border-b border-white/10">
                    <img src={selectedModel.image} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                    <button onClick={() => setSelectedModel(null)} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white/50 hover:text-white border border-white/10"><X size={18}/></button>
                    
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
                        <button onClick={() => requireAuth(() => setIsFollowing(!isFollowing))} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all shadow-lg ${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-[#ff0055] text-white shadow-[#ff0055]/40'}`}>
                            {isFollowing ? <><CheckCircle size={14}/> Seguindo</> : <><Bell size={14}/> Seguir Musa</>}
                        </button>
                    </div>

                    <p className="text-sm text-white/70 italic leading-relaxed mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 line-clamp-3">
                        "{selectedModel.bio}"
                    </p>

                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Fotos Públicas</h3>
                    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 mb-6">
                        {selectedModel.publicPhotos.map((photo: string, idx: number) => (
                            <div key={idx} className="w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-white/10">
                                <img src={photo} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        {selectedModel.publicPhotos.length === 0 && (
                           <p className="text-xs text-white/30 italic font-bold">Nenhuma foto pública gratuita.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button onClick={() => requireAuth(() => router.push(`/profile/${selectedModel.slug}`))} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all border border-white/10">
                            <Maximize2 size={14}/> Perfil Completo
                        </button>
                        <button onClick={() => handleJoinLive(selectedModel.slug, selectedModel.status)} className="flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00d0dd] text-black py-4 rounded-xl text-[10px] font-black uppercase transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                            <Sparkles size={14}/> Entrar na Live
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}


      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#00f0ff]" size={20} />
          <h1 className="text-xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 hidden sm:block">
            Labz <span className="text-[#00f0ff]">Live</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => requireAuth(() => router.push('/vitrine'))} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all">
            <Home size={14} className="text-white/70" />
            <span className="font-black text-[9px] uppercase text-white/70 tracking-widest hidden sm:block">Vitrine Principal</span>
          </button>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-inner cursor-pointer" onClick={() => requireAuth(() => setShowShopModal(true))}>
            <Wallet size={14} className="text-[#00f0ff]" />
            <span className="font-black text-[12px] text-[#00f0ff]">{balance.toFixed(2).replace('.', ',')} LT</span>
          </div>

          {playerPhone && (
            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-full transition-all" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        
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

        {trendingModel && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-[#ff0055]" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Em Alta Agora</h2>
          </div>
          <div onClick={(e) => openMiniProfile(e, trendingModel)} className="h-48 rounded-[2rem] bg-[#0a0a0a] border border-white/10 overflow-hidden relative flex items-center justify-between cursor-pointer hover:border-[#00f0ff]/50 transition-colors shadow-2xl group p-6 sm:p-8">
             <div className="absolute inset-0">
                <img src={trendingModel.image} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
             </div>
             <div className="relative z-10 flex flex-col items-start max-w-[70%]">
               <span className="bg-[#ff0055] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-2 shadow-[0_0_15px_rgba(255,0,85,0.5)]">
                 {trendingModel.status === 'vip' ? 'Em Show VIP' : 'Destaque'}
               </span>
               <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white drop-shadow-2xl">{trendingModel.name}</h3>
               <p className="text-white/70 font-medium text-[10px] sm:text-xs mt-1 line-clamp-2 italic">"{trendingModel.bio}"</p>
               <button className="mt-4 bg-[#00f0ff] text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-[0_0_20px_rgba(0,240,255,0.4)]">Ver Perfil</button>
             </div>
          </div>
        </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Câmeras</h2>
              <span className="text-[10px] text-white/40 font-bold uppercase">{filteredModels.length} Musas</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredModels.map((model) => (
              <div 
                key={model.id} 
                onClick={() => handleJoinLive(model.slug, model.status)}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer bg-[#0a0a0a] border border-white/10 hover:border-[#00f0ff]/50 transition-all duration-300 shadow-xl"
              >
                {model.image ? (
                    <img src={model.image} alt={model.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${model.status === 'offline' ? 'grayscale opacity-30' : 'opacity-80 group-hover:opacity-100'}`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <User size={40} className="text-white/20" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent pointer-events-none"></div>

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

                <div className="absolute top-3 right-3 z-20">
                  <button 
                    onClick={(e) => openMiniProfile(e, model)}
                    className="flex items-center gap-1.5 bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full transition-all shadow-lg"
                  >
                    <User size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Mini Perfil</span>
                  </button>
                </div>

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
