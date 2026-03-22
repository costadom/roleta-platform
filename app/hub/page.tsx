"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, Clock, 
  CheckCircle, Wallet, HelpCircle, Heart, User, ExternalLink, Image as ImageIcon
} from "lucide-react";

export default function PlayerPersonalHub() {
  const router = useRouter();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);

  // Estados dos Dados
  const [associations, setAssociations] = useState<any[]>([]); // Modelos + Saldos
  const [videoOrders, setVideoOrders] = useState<any[]>([]);
  const [unlockedGallery, setUnlockedGallery] = useState<any[]>([]);

  // Visualização de Foto em Tela Cheia
  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const CENTRAL_SUPORTE_WA = "5515996587248"; // Número para estorno

  useEffect(() => {
    async function loadData() {
      try {
        const logged = localStorage.getItem("labz_player_logged") === "true";
        const phone = localStorage.getItem("labz_player_phone");
        
        if (!logged || !phone) { 
            router.push('/'); 
            return; 
        }
        setPlayerPhone(phone);

        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        // 1. Busca TODAS as contas desse jogador (Uma para cada modelo que ele interagiu)
        const resPlayers = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${phone}&select=id,credits,model_id,nickname,Models(slug,Configs(model_name,profile_url))`, { headers }).then(r => r.json());
        
        const playerAccounts = Array.isArray(resPlayers) ? resPlayers : [];
        setAssociations(playerAccounts);

        const playerIds = playerAccounts.map(p => p.id);

        if (playerIds.length > 0) {
            const idsString = playerIds.join(',');

            // 2. Busca Fotos e Vídeos de todas as contas dele
            const [resGallery, resVideos] = await Promise.all([
              fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=in.(${idsString})&select=*,Media(url,caption,price,Models(slug,Configs(model_name,profile_url)))&order=created_at.desc`, { headers }).then(r => r.json()),
              fetch(`${supabaseUrl}/rest/v1/VideoRequests?player_id=in.(${idsString})&select=*,Models(slug,Configs(model_name,profile_url))&order=created_at.desc`, { headers }).then(r => r.json())
            ]);

            setUnlockedGallery(Array.isArray(resGallery) ? resGallery : []);
            
            // Filtramos os vídeos para não mostrar os 'pendentes' que o cliente não pagou o PIX
            const validVideos = Array.isArray(resVideos) ? resVideos.filter(v => v.status !== 'pendente') : [];
            setVideoOrders(validVideos);
        }

      } catch (e) { 
          console.error(e); 
      } finally { 
          setInitialLoading(false); 
      }
    }
    loadData();
  }, [router]);

  if (initialLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} />
      <h2 className="text-xl font-black uppercase italic tracking-tighter animate-pulse">Savanah Labz: Acessando seu Universo Privado...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      
      {/* HEADER DO HUB */}
      <header className="fixed top-0 left-0 w-full h-20 bg-black/70 backdrop-blur-xl border-b border-white/5 z-[100] px-6 sm:px-10 flex items-center justify-between shadow-[0_10px_30px_rgba(217,70,239,0.1)]">
          <button onClick={() => router.push('/vitrine')} className="p-3 sm:p-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center">
              <h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter">MEU <span className="text-white">HUB VIP</span></h1>
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="px-4 py-2 sm:px-5 sm:py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
      </header>

      {/* CONTEÚDO PRINCIPAL SCROLLABLE */}
      <main className="max-w-7xl mx-auto p-6 sm:p-10 mt-28">
        
        {/* SEÇÃO 1: MUSAS ASSOCIADAS & SALDOS */}
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={18}/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => {
                    const modelConfig = assoc.Models?.Configs?.[0];
                    const modelName = modelConfig?.model_name || assoc.Models?.slug;
                    return (
                        <div key={assoc.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col relative overflow-hidden group hover:border-[#D946EF]/30 transition-all">
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                                    {modelConfig?.profile_url ? <img src={modelConfig.profile_url} className="w-full h-full object-cover"/> : <User className="w-full h-full p-3 text-[#D946EF]"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest mb-1 truncate">{modelName}</p>
                                    <h3 className="text-2xl font-black text-white tracking-tighter truncate">{assoc.credits} CR</h3>
                                </div>
                            </div>
                            <div className="flex gap-2 relative z-10 mt-auto">
                                <button onClick={() => router.push(`/game/${assoc.Models?.slug}`)} className="flex-1 bg-[#D946EF] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={14}/> Jogar</button>
                                <button onClick={() => router.push(`/profile/${assoc.Models?.slug}`)} className="flex-1 bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub</button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-12 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada ainda. Vá para a Vitrine!</div>
                )}
            </div>
        </section>

        {/* SEÇÃO 2: MEUS PEDIDOS DE VÍDEO (ACOMPANHAMENTO) */}
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Video size={18}/> Meus Vídeos Encomendados</h2>
            <div className="grid gap-6">
                {videoOrders.length > 0 ? videoOrders.map((req) => {
                    const modelConfig = req.Models?.Configs?.[0];
                    const modelName = modelConfig?.model_name || req.Models?.slug;

                    return (
                    <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 shadow-xl relative group overflow-hidden hover:border-white/10 transition-all">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full border border-[#D946EF]/30 overflow-hidden shrink-0 hidden sm:block">
                                    {modelConfig?.profile_url ? <img src={modelConfig.profile_url} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-white/30"/>}
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${
                                        req.status === 'pago' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                                        req.status === 'aceito' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        req.status === 'entregue' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    }`}>
                                        {req.status === 'pago' ? 'Aguardando Musa' : req.status === 'aceito' ? 'Em Produção' : req.status === 'recusado' ? 'Recusado' : 'Entregue!'}
                                    </span>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Para: <span className="text-white">{modelName}</span> • {req.duration} Min • R$ {req.price.toFixed(2)}</div>
                                </div>
                            </div>
                            <p className="text-sm italic text-white/70 leading-relaxed font-medium bg-black/40 p-4 rounded-2xl border border-white/5">"{req.description}"</p>
                        </div>

                        <div className="min-w-[220px] flex flex-col justify-center gap-3">
                            {req.status === 'entregue' && (
                                <a href={req.drive_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20 hover:bg-[#f062ff] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Play size={16} fill="currentColor"/> Acessar Meu Vídeo</a>
                            )}
                            {req.status === 'recusado' && (
                                <button onClick={() => window.open(`https://wa.me/${CENTRAL_SUPORTE_WA}?text=${encodeURIComponent(`Oii suporte! Meu pedido de vídeo (#${req.id}) foi recusado pela musa. Solicito o estorno do valor de R$ ${req.price.toFixed(2)}.`)}`, '_blank')} className="w-full bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><HelpCircle size={14}/> Chamar Suporte</button>
                            )}
                            {req.status === 'aceito' && (
                                <div className="text-amber-400 text-[10px] font-black uppercase text-center py-4 border border-amber-500/20 rounded-xl bg-amber-500/5 flex items-center justify-center gap-2"><Clock size={16}/> Entrega em até 48h úteis</div>
                            )}
                            {req.status === 'pago' && (
                                <div className="text-blue-400 text-[10px] font-black uppercase text-center py-4 border border-blue-500/20 rounded-xl bg-blue-500/5 flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Aguardando Musa Aceitar</div>
                                    <span className="text-[8px] text-blue-400/50 mt-1">Se recusado, o valor é estornado.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}) : (
                    <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem]">Você ainda não encomendou nenhum vídeo.</div>
                )}
            </div>
        </section>

        {/* SEÇÃO 3: GALERIA DESBLOQUEADA */}
        <section className="mb-12 animate-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Camera size={18}/> Minha Coleção de Fotos VIP</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {unlockedGallery.length > 0 ? unlockedGallery.map((item: any) => {
                    const media = item.Media;
                    if (!media) return null;
                    const modelName = media.Models?.Configs?.[0]?.model_name || media.Models?.slug;
                    return (
                        <div key={item.id} onClick={() => { setViewingMedia(media); setLiked(false); }} className="flex flex-col gap-3 group cursor-pointer">
                            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-xl group-hover:border-[#D946EF]/50 transition-all">
                                <img src={media.url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <div className="bg-[#D946EF] p-3 rounded-full text-white shadow-lg"><ImageIcon size={20}/></div>
                                </div>
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase border border-white/10 flex items-center gap-1.5"><User size={10} className="text-[#D946EF]"/> {modelName}</div>
                            </div>
                            {media.caption && <p className="text-xs italic text-white/60 px-2 line-clamp-2 leading-relaxed">"{media.caption}"</p>}
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem] col-span-full">Sua coleção está vazia. Jogue a roleta ou desbloqueie no Hub!</div>
                )}
            </div>
        </section>

      </main>

      {/* MODAL FOTO EM TELA CHEIA */}
      {viewingMedia && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[210]"><X size={24}/></button>
             
             <div className="relative max-w-2xl w-full h-[60vh] sm:h-[75vh] flex items-center justify-center mb-6">
                <img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" />
             </div>
             
             <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
                <button onClick={() => setLiked(!liked)} className={`p-4 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                    <Heart size={28} fill={liked ? "currentColor" : "none"} />
                </button>
                <div>
                    <p className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-1">{viewingMedia.Models?.Configs?.[0]?.model_name || viewingMedia.Models?.slug}</p>
                    <p className="text-sm sm:text-base italic text-white/90 leading-relaxed font-medium">"{viewingMedia.caption}"</p>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
