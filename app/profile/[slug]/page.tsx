"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Play, Sparkles, ArrowLeft, Camera, Gamepad2, LayoutGrid, X, Send, Video, Clock, Info } from "lucide-react";
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

  // Pedidos de Vídeo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoDesc, setVideoDesc] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<3 | 5 | 10>(3);
  const [requesting, setRequesting] = useState(false);

  const pricing = { 3: 70, 5: 110, 10: 160 };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const logged = localStorage.getItem("labz_player_logged") === "true";
    setIsLoggedIn(logged);
    async function loadProfile() {
      try {
        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
        const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers }).then(r => r.json());
        if (!resMod[0]) return setLoading(false);
        setModel(resMod[0]);
        const [resMedia, resUnlocked] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${resMod[0].id}&order=created_at.desc`, { headers }).then(r => r.json()),
          logged ? fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${localStorage.getItem("labz_player_phone")}&select=media_id`, { headers }).then(r => r.json()) : []
        ]);
        setMedia(resMedia);
        setUnlockedIds(resUnlocked.map((u: any) => u.media_id));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    loadProfile();
  }, [slug]);

  const handleRequestVideo = async () => {
    if (!isLoggedIn) return setShowAuth(true);
    if (videoDesc.length < 15) return alert("Descreva melhor seu pedido.");
    // Aqui no futuro entra o CHECKOUT PIX. Por enquanto, criamos o registro como 'pago' para teste.
    setRequesting(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/VideoRequests`, {
        method: 'POST',
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            model_id: model.id, 
            player_phone: localStorage.getItem("labz_player_phone"), 
            player_name: "Cliente VIP", 
            description: videoDesc, 
            duration: selectedDuration,
            price: pricing[selectedDuration],
            status: 'pago' // Simulação: Já entra como pago após o checkout
        })
      });
      alert("Pagamento Confirmado! A musa tem 2 dias para aceitar e entregar seu vídeo.");
      setShowVideoModal(false); setVideoDesc("");
    } catch (e) { alert("Erro."); } finally { setRequesting(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D946EF] text-4xl font-black italic animate-pulse">SAVANAH...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      
      {/* HEADER */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${model?.Configs?.[0]?.bg_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute top-8 left-8 flex gap-4 z-50">
            <button onClick={() => router.push('/vitrine')} className="p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white"><ArrowLeft size={20}/></button>
            <button onClick={() => router.push('/vitrine')} className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white text-[10px] font-black uppercase flex items-center gap-2"><LayoutGrid size={16}/> Vitrine</button>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col md:flex-row items-end gap-8">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-[3rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.4)] shrink-0 bg-black">
            <img src={model?.Configs?.[0]?.profile_url} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left pb-4">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl mb-4">{model?.Configs?.[0]?.model_name || model?.slug}</h1>
            <p className="text-white/70 text-base italic max-w-xl mb-6">{model?.bio || "Bem-vindo ao meu hub privado."}</p>
            <button onClick={() => router.push(`/game/${slug}`)} className="flex items-center gap-3 px-8 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.3)]"><Gamepad2 size={18}/> Jogar Roleta</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        
        {/* CARD INFORMATIVO VÍDEOS */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 mb-12 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Video size={120}/></div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-[#D946EF]">
                    <Video size={20} fill="currentColor"/>
                    <h2 className="text-xl font-black uppercase italic">Vídeos Exclusivos sob encomenda</h2>
                </div>
                <p className="text-white/60 text-sm leading-relaxed italic mb-6">
                    Você pode pedir um vídeo personalizado só pra você! Descreva o que você quer ver e a musa entregará em até **2 dias úteis**. Caso ela não aceite seu pedido, você recebe seu estorno na hora pelo suporte.
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Clock size={14} className="text-[#D946EF]"/>
                        <span className="text-[10px] font-black uppercase">Entrega em 2 Dias</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500"/>
                        <span className="text-[10px] font-black uppercase">Garantia de Satisfação</span>
                    </div>
                </div>
            </div>
            <button onClick={() => setShowVideoModal(true)} className="w-full md:w-auto bg-white text-black px-10 py-6 rounded-3xl font-black uppercase text-xs hover:bg-[#D946EF] hover:text-white transition-all shadow-xl">
                Encomendar Agora
            </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {media.map((item) => {
            const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
            return (
              <div key={item.id} className="flex flex-col gap-4">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] cursor-pointer"
                    onClick={() => { if(!isLoggedIn) return setShowAuth(true); if(!isUnlocked) alert("Pagamento de Foto R$ " + item.price); }}>
                    <img src={item.url} className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-3xl brightness-50' : ''}`} />
                    {!isUnlocked && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"><Lock size={24} className="text-[#D946EF] mb-2"/><div className="bg-[#D946EF] px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-xl">Liberar R$ {item.price}</div></div>}
                </div>
                {item.caption && <p className="text-xs italic px-4 text-white/60">{item.caption}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL PEDIDO VÍDEO ATUALIZADO */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
                <button onClick={() => setShowVideoModal(false)} className="absolute top-8 right-8 text-white/20"><X size={28}/></button>
                <h2 className="text-2xl font-black uppercase italic mb-6">Seu Pedido <span className="text-[#D946EF]">VIP</span></h2>
                
                <div className="space-y-3 mb-8">
                    <p className="text-[10px] font-black uppercase text-white/30 ml-2">Escolha a duração:</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 10].map(d => (
                            <button key={d} onClick={() => setSelectedDuration(d as any)} className={`py-4 rounded-2xl border text-[10px] font-black transition-all ${selectedDuration === d ? 'bg-[#D946EF] border-[#D946EF] text-white shadow-lg' : 'bg-black border-white/10 text-white/40'}`}>
                                {d} MIN<br/><span className="text-[8px] opacity-60">R$ {pricing[d as keyof typeof pricing]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-[#D946EF] h-40 resize-none mb-8" placeholder="Ex: Quero um vídeo seu de lingerie vermelha falando meu nome..."/>
                
                <button onClick={handleRequestVideo} disabled={requesting} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3">
                    {requesting ? <Loader2 className="animate-spin" size={20}/> : <Send size={18}/>} Confirmar e Pagar R$ {pricing[selectedDuration]}
                </button>
            </div>
        </div>
      )}

      {showAuth && <AuthModal isOpen={true} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
