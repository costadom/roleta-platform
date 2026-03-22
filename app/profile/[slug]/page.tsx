"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, Lock, Play, Sparkles, ArrowLeft, Camera, Gamepad2, 
  LayoutGrid, X, Send, Video, Clock, CheckCircle, Info, Heart, QrCode, Copy
} from "lucide-react";
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
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoDesc, setVideoDesc] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<3 | 5 | 10>(3);
  const pricing = { 3: 70, 5: 110, 10: 160 };

  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  // CHECKOUT REAL (API PushinPay)
  const [checkoutData, setCheckoutData] = useState<{ type: 'photo' | 'video', price: number, itemInfo: any } | null>(null);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string, qrCodeCopiaCola: string, txId: string } | null>(null);
  const [processingPix, setProcessingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const logged = localStorage.getItem("labz_player_logged") === "true";
    setIsLoggedIn(logged);
    loadProfile(logged);
  }, [slug]);

  async function loadProfile(logged: boolean) {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=*,Configs(*)`, { headers }).then(r => r.json());
      if (!resMod || !resMod[0]) return setLoading(false);
      const modelData = resMod[0];
      setModel(modelData);

      let currentPlayerId = null;
      if (logged) {
          const phone = localStorage.getItem("labz_player_phone");
          const playerRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${phone}&select=id`, { headers }).then(r => r.json());
          if (playerRes && playerRes[0]) {
              currentPlayerId = playerRes[0].id;
              setPlayerId(currentPlayerId);
          }
      }

      const [resMedia, resUnlocked] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelData.id}&order=created_at.desc`, { headers }).then(r => r.json()),
        (logged && currentPlayerId) ? fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=eq.${currentPlayerId}&select=media_id`, { headers }).then(r => r.json()) : []
      ]);

      setMedia(Array.isArray(resMedia) ? resMedia : []);
      setUnlockedIds(Array.isArray(resUnlocked) ? resUnlocked.map((u: any) => u.media_id) : []);

    } catch (e) { console.error("Erro", e); } finally { setLoading(false); }
  }

  const handleProceedToVideoCheckout = () => {
    if (videoDesc.length < 15) return alert("Por favor, descreva melhor seu pedido.");
    setShowVideoModal(false);
    openCheckout('video', pricing[selectedDuration], { duration: selectedDuration, description: videoDesc });
  };

  // --- GERA O PIX REAL ATRAVÉS DA NOVA API DO HUB ---
  const openCheckout = async (type: 'photo' | 'video', price: number, itemInfo: any) => {
    if (!playerId) return alert("Você precisa estar logado e com cadastro válido.");
    
    setCheckoutData({ type, price, itemInfo });
    setPixData(null);
    setProcessingPix(true);
    setPaymentSuccess(false);
    
    try {
        let requestId = null;

        // Se for vídeo, criamos a solicitação como PENDENTE no banco primeiro.
        if (type === 'video') {
            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
            const resReq = await fetch(`${supabaseUrl}/rest/v1/VideoRequests`, {
                method: 'POST', headers,
                body: JSON.stringify({ model_id: model.id, player_id: playerId, description: itemInfo.description, duration: itemInfo.duration, price: price, status: 'pendente' })
            });
            const reqData = await resReq.json();
            requestId = reqData[0].id;
            itemInfo.requestId = requestId;
        }

        const res = await fetch('/api/checkout/hub', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: price, userId: playerId, type: type, modelId: model.id, mediaId: type === 'photo' ? itemInfo.id : null, requestId: requestId })
        });

        const data = await res.json();

        if (data.qr_code_base64 || data.qrCodeBase64) {
            setPixData({ qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, txId: data.id || data.transaction_id });
        } else {
            throw new Error("PushinPay negou o QR Code.");
        }
    } catch (e: any) {
        alert("Falha na comunicação com o Banco Central.");
        setCheckoutData(null);
    } finally {
        setProcessingPix(false);
    }
  };

  // --- POLLING: FICA OLHANDO O BANCO PRA VER SE O WEBHOOK CONFIRMOU ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutData && pixData && !paymentSuccess && playerId) {
        interval = setInterval(async () => {
            const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
            
            if (checkoutData.type === 'photo') {
                const res = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=eq.${playerId}&media_id=eq.${checkoutData.itemInfo.id}`, { headers }).then(r => r.json());
                if (res && res.length > 0) { clearInterval(interval); handlePaymentApproved(); }
            } else if (checkoutData.type === 'video') {
                const res = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${checkoutData.itemInfo.requestId}&select=status`, { headers }).then(r => r.json());
                if (res && res[0]?.status === 'pago') { clearInterval(interval); handlePaymentApproved(); }
            }
        }, 3000); // Checa a cada 3 segundos
    }
    return () => clearInterval(interval);
  }, [checkoutData, pixData, paymentSuccess, playerId]);

  const handlePaymentApproved = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
        const itemInfo = checkoutData?.itemInfo;
        const type = checkoutData?.type;
        setCheckoutData(null);
        setPaymentSuccess(false);
        loadProfile(true); // Tira o Blur da foto
        
        // Abre a foto tela cheia NA HORA
        if (type === 'photo') {
            setViewingMedia(itemInfo);
            setLiked(false);
        } else if (type === 'video') {
            setVideoDesc("");
        }
    }, 2500); // Mostra tela de sucesso por 2.5s e já abre
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Carregando Universo...</h2></div>;
  if (!model) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase">Musa não encontrada.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      
      {/* HEADER DA MUSA */}
      <div className="relative w-full h-[55vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${model?.Configs?.[0]?.bg_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute top-8 left-8 flex gap-4 z-50">
            <button onClick={() => router.push('/vitrine')} className="p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
            <button onClick={() => router.push('/vitrine')} className="px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white text-[10px] font-black uppercase flex items-center gap-2"><LayoutGrid size={16}/> Vitrine</button>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col md:flex-row items-end gap-8">
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-[3rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.4)] shrink-0 bg-black">
            <img src={model?.Configs?.[0]?.profile_url} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left pb-4">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl mb-4">{model?.Configs?.[0]?.model_name || model?.slug}</h1>
            <p className="text-white/70 text-base italic max-w-xl mb-6 leading-relaxed">{model?.bio || "Explore meus conteúdos privados."}</p>
            <button onClick={() => router.push(`/game/${slug}`)} className="flex items-center gap-3 px-8 py-4 bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:scale-105 transition-all"><Gamepad2 size={18}/> Jogar Roleta</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* CARD VÍDEOS */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 mb-12 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-[#D946EF]"><Video size={20} fill="currentColor"/><h2 className="text-xl font-black uppercase italic">Vídeos Exclusivos</h2></div>
                <p className="text-white/60 text-sm italic mb-6">Peça um vídeo personalizado e descreva exatamente o que deseja ver. Entrega garantida em 2 dias úteis após a aprovação ou seu dinheiro de volta via suporte.</p>
            </div>
            <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); setShowVideoModal(true); }} className="w-full md:w-auto bg-white text-black px-10 py-6 rounded-3xl font-black uppercase text-xs hover:bg-[#D946EF] hover:text-white transition-all shadow-xl">Encomendar Vídeo</button>
        </div>

        {/* GALERIA DE FOTOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {media.map((item) => {
            const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
            return (
              <div key={item.id} className="flex flex-col gap-4 group">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-2xl"
                    onClick={() => { 
                        if(!isLoggedIn) return setShowAuth(true); 
                        if(!isUnlocked) { openCheckout('photo', item.price, item); }
                        else { setViewingMedia(item); setLiked(false); }
                    }}>
                    <img src={item.url} className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-3xl brightness-50 scale-125' : 'group-hover:scale-110'}`} />
                    {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <Lock size={24} className="text-[#D946EF] mb-2"/>
                            <div className="bg-[#D946EF] px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all">Liberar R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                    )}
                    {item.price === 0 && <div className="absolute top-5 left-5 bg-emerald-500 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">Livre</div>}
                </div>
                {/* Legenda visível abaixo da foto */}
                {item.caption && <p className="text-xs leading-relaxed italic px-4 text-white/70">{item.caption}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL FAZER PEDIDO DE VÍDEO */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
                <button onClick={() => setShowVideoModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white"><X size={28}/></button>
                <h2 className="text-2xl font-black uppercase italic mb-6">Seu Pedido <span className="text-[#D946EF]">VIP</span></h2>
                <div className="grid grid-cols-3 gap-2 mb-8">
                    {[3, 5, 10].map(d => (
                        <button key={d} onClick={() => setSelectedDuration(d as any)} className={`py-4 rounded-2xl border text-[10px] font-black transition-all ${selectedDuration === d ? 'bg-[#D946EF] border-[#D946EF] text-white shadow-lg' : 'bg-black border-white/10 text-white/40 hover:bg-white/5'}`}>
                            {d} MIN<br/><span className="text-[8px] opacity-70">R$ {pricing[d as keyof typeof pricing].toFixed(2)}</span>
                        </button>
                    ))}
                </div>
                <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-[#D946EF] h-40 resize-none mb-8" placeholder="Descreva todos os detalhes da sua encomenda..."/>
                <button onClick={handleProceedToVideoCheckout} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-[#f062ff] transition-all active:scale-95">
                    <QrCode size={18}/> Ir para Pagamento
                </button>
            </div>
        </div>
      )}

      {/* TELA DE CHECKOUT PUSHINPAY (COM WEBHOOK REAL E POLLING) */}
      {checkoutData && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-10 rounded-[3.5rem] w-full max-w-md text-center relative shadow-[0_0_50px_rgba(217,70,239,0.2)]">
                {!paymentSuccess && <button onClick={() => setCheckoutData(null)} className="absolute top-8 right-8 text-white/20 hover:text-white"><X size={24}/></button>}
                
                {paymentSuccess ? (
                    <div className="py-10 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                            <CheckCircle size={50} className="text-black"/>
                        </div>
                        <h2 className="text-3xl font-black uppercase italic text-emerald-500 mb-2">Pago!</h2>
                        <p className="text-xs text-white/60 uppercase font-black tracking-widest">{checkoutData.type === 'photo' ? 'Foto Desbloqueada.' : 'Pedido enviado para a musa.'}</p>
                    </div>
                ) : (
                    <>
                        <QrCode size={50} className="text-[#D946EF] mx-auto mb-6" />
                        <h2 className="text-2xl font-black uppercase italic mb-2">Pague com PIX</h2>
                        <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-8">O conteúdo será liberado na hora.</p>
                        
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8 flex flex-col items-center">
                            <div className="text-4xl font-black text-white mb-2 tracking-tighter">R$ {checkoutData.price.toFixed(2).replace('.', ',')}</div>
                            <p className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest">{checkoutData.type === 'photo' ? 'Desbloqueio de Foto VIP' : 'Vídeo Exclusivo VIP'}</p>
                        </div>

                        {processingPix && !pixData ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="animate-spin text-[#D946EF] mb-4" size={40}/>
                                <span className="text-[10px] font-black uppercase text-[#D946EF] tracking-widest animate-pulse">Gerando PIX via Banco Central...</span>
                            </div>
                        ) : pixData ? (
                            <div className="animate-in zoom-in duration-500">
                                <div className="w-56 h-56 bg-white mx-auto rounded-[2rem] flex items-center justify-center p-3 shadow-2xl mb-6">
                                    <img src={pixData.qrCodeBase64.includes('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} className="w-full h-full rounded-xl" />
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(pixData.qrCodeCopiaCola); alert("Código Copia e Cola copiado!"); }} className="w-full bg-white/10 text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-[#D946EF] transition-all flex items-center justify-center gap-3">
                                    <Copy size={16}/> Copiar PIX Copia e Cola
                                </button>
                                <div className="mt-8 flex items-center justify-center gap-2 text-emerald-500">
                                    <Loader2 className="animate-spin" size={14}/>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Aguardando Pagamento do Banco...</span>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
             </div>
          </div>
      )}

      {/* TELA CHEIA: FOTOS GRÁTIS OU COMPRADAS */}
      {viewingMedia && (
          <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors"><X size={24}/></button>
             <div className="relative max-w-2xl w-full h-[70vh] flex items-center justify-center mb-8">
                <img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" />
             </div>
             <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
                <button onClick={() => setLiked(!liked)} className={`p-5 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                    <Heart size={28} fill={liked ? "currentColor" : "none"} />
                </button>
                <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{viewingMedia.caption}"</p>
             </div>
          </div>
      )}

      {showAuth && <AuthModal isOpen={true} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
