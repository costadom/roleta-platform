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
  const CENTRAL_WA = "5515996587248";

  useEffect(() => {
    async function loadData() {
      try {
        const logged = localStorage.getItem("labz_player_logged") === "true";
        const phone = localStorage.getItem("labz_player_phone");
        if (!logged || !phone) { router.push('/'); return; }
        setPlayerPhone(phone);

        const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Cache-Control": "no-cache" };
        
        const [pRes, mRes, cRes] = await Promise.all([
            fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${encodeURIComponent(phone)}&select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Models?select=*`, { headers }),
            fetch(`${supabaseUrl}/rest/v1/Configs?select=*`, { headers })
        ]);

        if (!pRes.ok) return;
        const pData = await pRes.json();
        const mData = await mRes.json();
        const cData = await cRes.json();

        const getInfo = (mId: string) => {
            const m = mData.find((x:any) => x.id === mId);
            const c = cData.find((x:any) => x.model_id === mId);
            return { slug: m?.slug, model_name: c?.model_name, profile_url: c?.profile_url };
        };

        setAssociations(pData.map((p:any) => ({ ...p, modelInfo: getInfo(p.model_id) })));

        // IDs para busca (Blindagem contra Nulos)
        const ids = pData.map((p:any) => p.id).filter((id:any) => id && id.length > 20);

        // BUSCA HÍBRIDA (Tenta por ID, se der 400, tenta por Telefone)
        let vData = [];
        if (ids.length > 0) {
            const vRes = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?player_id=in.(${ids.join(',')})&select=*`, { headers });
            if (vRes.ok) vData = await vRes.json();
            else {
                const vRes2 = await fetch(`${supabaseUrl}/rest/v1/VideoRequests?player_phone=eq.${encodeURIComponent(phone)}&select=*`, { headers });
                if (vRes2.ok) vData = await vRes2.json();
            }
        }
        setVideoOrders(vData.map((v:any) => ({ ...v, modelInfo: getInfo(v.model_id) })).filter((v:any) => v.status !== 'pendente'));

        let uData = [];
        if (ids.length > 0) {
            const uRes = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_id=in.(${ids.join(',')})&select=*`, { headers });
            if (uRes.ok) uData = await uRes.json();
            else {
                const uRes2 = await fetch(`${supabaseUrl}/rest/v1/UnlockedMedia?player_phone=eq.${encodeURIComponent(phone)}&select=*`, { headers });
                if (uRes2.ok) uData = await uRes2.json();
            }

            const mIds = uData.map((u:any) => u.media_id).filter(Boolean);
            if (mIds.length > 0) {
                const mediaRes = await fetch(`${supabaseUrl}/rest/v1/Media?id=in.(${mIds.join(',')})&select=*`, { headers });
                const mediaData = await mediaRes.json();
                setUnlockedGallery(uData.map((u:any) => {
                    const mObj = mediaData.find((mx:any) => mx.id === u.media_id);
                    return mObj ? { ...u, Media: { ...mObj, modelInfo: getInfo(mObj.model_id) } } : null;
                }).filter(Boolean));
            }
        }
      } catch (e) { console.error("Erro Hub:", e); } finally { setInitialLoading(false); }
    }
    loadData();
  }, [router]);

  if (initialLoading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-[#D946EF] mb-6" size={50} /><h2 className="text-xl font-black uppercase italic animate-pulse">Acessando Universo Privado...</h2></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
      <header className="fixed top-0 left-0 w-full h-20 bg-black/70 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between shadow-xl">
          <button onClick={() => router.push('/vitrine')} className="p-3 bg-white/5 rounded-full border border-white/10 text-white hover:bg-[#D946EF] transition-all"><ArrowLeft size={20}/></button>
          <div className="text-center"><h1 className="text-lg sm:text-xl font-black uppercase italic text-[#D946EF] tracking-tighter">MEU <span className="text-white">HUB VIP</span></h1><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">{playerPhone}</p></div>
          <button onClick={() => { localStorage.clear(); window.location.replace('/'); }} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full text-[10px] font-black uppercase shadow-xl hover:bg-red-500 hover:text-white transition-all">Sair</button>
      </header>

      <main className="max-w-7xl mx-auto p-6 sm:p-10 mt-28">
        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Wallet size={18}/> Minhas Musas & Saldos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {associations.length > 0 ? associations.map((assoc: any) => (
                    <div key={assoc.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-[#D946EF]/30 transition-all min-h-[140px]">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-black border-2 border-[#D946EF] overflow-hidden shrink-0 flex items-center justify-center bg-black/50">
                                {assoc.modelInfo?.profile_url ? <img src={assoc.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-8 h-8 text-[#D946EF]"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest mb-1 truncate">{assoc.modelInfo?.model_name || 'Musa'}</p>
                                <h3 className="text-2xl font-black text-white tracking-tighter truncate">{assoc.credits} CR</h3>
                            </div>
                        </div>
                        <div className="flex gap-2 relative z-10 pt-4 border-t border-white/5">
                            <button onClick={() => router.push(`/game/${assoc.modelInfo?.slug}`)} className="flex-1 bg-[#D946EF] text-white py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-[1.03] transition-all flex items-center justify-center gap-1.5"><Gamepad2 size={14}/> Jogar</button>
                            <button onClick={() => router.push(`/profile/${assoc.modelInfo?.slug}`)} className="flex-1 bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"><User size={14}/> Hub</button>
                        </div>
                    </div>
                )) : <div className="py-12 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-3xl col-span-full">Nenhuma musa associada ainda.</div>}
            </div>
        </section>

        <section className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Video size={18}/> Meus Vídeos Encomendados</h2>
            <div className="grid gap-6">
                {videoOrders.length > 0 ? videoOrders.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-6 shadow-xl relative overflow-hidden hover:border-white/10 transition-all">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full border border-[#D946EF]/30 overflow-hidden shrink-0 hidden sm:flex items-center justify-center bg-white/5">
                                    {req.modelInfo?.profile_url ? <img src={req.modelInfo.profile_url} className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-white/30"/>}
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase mb-1 inline-block ${req.status === 'pago' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : req.status === 'aceito' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : req.status === 'entregue' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {req.status === 'pago' ? 'Aguardando Musa' : req.status === 'aceito' ? 'Em Produção' : req.status === 'recusado' ? 'Recusado' : 'Entregue!'}
                                    </span>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Para: <span className="text-white">{req.modelInfo?.model_name}</span> • {req.duration} Min • R$ {req.price?.toFixed(2)}</div>
                                </div>
                            </div>
                            <p className="text-sm italic text-white/70 leading-relaxed font-medium bg-black/40 p-4 rounded-2xl border border-white/5">"{req.description}"</p>
                        </div>
                        <div className="min-w-[220px] flex flex-col justify-center gap-3">
                            {req.status === 'entregue' ? <a href={req.drive_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#D946EF] text-white py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#D946EF]/20 hover:bg-[#f062ff] transition-all flex items-center justify-center gap-2"><Play size={16} fill="currentColor"/> Acessar Vídeo</a> : <div className="text-blue-400 text-[10px] font-black uppercase text-center py-4 border border-blue-500/20 rounded-xl bg-blue-500/5 flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Aguardando Entrega</div>}
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-[3rem]">Nenhum vídeo encomendado.</div>}
            </div>
        </section>

        <section className="mb-12 animate-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-lg font-black uppercase text-white/40 mb-6 flex items-center gap-3 tracking-widest"><Camera size={18}/> Minha Coleção VIP</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {unlockedGallery.length > 0 ? unlockedGallery.map((item: any) => (
                    <div key={item.id} onClick={() => { setViewingMedia(item.Media); setLiked(false); }} className="flex flex-col gap-3 group cursor-pointer">
                        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-xl group-hover:border-[#D946EF]/50 transition-all">
                            <img src={item.Media?.url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 border border-white/10"><User size={10} className="text-[#D946EF]"/> {item.Media?.modelInfo?.model_name}</div>
                        </div>
                    </div>
                )) : <div className="py-20 text-center text-white/10 italic font-black uppercase border border-dashed border-white/5 rounded-[3rem] col-span-full">Sua galeria está vazia.</div>}
            </div>
        </section>
      </main>

      {viewingMedia && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setViewingMedia(null)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full transition-colors z-[210]"><X size={24}/></button>
             <div className="relative max-w-2xl w-full h-[60vh] sm:h-[75vh] flex items-center justify-center mb-6"><img src={viewingMedia.url} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl" /></div>
             <div className="flex flex-col items-center gap-4 text-center max-w-md w-full">
                <button onClick={() => setLiked(!liked)} className={`p-4 rounded-full transition-all shadow-2xl ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}><Heart size={28} fill={liked ? "currentColor" : "none"} /></button>
                <div><p className="text-[10px] font-black text-[#D946EF] uppercase tracking-widest mb-1">{viewingMedia.modelInfo?.model_name}</p><p className="text-sm sm:text-base italic text-white/90 leading-relaxed font-medium">"{viewingMedia.caption}"</p></div>
             </div>
          </div>
      )}
    </div>
  );
}
