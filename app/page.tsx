"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, User, Key, Radio, Gamepad2, MessageCircle, Video, DollarSign, ShieldCheck, Heart } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function VitrinePage() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔥 NOVO: Estados para o fundo animado 🔥
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [currentBg, setCurrentBg] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        const logged = localStorage.getItem("labz_player_logged") === "true";
        setIsLoggedIn(logged);

        // BUSCA PLANA INTACTA: Busca Modelos e Configs separadamente (Nunca dá Erro 400)
        const [modelsRes, configsRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);
        
        if (modelsRes.ok && configsRes.ok) {
            const modelsData = await modelsRes.json();
            const configsData = await configsRes.json();

            // Junta as informações no código com segurança
            const activeModels = modelsData.filter((m: any) => {
                const config = configsData.find((c: any) => c.model_id === m.id);
                m.config = config; // Salva a config dentro da modelo
                return config && config.showcase_visible === true && config.model_name;
            });
            
            setModels(activeModels);

            // 🔥 NOVO: Extrai as fotos para o fundo animado (Slideshow) 🔥
            const extractedBgs = activeModels
                .map(m => m.config?.bg_url || m.config?.profile_url)
                .filter(Boolean); // Remove nulos
            
            // Embaralha as imagens para ficar dinâmico
            const shuffledBgs = extractedBgs.sort(() => 0.5 - Math.random());
            if (shuffledBgs.length > 0) {
                setBgImages(shuffledBgs);
            }
        }
      } catch (err) { 
          console.error("Falha ao buscar musas:", err); 
      } finally { 
          setInitialLoading(false); 
      }
    }
    fetchData();
  }, [supabaseUrl, supabaseKey]);

  // 🔥 NOVO: Lógica do carrossel de fundo 🔥
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % bgImages.length);
    }, 6000); // Troca a cada 6 segundos
    return () => clearInterval(interval);
  }, [bgImages]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Musas...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative pb-20 overflow-x-hidden">
      
      {/* 🔥 NOVO: FUNDO ANIMADO LIQUID GLASS 🔥 */}
      <div className="fixed inset-0 z-0 bg-black">
        {bgImages.map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${idx === currentBg ? 'opacity-30 scale-105' : 'opacity-0 scale-100'}`} 
            />
        ))}
        {/* Camada de Vidro/Degradê sobre as fotos */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/70 to-[#050505] backdrop-blur-[4px]"></div>
      </div>

      {/* CONTEÚDO PRINCIPAL (COM Z-INDEX PARA FICAR ACIMA DO FUNDO) */}
      <div className="relative z-10">
          <header className="fixed top-0 left-0 w-full h-20 bg-black/60 backdrop-blur-2xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-2xl">
              <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                <h1 className="text-xl font-black italic text-[#D946EF] tracking-tighter drop-shadow-md">SAVANAH <span className="text-white">LABZ</span></h1>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-widest -mt-1">Escolha sua Musa</p>
              </div>
              
              <div className="flex items-center gap-3">
                  <button onClick={() => router.push('/explore')} className="hidden sm:flex items-center gap-1.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-4 py-2.5 rounded-full hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                      <Radio size={14} className="animate-pulse" />
                      <span className="font-black text-[10px] uppercase tracking-widest">Lives Ao Vivo</span>
                  </button>

                  {!isLoggedIn ? (
                    <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#D946EF] hover:border-[#D946EF] transition-all shadow-xl">
                        <Key size={14}/> Login VIP
                    </button>
                  ) : (
                    <button onClick={() => router.push('/hub')} className="px-5 py-2.5 bg-[#D946EF] text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#f062ff] transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                        <User size={14}/> Meu Perfil
                    </button>
                  )}
              </div>
          </header>

          <div className="max-w-7xl mx-auto p-6 mt-28">
            <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-black uppercase italic text-white tracking-tighter drop-shadow-2xl">ESCOLHA SUA <span className="text-[#D946EF]">MUSA</span></h2>
                <p className="text-[#FFD700] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center justify-center gap-2 drop-shadow-md">
                    <Sparkles size={14}/> HUB PRIVADO E ROLETA VIP <Sparkles size={14}/>
                </p>
            </div>

            <div className="sm:hidden flex justify-center mb-10">
                <button onClick={() => router.push('/explore')} className="flex w-full items-center justify-center gap-2 bg-[#00f0ff]/10 backdrop-blur-md text-[#00f0ff] border border-[#00f0ff]/30 px-6 py-4 rounded-2xl hover:bg-[#00f0ff] hover:text-black transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <Radio size={18} className="animate-pulse" />
                    <span className="font-black text-xs uppercase tracking-widest">Acessar Câmeras Ao Vivo</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {models.length > 0 ? models.map((m) => {
                const isOnline = m.live_status === 'online' || m.live_status === 'vip';
                
                return (
                  <div key={m.id} className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl cursor-pointer" onClick={() => { if(!isLoggedIn) return setShowAuthModal(true); router.push(`/profile/${m.slug}`); }}>
                    
                    <img src={m.config?.profile_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                    
                    {isOnline && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
                          <span className={`w-2 h-2 rounded-full animate-pulse ${m.live_status === 'vip' ? 'bg-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,0.8)]' : 'bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]'}`}></span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${m.live_status === 'vip' ? 'text-[#ff0055]' : 'text-[#00f0ff]'}`}>{m.live_status === 'vip' ? 'VIP' : 'Ao Vivo'}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent flex flex-col p-6 sm:p-8 items-center justify-end text-center pointer-events-none">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl mb-1">{m.config?.model_name}</h3>
                        <p className="text-white/70 text-[11px] sm:text-xs italic mb-6 line-clamp-2 px-2 drop-shadow-md">{m.bio || "Acesse meu Hub para ver meus conteúdos e roleta."}</p>
                        
                        <button className="w-full flex items-center justify-center gap-3 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.4)] transition-all group-hover:scale-[1.03] pointer-events-auto" onClick={(e) => { e.stopPropagation(); if(!isLoggedIn) return setShowAuthModal(true); router.push(`/profile/${m.slug}`); }}>
                            <User size={16}/> Acessar Hub Privado
                        </button>
                    </div>
                  </div>
                );
              }) : (
                  <div className="py-24 text-center text-white/30 italic font-black uppercase tracking-widest border border-dashed border-white/10 bg-white/5 backdrop-blur-sm rounded-[3rem] col-span-full shadow-inner">
                      Nenhuma musa ativa na vitrine no momento.
                  </div>
              )}
            </div>

            {/* 🔥 NOVO: SEÇÃO DE VENDAS PARA CLIENTES 🔥 */}
            <div className="mt-24 mb-12">
                <div className="bg-gradient-to-br from-[#0a0a0a]/80 to-black/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D946EF]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-white mb-8 tracking-tighter relative z-10"><span className="text-[#D946EF]">Experiência</span> Premium</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative z-10">
                        <div className="flex flex-col items-start text-left">
                            <div className="w-12 h-12 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                                <Radio size={20} className="text-[#00f0ff]" />
                            </div>
                            <h3 className="font-black text-white uppercase text-sm mb-2">Câmeras Ao Vivo</h3>
                            <p className="text-xs text-white/50 leading-relaxed font-medium">Shows públicos ou convide sua musa favorita para uma sessão VIP trancada a sete chaves, cobrada por minuto.</p>
                        </div>

                        <div className="flex flex-col items-start text-left">
                            <div className="w-12 h-12 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                                <Gamepad2 size={20} className="text-[#FFD700]" />
                            </div>
                            <h3 className="font-black text-white uppercase text-sm mb-2">Jogos Picantes</h3>
                            <p className="text-xs text-white/50 leading-relaxed font-medium">Gire a Roleta ou raspe as cartelas premiadas para ganhar vídeos exclusivos, áudios e chamadas de vídeo na hora.</p>
                        </div>

                        <div className="flex flex-col items-start text-left">
                            <div className="w-12 h-12 bg-[#ff0055]/10 border border-[#ff0055]/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(255,0,85,0.2)]">
                                <MessageCircle size={20} className="text-[#ff0055]" />
                            </div>
                            <h3 className="font-black text-white uppercase text-sm mb-2">Chat Desbloqueado</h3>
                            <p className="text-xs text-white/50 leading-relaxed font-medium">Converse diretamente com as modelos. Compre mídias trancadas ou envie mimos e presentes virtuais pelo chat.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔥 NOVO: SEÇÃO CHAMANDO MODELOS 🔥 */}
            <div className="mb-12">
                <div className="bg-[#0a0a0a]/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-2 tracking-tighter">É Criadora de <span className="text-[#D946EF]">Conteúdo?</span></h2>
                        <p className="text-xs text-white/60 leading-relaxed font-medium max-w-lg mx-auto md:mx-0">
                            Junte-se à Savanah Labz. Monetize suas fotos, vídeos e lives em um ambiente seguro, livre de taxas abusivas. Receba 70% direto na sua conta através de transações automatizadas via PIX.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button onClick={() => router.push('/admin')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center justify-center gap-2">
                           <ShieldCheck size={16} /> Sou Modelo
                        </button>
                    </div>
                </div>
            </div>

          </div>

          <button 
              onClick={() => { if(!isLoggedIn) return setShowAuthModal(true); router.push('/hub'); }} 
              className="fixed bottom-6 right-6 z-[99] bg-[#D946EF] text-white p-4 rounded-full shadow-[0_10px_40px_rgba(217,70,239,0.5)] hover:scale-110 hover:bg-[#f062ff] transition-all flex items-center justify-center group border border-white/20"
          >
              <User size={24} />
              <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest">
                  Meu Perfil VIP
              </span>
          </button>

          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </div>
  );
}
