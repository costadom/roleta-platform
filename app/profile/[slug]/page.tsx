"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, Lock, Play, ArrowLeft, Gamepad2, LayoutGrid, X, Video, Clock, CheckCircle, Heart, QrCode, Copy, User, CheckCircle2
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

  const [checkoutData, setCheckoutData] = useState<{ type: 'photo' | 'video', price: number, itemInfo: any } | null>(null);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string, qrCodeCopiaCola: string, txId: string } | null>(null);
  const [processingPix, setProcessingPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); // 10 Minutos

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

  // Cronômetro do Pix
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
    if (!playerId) return alert("Você precisa estar logado.");
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
            if (res && res.length > 0) { clearInterval(interval); handlePaymentApproved(); }
          } else if (checkoutData.type === 'video') {
            const res = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${checkoutData.itemInfo.requestId}&select=status`, { headers }).then(r => r.json());
            if (res && res[0]?.status === 'pago') { clearInterval(interval); handlePaymentApproved(); }
          }
        } catch (e) {}
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [checkoutData, pixData, paymentSuccess, playerId]);

  const handlePaymentApproved = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      const itemInfo = checkoutData?.itemInfo; const type = checkoutData?.type;
      setCheckoutData(null); setPaymentSuccess(false); loadProfile(true); 
      if (type === 'photo') { setViewingMedia(itemInfo); setLiked(false); }
    }, 2500); 
  };

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /></div>;
  if (!model) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-center p-8">Musa não encontrada no Labz.</div>;

  const modelConfig = Array.isArray(model?.Configs) ? model.Configs[0] : model?.Configs;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      <div className="relative w-full h-[55vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url(${modelConfig?.bg_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
        <div className="absolute top-8 left-8 flex flex-wrap gap-3 sm:gap-4 z-50">
            <button onClick={() => router.push('/vitrine')} className="p-4 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
            <button onClick={() => router.push('/vitrine')} className="px-5 sm:px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/10 transition-all"><LayoutGrid size={16}/> <span className="hidden sm:inline">Vitrine</span></button>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 flex flex-col md:flex-row items-end gap-6 sm:gap-8">
          <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-[3rem] border-4 border-[#D946EF] overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.4)] shrink-0 bg-black">
            <img src={modelConfig?.profile_url} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left pb-2 sm:pb-4">
            <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl mb-3 sm:mb-4">{modelConfig?.model_name || model?.slug}</h1>
            <p className="text-white/70 text-sm sm:text-base italic max-w-xl mb-6 leading-relaxed">{model?.bio || "Explore meus conteúdos privados e ganhe prêmios."}</p>
            <button onClick={() => router.push(`/game/${slug}`)} className="flex items-center justify-center gap-3 px-8 py-4 w-full sm:w-auto bg-[#D946EF] rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:scale-105 transition-all"><Gamepad2 size={18}/> Jogar Roleta VIP</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 mb-12 flex flex-col md:flex-row gap-6 sm:gap-8 items-center shadow-2xl relative overflow-hidden">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 text-[#D946EF]"><Video size={20} fill="currentColor"/><h2 className="text-xl font-black uppercase italic">Vídeos Exclusivos</h2></div>
                <p className="text-white/60 text-sm italic mb-6 leading-relaxed">Peça um vídeo personalizado. Entrega garantida em 2 dias úteis.</p>
            </div>
            <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); setShowVideoModal(true); }} className="w-full md:w-auto bg-white text-black px-10 py-6 rounded-3xl font-black uppercase text-xs hover:bg-[#D946EF] transition-all">Encomendar Vídeo</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
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
                            <Lock size={24} className="text-[#D946EF] mb-2"/><div className="bg-[#D946EF] px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all">Liberar R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                    )}
                    {item.price === 0 && <div className="absolute top-5 left-5 bg-emerald-500 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg">Livre</div>}
                </div>
                {item.caption && <p className="text-xs leading-relaxed italic px-4 text-white/70">{item.caption}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {showVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl">
            <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
                <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/20 hover:text-white"><X size={28}/></button>
                <h2 className="text-2xl font-black uppercase italic mb-6">Seu Pedido <span className="text-[#D946EF]">VIP</span></h2>
                <div className="grid grid-cols-3 gap-2 mb-8">
                    {[3, 5, 10].map(d => (<button key={d} onClick={() => setSelectedDuration(d as any)} className={`py-4 rounded-2xl border text-[10px] font-black transition-all ${selectedDuration === d ? 'bg-[#D946EF] border-[#D946EF] text-white' : 'bg-black border-white/10 text-white/40'}`}>{d} MIN<br/>R$ {pricing[d as keyof typeof pricing].toFixed(2)}</button>))}
                </div>
                <textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-[#D946EF] h-40 resize-none mb-8 custom-scrollbar" placeholder="Descreva os detalhes da sua encomenda..."/>
                <button onClick={() => { if(videoDesc.length < 15) return alert("Descreva melhor seu pedido."); setShowVideoModal(false); openCheckout('video', pricing[selectedDuration], { duration: selectedDuration, description: videoDesc }); }} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-[#f062ff] transition-all"><QrCode size={18}/> Ir para Pagamento</button>
            </div>
        </div>
      )}

      {/* CHECKOUT MODERNIZADO COM URGÊNCIA E INSTRUÇÕES */}
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

                        {/* CRONÔMETRO DE URGÊNCIA */}
                        {pixData && (
                          <div className="mb-6 flex items-center justify-center gap-2 text-[#FFD700] font-black font-mono text-xl animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                             ⏱ {formatTime(pixTimeLeft)}
                          </div>
                        )}

                        <div className="text-left bg-white/5 border border-white/10 p-5 rounded-2xl mb-6">
                            <p className="text-[9px] text-[#D946EF] font-black uppercase mb-2">Instruções:</p>
                            <p className="text-[10px] text-white/70 font-bold leading-relaxed italic">1. Abra o app do seu banco.<br/>2. Escolha "Pagar com QR Code".<br/>3. Escaneie a imagem acima.<br/>4. O conteúdo libera automaticamente!</p>
                        </div>

                        {pixData && (
                          <button onClick={() => { 
                            navigator.clipboard.writeText(pixData.qrCodeCopiaCola); 
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                             {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>} {copied ? "Código Copiado!" : "Copia e Cola"}
                          </button>
                        )}
                        
                        <p className="mt-4 text-[8px] text-white/30 uppercase font-black animate-pulse flex items-center justify-center gap-2">
                           <Loader2 size={10} className="animate-spin" /> Aguardando confirmação do banco...
                        </p>
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
                <button onClick={() => setLiked(!liked)} className={`p-4 sm:p-5 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}><Heart size={24} fill={liked ? "currentColor" : "none"} /></button>
                <p className="text-sm italic text-white/80 leading-relaxed font-medium">"{viewingMedia.caption}"</p>
             </div>
          </div>
      )}

      <button onClick={() => { if(!isLoggedIn) return setShowAuth(true); router.push('/hub'); }} className="fixed bottom-6 right-6 z-[999] bg-[#D946EF] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center group border border-white/20"><User size={24} /><span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs tracking-widest">Meu Perfil VIP</span></button>

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
