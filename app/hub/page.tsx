"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Play, ArrowLeft, Camera, Gamepad2, X, Video, Clock, 
  Wallet, HelpCircle, Heart, User, Image as ImageIcon
} from "lucide-react";

export default function PlayerPersonalHub() {
  const router = useRouter();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);

  const [associations, setAssociations] = useState<any[]>([]); 
  const [videoOrders, setVideoOrders] = useState<any[]>([]);
  const [unlockedGallery, setUnlockedGallery] = useState<any[]>([]);

  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [liked, setLiked] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const CENTRAL_SUPORTE_WA = "5515996587248";

  useEffect(() => {
    async function loadData() {
      try {
        const logged = localStorage.getItem("labz_player_logged") === "true";
        const phone = localStorage.getItem("labz_player_phone");
        
        if (!logged || !phone) { router.push('/'); return; }
        setPlayerPhone(phone);

        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        // 1. Busca Plana dos Dados Essenciais
        const [playersRes, modelsRes, configsRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (!playersRes.ok) throw new Error("Falha na busca de Players");
        
        const playersData = await playersRes.json();
        const modelsData = await modelsRes.json();
        const configsData = await configsRes.json();

        // Helper para achar a modelo
        const getModelInfo = (modelId: string) => {
            const m = modelsData.find((x:any) => x.id === modelId);
            const c = configsData.find((x:any) => x.model_id === modelId);
            return { slug: m?.slug, model_name: c?.model_name, profile_url: c?.profile_url };
        };

        // Associações do jogador
        const mappedAssoc = playersData.map((p:any) => ({ ...p, modelInfo: getModelInfo(p.model_id) }));
        setAssociations(mappedAssoc);

        // ⚠️ ESPIÃO E TRAVA ANTI-ERRO 400
        // Pega os IDs, mas FILTRA qualquer coisa que seja nula, indefinida ou lixo.
        const validPlayerIds = playersData
            .map((p:any) => p.id)
            .filter((id:any) => id && id !== "undefined" && id !== "null" && typeof id === "string" && id.length > 10);
            
        console.log("🕵️ ESPIÃO HUB - IDs Válidos do Cliente:", validPlayerIds);

        if (validPlayerIds.length > 0) {
            const idsString = validPlayerIds.join(',');

            // 2. Busca Vídeos com IDs limpos
            const vRes = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?player_id=in.(${idsString})&select=*`, { headers });
            if (vRes.ok) {
                const vData = await vRes.json();
                const mappedVideos = vData.map((v:any) => ({ ...v, modelInfo: getModelInfo(v.model_id) }))
                                          .filter((v:any) => v.status !== 'pendente')
                                          .sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setVideoOrders(mappedVideos);
            } else {
                console.error("🕵️ ESPIÃO HUB - Erro 400 evitado nos Vídeos. Resposta real:", await vRes.text());
            }

            // 3. Busca Fotos Desbloqueadas com IDs limpos
            const uRes = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=in.(${idsString})&select=*`, { headers });
            if (uRes.ok) {
                const uData = await uRes.json();
                const mediaIds = uData.map((u:any) => u.media_id).filter((id:any) => id && id !== "undefined" && id !== "null");
                
                if (mediaIds.length > 0) {
                    const mIdsStr = mediaIds.join(',');
                    const mRes = await fetch(`${supabaseUrl}/rest/v1/Media?id=in.(${mIdsStr})&select=*`, { headers });
                    if (mRes.ok) {
                        const mData = await mRes.json();
                        const mappedGallery = uData.map((u:any) => {
                            const mediaItem = mData.find((m:any) => m.id === u.media_id);
                            if (!mediaItem) return null;
                            return { ...u, Media: { ...mediaItem, modelInfo: getModelInfo(mediaItem.model_id) } };
                        }).filter(Boolean).sort((a:any, b:any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());
                        setUnlockedGallery(mappedGallery);
                    }
                }
            } else {
                console.error("🕵️ ESPIÃO HUB - Erro 400 evitado nas Fotos. Resposta real:", await uRes.text());
            }
        } else {
            console.log("🕵️ ESPIÃO HUB - Jogador sem IDs válidos de UUID. Abortando buscas para evitar Erro 400.");
            setUnlockedGallery([]);
            setVideoOrders([]);
        }
      } catch (e) { console.error("🕵️ ESPIÃO HUB - Erro Crítico:", e); } finally { setInitialLoading(false); }
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
      
      <header className="fixed top-0 left-0 w-full h-20 bg-black/70 backdrop-blur-xl border-b border-white/5 z-[100] px-6 sm:px-10 flex items-center justify-between shadow-[0_10px_30px_rgba(217,70,239,0.1)]">
          <button onClick={() => router.push('/vitrine')} className="p-3 sm:p-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center">
              <h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter">MEU <span className="text-white">HUB VIP</span></h1>
              <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="px-4 py-2 sm:px-5 sm:py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-10 mt-28">
        
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={18}/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => {
                    const modelName = assoc.modelInfo?.model_name || assoc.modelInfo?.slug;
                    return (
                        <div key={assoc.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#D946EF]/30 transition-all min-h-[140px]">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center justify-center">
                                    {assoc.modelInfo?.profile_url ? <img src={assoc.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-[#D946EF]"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest mb-1 truncate">{modelName}</p>
                                    <h3 className="text-2xl font-black text-white tracking-tighter truncate">{assoc.credits} CR</h3>
                                </div>
                            </div>
                            <div className="flex gap-2 relative z-10 mt-auto pt-4 border-t border-white/5">
                                <button onClick={() => router.push(`/game/${assoc.modelInfo?.slug}`)} className="flex-1 bg-[#D946EF] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={14}/> Jogar</button>
                                <button onClick={() => router.push(`/profile/${assoc.modelInfo?.slug}`)} className="flex-1 bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub</button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-12 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada ainda. Vá para a Vitrine!</div>
                )}
            </div>
        </section>

        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Video size={18}/> Meus Vídeos Encomendados</h2>
            <div className="grid gap-6">
                {videoOrders.length > 0 ? videoOrders.map((req) => {
                    const modelName = req.modelInfo?.model_name || req.modelInfo?.slug;
                    return (
                    <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 shadow-xl relative group overflow-hidden hover:border-white/10 transition-all">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full border border-[#D946EF]/30 overflow-hidden shrink-0 hidden sm:flex items-center justify-center bg-white/5">
                                    {req.modelInfo?.profile_url ? <img src={req.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-white/30"/>}
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${req.status === 'pago' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : req.status === 'aceito' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : req.status === 'entregue' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {req.status === 'pago' ? 'Aguardando Musa' : req.status === 'aceito' ? 'Em Produção' : req.status === 'recusado' ? 'Recusado' : 'Entregue!'}
                                    </span>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Para: <span className="text-white">{modelName}</span> • {req.duration} Min • R$ {req.price?.toFixed(2)}</div>
                                </div>
                            </div>
                            <p className="text-sm italic text-white/70 leading-relaxed font-medium bg-black/40 p-4 rounded-2xl border border-white/5">"{req.description}"</p>
                        </div>
                        <div className="min-w-[220px] flex flex-col justify-center gap-3">
                            {req.status === 'entregue' && <a href={req.drive_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20 hover:bg-[#f062ff] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Play size={16} fill="currentColor"/> Acessar Vídeo</a>}
                            {req.status === 'recusado' && <button onClick={() => window.open(`https://wa.me/${CENTRAL_SUPORTE_WA}?text=${encodeURIComponent(`Oii suporte! Meu pedido de vídeo (#${req.id}) foi recusado pela musa. Solicito estorno.`)}`, '_blank')} className="w-full bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><HelpCircle size={14}/> Suporte</button>}
                            {req.status === 'aceito' && <div className="text-amber-400 text-[10px] font-black uppercase text-center py-4 border border-amber-500/20 rounded-xl bg-amber-500/5 flex items-center justify-center gap-2"><Clock size={16}/> Entrega em 48h</div>}
                            {req.status === 'pago' && <div className="text-blue-400 text-[10px] font-black uppercase text-center py-4 border border-blue-500/20 rounded-xl bg-blue-500/5 flex flex-col items-center justify-center gap-1"><div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Aguardando Musa</div></div>}
                        </div>
                    </div>
                )}) : <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem]">Nenhum vídeo encomendado.</div>}
            </div>
        </section>

        <section className="mb-12 animate-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Camera size={18}/> Minha Coleção VIP</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {unlockedGallery.length > 0 ? unlockedGallery.map((item: any) => {
                    const media = item.Media;
                    const modelName = media?.modelInfo?.model_name || media?.modelInfo?.slug;
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
                }) : <div className="py-20 text-center text-white/10 italic font-black uppercase tracking-widest border border-dashed border-white/5 rounded-[3rem] col-span-full">Sua coleção está vazia. Jogue a roleta ou desbloqueie no Hub!</div>}
            </div>
        </section>

      </main>

      {viewingMedia && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[210]"><X size={24}/></button>
             <div className="relative max-w-2xl w-full h-[60vh] sm:h-
