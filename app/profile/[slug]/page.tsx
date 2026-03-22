"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, Play, Sparkles, ArrowLeft, Instagram, Camera, Gamepad2 } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function ModelProfile() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [model, setModel] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const logged = localStorage.getItem("labz_player_logged") === "true";
    const phone = localStorage.getItem("labz_player_phone");
    setIsLoggedIn(logged);

    async function loadProfile() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        
        // 1. Puxa dados da Modelo e Configurações
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers });
        const dataMod = await resMod.json();
        const modelInfo = dataMod[0];
        setModel(modelInfo);

        if (modelInfo) {
          // 2. Puxa as fotos/vídeos
          const resMedia = await fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelInfo.id}&order=created_at.desc`, { headers });
          setMedia(await resMedia.json());

          // 3. Se logado, puxa o que ele já desbloqueou
          if (logged && phone) {
            const resUnlocked = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${phone}&select=media_id`, { headers });
            const unlockedData = await resUnlocked.json();
            setUnlockedIds(unlockedData.map((u: any) => u.media_id));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF]" size={40}/><p className="text-[10px] font-black uppercase mt-4">Carregando Universo...</p></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      {/* HEADER / BIO */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${model?.Configs?.[0]?.bg_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        
        <button onClick={() => router.push('/vitrine')} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-end gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.5)] shrink-0">
            <img src={model?.Configs?.[0]?.profile_url} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left pb-2">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">{model?.Configs?.[0]?.model_name || model?.slug}</h1>
                <div className="bg-emerald-500 p-1 rounded-full"><Sparkles size={12} className="text-white" fill="currentColor"/></div>
            </div>
            <p className="text-white/60 text-sm italic max-w-md line-clamp-3 mb-4">{model?.bio || "Bem-vindo ao meu perfil exclusivo. Explore meus prêmios e conteúdos privados abaixo."}</p>
            <div className="flex gap-3">
                {model?.instagram && (
                    <a href={`https://instagram.com/${model.instagram}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase hover:bg-white/10 transition-all"><Instagram size={14}/> Instagram</a>
                )}
                <button onClick={() => router.push(`/game/${slug}`)} className="flex items-center gap-2 px-6 py-2 bg-[#D946EF] rounded-full text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20 hover:scale-105 transition-all"><Gamepad2 size={14}/> Jogar Roleta</button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE CONTEÚDO */}
      <div className="max-w-5xl mx-auto p-6 mt-4">
        <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
            <Camera size={18} className="text-[#D946EF]"/>
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Conteúdo Exclusivo</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => {
            const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
            const needsLogin = !isLoggedIn && item.price > 0;

            return (
              <div 
                key={item.id} 
                className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] group"
                onClick={() => {
                    if(!isLoggedIn) return setShowAuth(true);
                    if(!isUnlocked) alert("Ir para pagamento de R$ " + item.price);
                }}
              >
                {/* Imagem com Blur se não desbloqueada */}
                <img 
                    src={item.url} 
                    className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-2xl brightness-50 scale-110' : 'group-hover:scale-110'}`} 
                />

                {/* Ícone de Cadeado */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center mb-2 border border-white/10">
                        <Lock size={20} className="text-[#D946EF]"/>
                    </div>
                    {item.price > 0 && (
                        <div className="bg-[#D946EF] px-3 py-1 rounded-full shadow-lg">
                            <span className="text-[10px] font-black uppercase">R$ {item.price}</span>
                        </div>
                    )}
                  </div>
                )}

                {/* Tag de Grátis */}
                {item.price === 0 && !needsLogin && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg">Gratuito</div>
                )}
              </div>
            );
          })}
        </div>

        {media.length === 0 && (
            <div className="py-20 text-center opacity-20 italic">
                <p className="text-[10px] uppercase font-black">Nenhuma foto publicada ainda.</p>
            </div>
        )}
      </div>

      {showAuth && <AuthModal isOpen={true} onClose={() => setShowAuth(false)} />}
      
      <style jsx global>{` body { background-color: #050505; } `}</style>
    </div>
  );
}
