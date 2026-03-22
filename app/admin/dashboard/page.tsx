"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Gift, Settings, LogOut, DollarSign, Users, Sparkles, Loader2, Camera, Trash2, Plus, Lock, Globe, Instagram, Save, FileText, Type, Video, CheckCircle, XCircle } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelData, setModelData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "prizes" | "profile" | "media" | "videos">("stats");
  const [loading, setLoading] = useState(true);

  // Estados do Perfil
  const [bio, setBio] = useState("");
  const [insta, setInsta] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados de Mídia (Fotos)
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMediaPrice, setNewMediaPrice] = useState(0);
  const [newMediaCaption, setNewMediaCaption] = useState("");

  // Estados de Pedidos de Vídeo
  const [videoRequests, setVideoRequests] = useState<any[]>([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const mId = searchParams.get("model");
    if (!mId) { router.push("/admin"); return; }
    setModelId(mId);
    loadAll(mId);
  }, [searchParams]);

  async function loadAll(id: string) {
    try {
      const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };
      const [resMod, resMedia, resVideos] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${id}&select=*,Configs(*)`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${id}&order=created_at.desc`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${id}&order=created_at.desc`, { headers })
      ]);
      
      const mod = (await resMod.json())[0];
      setModelData(mod);
      setBio(mod.bio || "");
      setInsta(mod.instagram || "");
      setMediaList(await resMedia.json());
      setVideoRequests(await resVideos.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // --- FUNÇÕES DE PERFIL ---
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bio, instagram: insta })
      });
      alert("Hub atualizado!");
    } catch (e) { alert("Erro ao salvar."); } finally { setSavingProfile(false); }
  };

  // --- FUNÇÕES DE FOTOS (GALERIA) ---
  const handleUploadMedia = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande! Máximo 10MB.");
    if (newMediaPrice > 0 && newMediaPrice < 10) return alert("Preço mínimo R$ 10,00");
    if (newMediaCaption.length > 500) return alert("Legenda muito longa.");

    setUploading(true);
    try {
      const fileName = `${modelId}/img_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, {
        method: "POST",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": file.type },
        body: file
      });

      if (uploadRes.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
        await fetch(`${supabaseUrl}/rest/v1/Media`, {
          method: "POST",
          headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model_id: modelId, url: publicUrl, price: newMediaPrice, caption: newMediaCaption })
        });
        setNewMediaCaption("");
        setNewMediaPrice(0);
        loadAll(modelId!);
        alert("Foto publicada!");
      }
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Deletar foto?")) return;
    await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
    loadAll(modelId!);
  };

  // --- FUNÇÕES DE VÍDEO PERSONALIZADO ---
  const handleSetPrice = async (reqId: string, price: number) => {
    if (price < 15 || price > 200) return alert("O valor deve ser entre R$ 15 e R$ 200.");
    try {
      await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${reqId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ price, status: 'precificado' })
      });
      loadAll(modelId!);
      alert("Preço enviado ao cliente!");
    } catch (e) { alert("Erro ao precificar."); }
  };

  const handleDeliverVideo = async (reqId: string, link: string) => {
    if (!link.includes("http")) return alert("Insira um link válido do Drive/Mega.");
    try {
      await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${reqId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ drive_link: link, status: 'entregue' })
      });
      loadAll(modelId!);
      alert("Vídeo entregue com sucesso!");
    } catch (e) { alert("Erro na entrega."); }
  };

  const updateVideoStatus = async (reqId: string, status: string) => {
    await fetch(`${supabaseUrl}/rest/v1/VideoRequests?id=eq.${reqId}`, {
      method: "PATCH",
      headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    loadAll(modelId!);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D946EF] font-black animate-pulse">CARREGANDO...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 p-8 flex flex-col gap-2 shrink-0">
        <div className="mb-10 px-2">
            <h1 className="text-2xl font-black italic text-[#D946EF] tracking-tighter leading-none">LABZ <span className="text-white">ADMIN</span></h1>
            <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">Painel da Musa</p>
        </div>
        
        <nav className="space-y-1">
            <button onClick={() => setActiveTab("stats")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "stats" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><LayoutDashboard size={18}/> Dashboard</button>
            <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "profile" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Globe size={18}/> Meu Hub Público</button>
            <button onClick={() => setActiveTab("media")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "media" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Camera size={18}/> Minhas Fotos</button>
            <button onClick={() => setActiveTab("videos")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "videos" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/40 hover:bg-white/5"}`}><Video size={18}/> Pedidos de Vídeo</button>
            <button onClick={() => setActiveTab("prizes")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "prizes" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Gift size={18}/> Prêmios Roleta</button>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-5 py-4 text-red-500/40 hover:text-red-500 transition-all text-[10px] font-black uppercase"><LogOut size={18}/> Sair</button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {/* ABA: PERFIL */}
        {activeTab === "profile" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-10 tracking-tighter">Configurar <span className="text-[#D946EF]">Meu Hub</span></h2>
            <div className="space-y-8 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] mb-3 block ml-2">Biografia</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-40 resize-none transition-all" placeholder="Frase de impacto..."/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] mb-3 block ml-2">Instagram (@)</label>
                <input type="text" value={insta} onChange={e => setInsta(e.target.value)} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-sm outline-none focus:border-[#D946EF]" placeholder="@sua_musa"/>
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">
                {savingProfile ? <Loader2 className="animate-spin" size={18}/> : "Salvar Alterações"}
              </button>
            </div>
          </div>
        )}

        {/* ABA: GALERIA FOTOS */}
        {activeTab === "media" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Minha <span className="text-[#D946EF]">Galeria</span></h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">As fotos pagas são protegidas com Blur automaticamente</p>

            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] mb-12 shadow-2xl">
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <label className="text-[10px] font-black uppercase text-[#D946EF]">Legenda (Máx 500)</label>
                            <span className="text-[9px] text-white/20 font-bold">{newMediaCaption.length}/500</span>
                        </div>
                        <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-32 resize-none" placeholder="O que tem na foto? 🔥"/>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <label className="text-[10px] font-black uppercase text-white/40 mb-3 block ml-2">Preço (0 = Grátis | Mín R$ 10)</label>
                            <input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-white font-black text-2xl outline-none focus:border-[#D946EF]"/>
                        </div>
                        <label className="w-full bg-[#D946EF] text-white py-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-black uppercase text-[10px] shadow-xl mt-6">
                            {uploading ? <Loader2 className="animate-spin" size={18}/> : <><Camera size={20}/> Publicar Foto</>}
                            <input type="file" hidden accept="image/*" onChange={handleUploadMedia} disabled={uploading}/>
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mediaList.map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black">
                        <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all"/>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 text-center">
                            <button onClick={() => deleteMedia(item.id)} className="p-3 bg-red-500 rounded-full text-white"><Trash2 size={18}/></button>
                        </div>
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#D946EF]'}`}>
                            {item.price === 0 ? 'Grátis' : `R$ ${item.price}`}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* ABA: PEDIDOS DE VÍDEO */}
        {activeTab === "videos" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Pedidos de <span className="text-[#D946EF]">Vídeos</span></h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Encomendas personalizadas dos seus fãs</p>

            <div className="grid gap-6">
                {videoRequests.length > 0 ? videoRequests.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative overflow-hidden">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                                    req.status === 'solicitado' ? 'bg-amber-500 text-black' : 
                                    req.status === 'precificado' ? 'bg-blue-500 text-white' :
                                    req.status === 'pago' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                                }`}>
                                    {req.status}
                                </span>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{req.player_name} ({req.player_phone})</span>
                            </div>
                            <p className="text-sm text-white/80 italic font-medium leading-relaxed">"{req.description}"</p>
                        </div>

                        <div className="flex flex-col gap-4 min-w-[240px] bg-black/40 p-6 rounded-3xl border border-white/5">
                            {req.status === 'solicitado' && (
                                <>
                                    <div>
                                        <label className="text-[8px] font-black text-white/30 uppercase ml-2 mb-1 block">Sua Proposta (R$ 15 - 200)</label>
                                        <input type="number" placeholder="Valor R$" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-black text-sm outline-none focus:border-[#D946EF]" 
                                          onKeyDown={(e:any) => e.key === 'Enter' && handleSetPrice(req.id, Number(e.target.value))}
                                        />
                                    </div>
                                    <button onClick={() => updateVideoStatus(req.id, 'recusado')} className="text-[9px] font-black uppercase text-red-500/50 hover:text-red-500">Recusar</button>
                                </>
                            )}
                            {req.status === 'pago' && (
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-2"><CheckCircle size={12}/> Pagamento Confirmado!</p>
                                    <input type="text" placeholder="Link do Drive com o vídeo" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-xs outline-none focus:border-emerald-500"
                                      onKeyDown={(e:any) => e.key === 'Enter' && handleDeliverVideo(req.id, e.target.value)}
                                    />
                                    <p className="text-[8px] text-white/20 uppercase font-bold text-center">Cole o link e aperte Enter</p>
                                </div>
                            )}
                            {req.status === 'entregue' && (
                                <div className="text-center py-2">
                                    <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl border border-emerald-500/20 mb-2">
                                        <p className="text-[9px] font-black uppercase">Vídeo Entregue!</p>
                                    </div>
                                    <p className="text-[9px] text-white/30 break-all font-mono italic">{req.drive_link}</p>
                                </div>
                            )}
                            {req.status === 'precificado' && (
                                <div className="text-center py-4">
                                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Aguardando Cliente</p>
                                    <p className="text-xl font-black">R$ {req.price}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] text-white/10 italic">Nenhum pedido recebido.</div>
                )}
            </div>
          </div>
        )}

        {/* OUTRAS ABAS MANTIDAS */}
        {activeTab === "stats" && modelData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-xl">
                    <p className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">Saldo Atual</p>
                    <h3 className="text-4xl font-black italic text-[#D946EF]">R$ {Number(modelData.balance || 0).toFixed(2)}</h3>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default function ModelDashboard() {
  return <Suspense fallback={null}><DashboardContent /></Suspense>;
}
