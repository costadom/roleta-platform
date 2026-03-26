"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, Lock, Play, ArrowLeft, Gamepad2, LayoutGrid, X, Video, Clock, CheckCircle, Heart, QrCode, Copy, User, CheckCircle2, Sparkles, MessageCircle, Radio
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
  const pricing = { 3: 70, 5: 110, 10: 150 };

  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  const [checkoutData, setCheckoutData] = useState<{ type: 'photo' | 'video', price: number, itemInfo: any } | null>(null);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string, qrCodeCopiaCola: string, txId: string } | null>(null);
  const [processingPix, setProcessingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); 

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
      const phone = localStorage.getItem("labz_player_phone");
      if (logged && phone) {
        const playerRes = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=id`, { headers }).then(r => r.json());
        if (playerRes && playerRes[0]) {
          currentPlayerId = playerRes[0].id;
          setPlayerId(currentPlayerId);
        }
      }

      const resMedia = await fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${modelData.id}&order=created_at.desc`, { headers }).then(r => r.json());
      setMedia(Array.isArray(resMedia) ? resMedia : []);

      if (logged) {
        let unlocked = [];
        if (currentPlayerId) {
          const resU = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=eq.${currentPlayerId}&select=media_id`, { headers });
          if (resU.ok) unlocked = await resU.json();
          else {
            const resU2 = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${encodeURIComponent(phone || '')}&select=media_id`, { headers });
            if (resU2.ok) unlocked = await resU2.json();
          }
        }
        setUnlockedIds(unlocked.map((u: any) => u.media_id));
      }
    } catch (e) { console.error("Erro", e); } finally { setLoading(false); }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pixData && !paymentSuccess && pixTimeLeft > 0) {
      timer = setInterval(() => setPixTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, paymentSuccess, pixTimeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const openCheckout = async (type: 'photo' | 'video', price: number, itemInfo: any) => {
    if (!playerId) return setShowAuth(true);
    setCheckoutData({ type, price, itemInfo });
    setPixData(null); setProcessingPix(true); setPaymentSuccess(false); setPixTimeLeft(600);
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
      const modelName = Array.isArray(model?.Configs) ? model.Configs[0]?.model_name : model?.Configs?.model_name || model?.slug;
      const phone = localStorage.getItem("labz_player_phone");

      await fetch(`${supabaseUrl}/rest/v1/AbandonedCarts`, {
        method: 'POST', headers,
        body: JSON.stringify({ player_phone: phone, model_name: `${modelName} (${type === 'photo' ? 'Foto' : 'Vídeo'})`, amount: price, status: 'pendente' })
      });

      let requestId = null;
      if (type === 'video') {
        const resReq = await fetch(`${supabaseUrl}/rest/v1/VideoRequests`, { method: 'POST', headers, body: JSON.stringify({ model_id: model.id, player_id: playerId, player_phone: phone, description: itemInfo.description, duration: itemInfo.duration, price: price, status: 'pendente' }) });
        const reqData = await resReq.json();
        requestId = reqData[0].id; itemInfo.requestId = requestId;
      }

      const res = await fetch('/api/checkout/hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: price, userId: playerId, type: type, modelId: model.id, mediaId: type === 'photo' ? itemInfo.id : null, requestId: requestId }) });
      const data = await res.json();
      if (data.qr_code_base64 || data.qrCodeBase64) {
        setPixData({ qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64, qrCodeCopiaCola: data.qr_code || data.qrCode || data.copy_paste, txId: data.id || data.transaction_id });
      } else { throw new Error("Falha no PIX"); }
    } catch (e) { alert("Falha na conexão."); setCheckoutData(null); } finally { setProcessingPix(false); }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutData && pixData && !paymentSuccess && playerId) {
      interval = setInterval(async () => {
        try {
          const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, 'Cache-Control': 'no-cache' };
          const phone = localStorage.getItem("labz_player_phone");
          if (checkoutData.type === 'photo') {
            const res = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${encodeURIComponent(phone || '')}&media_id=eq.${checkoutData.itemInfo.id}`, { headers }).then(r => r.json());
            if (res && res.length > 0) { 
                clearInterval(interval); 
                setPaymentSuccess(true);
                setTimeout(() => {
                  const itemInfo = checkoutData?.itemInfo;
                  setCheckoutData(null); setPaymentSuccess(false); loadProfile(true); 
                  setViewingMedia(itemInfo); setLiked(false);
                }, 2500);
            }
          } else if (checkoutData.type === 'video') {
            const res = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${checkoutData.itemInfo.requestId}&select=status`, { headers }).then(r => r.json());
            if (res && res[0]?.status === 'pago') { 
                clearInterval(interval); 
                setPaymentSuccess(true);
                setTimeout(() => {
                  setCheckoutData(null); setPaymentSuccess(false); loadProfile(true); 
                }, 2500);
            }
          }
        } catch (e) {}
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [checkoutData, pixData, paymentSuccess, playerId, supabaseUrl, supabaseKey]);

  const handleChatClick = () => {
    if (!isLoggedIn) return setShowAuth(true);
    router.push('/hub');
  };

  const handleJoinLive = () => {
    if (!isLoggedIn) return setShowAuth(true);
    router.push(`/live/${slug}`);
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /></div>;
  if (!model) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-center p-8">Musa não encontrada no Labz.</div>;

  const modelConfig = Array.isArray(model?.Configs) ? model.Configs[0] : model?.Configs;
  const isOnline = model.live_status === 'online' || model.live_status === 'vip';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative overflow-x-hidden">
      
      {/* 🔥 HEADER / HERO SECTION OTIMIZADO 🔥 */}
      <div className="relative w-full h-[60vh] sm:h-[55vh] flex flex-col justify-end bg-black">
        <div className="absolute inset-0 w-full h-full">
            <img src={modelConfig?.bg_url || modelConfig?.profile_url} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        </div>
        
        <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex flex-wrap gap-3 sm:gap-4 z-50">
            <button onClick={() => router.push('/vitrine')} className="p-3 sm:p-4 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={18}/></button>
            <button onClick={() => router.push('/vitrine')} className="px-4 sm:px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all"><LayoutGrid size={14}/> <span className="hidden sm:inline">Vitrine</span></button>
        </div>

        <div className="relative z-10 w-full p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 mt-auto pb-8">
          <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-[2.5rem] sm:rounded-[3rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.5)] shrink-0 bg-black mx-auto md:mx-0 relative">
            <img src={modelConfig?.profile_url} className="w-full h-full object-cover" />
            {isOnline && (
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-md border border-[#00f0ff]/50 px-2 py-1 rounded-full flex items-center shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                 <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse"></span>
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left w-full flex flex-col items-center md:items-start">
            <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl mb-2 sm:mb-3">{modelConfig?.model_name || model?.slug}</h1>
            <p className="text-white/80 text-xs sm:text-sm italic max-w-xl mb-6 leading-relaxed px-4 md:px-0 drop-shadow-md">{model?.bio || "Explore meus conteúdos privados e ganhe prêmios."}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full sm:w-auto">
                
                {/* 🔥 BOTÃO DE LIVE DINÂMICO 🔥 */}
                <button 
                    onClick={() => isOnline && handleJoinLive()} 
                    disabled={!isOnline}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-lg min-w-[140px] border ${
                        isOnline 
                        ? (model.live_status === 'vip' ? 'bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055] shadow-[0_0_20px_rgba(255,0,85,0.3)] animate-pulse hover:bg-[#ff0055] hover:text-white' : 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-pulse hover:bg-[#00f0ff] hover:text-black')
                        : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                    }`}
                >
                    <Radio size={16} className={isOnline ? "" : "opacity-50"}/> 
                    {model.live_status === 'online' ? 'Assistir Ao Vivo' : model.live_status === 'vip' ? 'Show VIP Ativo' : 'Offline'}
                </button>

                <button onClick={handleChatClick} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-2xl text-[9px] sm:text-[10px] font-black uppercase hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 min-w-[140px]">
                    <MessageCircle size={16} className="text-[#D946EF]"/> Chat Comigo
                </button>

                <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); router.push(`/game/${slug}`); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#D946EF] rounded-2xl text-[9px] sm:text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:scale-105 transition-all min-w-[120px]">
                    <Gamepad2 size={16}/> Roleta
                </button>
                
                {/* 🔥 BOTÃO DE RASPADINHA RESTAURADO 🔥 */}
                <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); router.push(`/game/${slug}/raspadinha`); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FFD700] to-[#e6be00] text-black rounded-2xl text-[9px] sm:text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:scale-105 transition-all min-w-[120px]">
                    <Sparkles size={16} fill="currentColor"/> Raspadinha
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8 mt-4 sm:mt-0">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 mb-8 sm:mb-12 flex flex-col md:flex-row gap-6 sm:gap-8 items-center shadow-2xl relative overflow-hidden">
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4 text-[#D946EF]"><Video size={20} fill="currentColor"/><h2 className="text-xl font-black uppercase italic">Vídeos Exclusivos</h2></div>
                <p className="text-white/60 text-sm italic mb-6 leading-relaxed">Peça um vídeo personalizado. Entrega garantida em 2 dias úteis.</p>
            </div>
            <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); setShowVideoModal(true); }} className="w-full md:w-auto bg-white text-black px-10 py-6 rounded-3xl font-black uppercase text-xs hover:bg-[#D946EF] hover:text-white transition-all shadow-lg">Encomendar Vídeo</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {media.map((item) => {
            const isUnlocked = item.price === 0 || unlockedIds.includes(item.id);
            return (
              <div key={item.id} className="flex flex-col gap-3 sm:gap-4 group">
                <div className="relative aspect-[3/4] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] cursor-pointer shadow-2xl"
                    onClick={() => { 
                        if(!isLoggedIn) return setShowAuth(true); 
                        if(!isUnlocked) { openCheckout('photo', item.price, item); }
                        else { setViewingMedia(item); setLiked(false); }
                    }}>
                    <img src={item.url} className={`w-full h-full object-cover transition-all duration-1000 ${!isUnlocked ? 'blur-2xl sm:blur-3xl brightness-50 scale-125' : 'group-hover:scale-110'}`} />
                    {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                            <Lock size={20} className="text-[#D946EF] mb-2 sm:mb-3"/><div className="bg-[#D946EF] px-4 sm:px-5 py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all">Liberar R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                    )}
                    {item.price === 0 && <div className="absolute top-4 left-4 bg-emerald-500 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">Livre</div>}
                </div>
                {item.caption && <p className="text-[10px] sm:text-xs leading-relaxed italic px-2 sm:px-4 text-white/70 text-center sm:text-left line-clamp-2">{item.caption}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 rounded-[3rem] sm:rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
                <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/20 hover:text-white"><X size={24}/></button>
                <h2 className="text-xl sm:text-2xl font-black uppercase italic mb-6">Seu Pedido <span className="text-[#D946EF]">VIP</span></h2>
                <div className="grid grid-cols-3 gap-2 mb-6 sm:mb-8">
                    {[3, 5, 10].map(d => (<button key={d} onClick={() => setSelectedDuration(d as any)} className={`py-3 sm:py-4 rounded-2xl border text-[9px] sm:text-[10px] font-black transition-all ${selectedDuration === d ? 'bg-[#D946EF] border-[#D946EF] text-white' : 'bg-black border-white/10 text-white/40'}`}>{d} MIN<br/>R$ {pricing[d as keyof typeof pricing].toFixed(2)}</button>))}
                </div>
                <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-5 sm:p-6 text-xs sm:text-sm text-white outline-none focus:border-[#D946EF] h-32 sm:h-40 resize-none mb-6 sm:mb-8 custom-scrollbar" placeholder="Descreva os detalhes da sua encomenda..."/>
                <button onClick={() => { if(videoDesc.length < 15) return alert("Descreva melhor seu pedido."); setShowVideoModal(false); openCheckout('video', pricing[selectedDuration], { duration: selectedDuration, description: videoDesc }); }} className="w-full bg-[#D946EF] text-white py-5 sm:py-6 rounded-2xl font-black uppercase text-[10px] sm:text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-[#f062ff] transition-all"><QrCode size={16}/> Ir para Pagamento</button>
            </div>
        </div>
      )}

      {/* CHECKOUT MODERNIZADO E BLINDADO */}
      {checkoutData && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-[#0a0a0a] border border-[#D946EF]/30 p-8 sm:p-10 rounded-[3.5rem] w-full max-w-md text-center relative shadow-2xl">
                {!paymentSuccess && <button onClick={() => setCheckoutData(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/30 hover:text-white transition-colors"><X size={24}/></button>}
                
                {paymentSuccess ? (
                    <div className="py-10 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={50} className="text-black"/></div>
                        <h2 className="text-3xl font-black uppercase italic text-emerald-500 mb-2">Pago!</h2>
                        <p className="text-xs text-white/60 uppercase font-black tracking-widest">{checkoutData.type === 'photo' ? 'Foto Desbloqueada.' : 'Pedido enviado.'}</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-black text-white uppercase italic mb-6">Pagar com PIX</h2>
                        
                        <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative">
                          {processingPix && !pixData ? (
                            <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-black font-black uppercase text-[10px]">
                              <Loader2 className="animate-spin text-[#D946EF] mb-2" size={30} />
                              Gerando PIX...
                            </div>
                          ) : pixData ? (
                            <img src={pixData.qrCodeBase64.includes('data:image') ? pixData.qrCodeBase64 : `data:image/png;base64,${pixData.qrCodeBase64}`} className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl" />
                          ) : null}
                        </div>

                        {pixData && (
                          <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-xl animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                              ⏱ {formatTime(pixTimeLeft)}
                          </div>
                        )}

                        {pixData && (
                          <button onClick={() => { 
                            navigator.clipboard.writeText(pixData.qrCodeCopiaCola); 
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mb-4">
                             {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copiar Código PIX"}
                          </button>
                        )}
                        
                        <div className="bg-[#D946EF]/10 border border-[#D946EF]/30 p-4 rounded-xl flex items-center justify-center gap-3">
                            <Loader2 size={16} className="animate-spin text-[#D946EF]" /> 
                            <span className="text-[9px] text-[#D946EF] uppercase font-black tracking-widest">Aguardando Confirmação Automática...</span>
                        </div>
                    </>
                )}
             </div>
          </div>
      )}

      {viewingMedia && (
          <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[210]"><X size={24}/></button>
             <div className="relative max-w-2xl w-full h-[60vh] sm:h-[70vh] flex items-center justify-center mb-6 sm:mb-8"><img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" /></div>
             <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
                <button onClick={() => setLiked(!liked)} className={`p-4 sm:p-5 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}><Heart size={24} fill={liked ? "currentColor" : "none"} /></button>
                <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{viewingMedia.caption}"</p>
             </div>
          </div>
      )}

      {showAuth && <AuthModal isOpen={true} onClose={() => setShowAuth(false)} />}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D946EF; }
      `}</style>
    </div>
  );
}
