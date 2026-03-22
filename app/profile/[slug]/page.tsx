"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, Play, Sparkles, ArrowLeft, Instagram, Camera, Gamepad2, LayoutGrid, X, Send } from "lucide-react";
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

  // Estados do Pedido de Vídeo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoDesc, setVideoDesc] = useState("");
  const [requesting, setRequesting] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const logged = localStorage.getItem("labz_player_logged") === "true";
    const phone = localStorage.getItem("labz_player_phone");
    setIsLoggedIn(logged);

    async function loadProfile() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers });
        const modelInfo = (await resMod.json())[0];
        setModel(modelInfo);

        if (modelInfo) {
          const resMedia = await fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelInfo.id}&order=created_at.desc`, { headers });
          setMedia(await resMedia.json());

          if (logged && phone) {
            const resUnlocked = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${phone}&select=media_id`, { headers });
            const unlockedData = await resUnlocked.json();
            setUnlockedIds(unlockedData.map((u: any) => u.media_id));
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    loadProfile();
  }, [slug]);

  const handleRequestVideo = async () => {
    if (!isLoggedIn) { setShowAuth(true); return; }
    if (videoDesc.length < 15) return alert("Por favor, descreva melhor seu pedido (mínimo 15 caracteres).");

    setRequesting(true);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
      await fetch(`${supabaseUrl}/rest/v1/VideoRequests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model_id: model.id,
          player_phone: localStorage.getItem("labz_player_phone"),
          player_name: "Cliente VIP",
          description: videoDesc,
          status: 'solicitado'
        })
      });
      alert("Seu pedido foi enviado! Fique de olho no seu painel para ver o valor definido pela musa.");
      setShowVideoModal(false);
      setVideoDesc("");
    } catch (e) { alert("Erro ao enviar pedido."); } finally { setRequesting(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF]" size={40}/><p className="text-[10px] font-black uppercase mt-4 tracking-[0.3em]">Carregando Universo...</p></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      
      {/* HEADER NAVEGAÇÃO */}
      <div className="relative w-full h-[55vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${model?.Configs?.[0]?.bg_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        
        <div className="absolute top-8 left-8 flex gap-4 z-50">
            <button onClick={() => router.back()} className="p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 hover:bg-[#D946EF] transition-all text-white"><ArrowLeft size={20}/></button>
            <button onClick={() => router.push('/vitrine')} className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:bg-white/10 transition-all text-white text-[10px] font-black uppercase flex items-center gap-2 tracking-widest"><LayoutGrid size={16}/> Explorar Musas</button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col md:flex-row items-end gap-8">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-[3rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.4)] shrink-0 bg-black">
            <img src={model?.Configs?.[0]?.profile_url} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left pb-4">
            <div className="flex items-center gap-4 mb-4">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl">{model?.Configs?.[0]?.model_name || model?.slug}</h1>
                <div className="bg-emerald-500 p-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"><Sparkles size={14} className="text-white" fill="currentColor"/></div>
            </div>
            <p className="text-white/70 text-base italic max-w-xl mb-6 leading-relaxed">{model?.bio || "Bem-vindo ao meu mundo privado. Confira meus conteúdos exclusivos abaixo."}</p>
            <div className="flex flex-wrap gap-4">
                <button onClick={() => setShowVideoModal(true)} className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-[#D946EF] hover:text-white transition-all"><Video size={16} fill="currentColor"/> Pedir Vídeo</button>
                <button onClick={() => router.push(`/game/${slug}`)} className="flex items-center gap-3 px-8 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:scale-105 transition-all"><Gamepad2 size={18}/> Jogar Roleta</button>
                {model?.instagram && (
                    <a href={`https://instagram.com/${model.instagram.replace('@','')}`} target="_blank" className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"><Instagram size={18}/></a>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* GALERIA */}
      <div className="max-w-7xl mx-auto p-8 mt-6">
        <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
            <Camera size={22} className="text-[#D946EF]"/>
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">Conteúdo Privado</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {media.map((item) => {
            const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
            return (
              <div key={item.id} className="flex flex-col gap-4 group animate-in fade-in zoom-in duration-500">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-2xl"
                    onClick={() => { if(!isLoggedIn) return setShowAuth(true); if(!isUnlocked) alert("Pagamento R$ " + item.price); }}>
                    <img src={item.url} className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-3xl brightness-50 scale-125' : 'group-hover:scale-110'}`} />
                    {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/20">
                            <div className="w-14 h-14 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-2xl"><Lock size={24} className="text-[#D946EF]"/></div>
                            <div className="bg-[#D946EF] px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-[0_10px_20px_rgba(217,70,239,0.4)]">Liberar R$ {item.price}</div>
                        </div>
                    )}
                    {item.price === 0 && <div className="absolute top-5 left-5 bg-emerald-500 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">Livre</div>}
                </div>
                {item.caption && (
                    <p className={`text-xs leading-relaxed italic px-4 transition-all duration-500 ${!isUnlocked ? 'text-white/10 blur-[1px]' : 'text-white/60'}`}>{item.caption}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL PEDIDO VÍDEO */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(217,70,239,0.2)] relative">
                <button onClick={() => setShowVideoModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"><X size={28}/></button>
                <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">Vídeo <span className="text-[#D946EF]">Sob Medida</span></h2>
                <p className="text-[10px] text-white/40 font-bold uppercase mb-8 tracking-widest leading-relaxed">Conte detalhadamente o que você quer ver. A musa definirá o valor (R$ 15 - R$ 200).</p>
                <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-[#D946EF] h-48 resize-none mb-8 transition-all" placeholder="Ex: Quero um vídeo especial com aquela lingerie preta..."/>
                <button onClick={handleRequestVideo} disabled={requesting} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-[#f062ff] transition-all">
                    {requesting ? <Loader2 className="animate-spin" size={20}/> : <><Send size={18}/> Enviar Solicitação</>}
                </button>
            </div>
        </div>
      )}

      {showAuth && <AuthModal isOpen={true} onClose={() => setShowAuth(false)} />}
      <style jsx global>{` body { background-color: #050505; } `}</style>
    </div>
  );
}
