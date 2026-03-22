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

  const [bio, setBio] = useState("");
  const [insta, setInsta] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMediaPrice, setNewMediaPrice] = useState(0);
  const [newMediaCaption, setNewMediaCaption] = useState("");
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
      
      // Busca segura: se uma tabela falhar, o código continua
      const [resMod, resMedia, resVideos] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${id}&select=*,Configs(*)`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${id}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`${supabaseUrl}/rest/v1/VideoRequests?model_id=eq.${id}&order=created_at.desc`, { headers }).then(r => r.json()).catch(() => [])
      ]);
      
      const mod = resMod[0];
      if (mod) {
        setModelData(mod);
        setBio(mod.bio || "");
        setInsta(mod.instagram || "");
      }
      setMediaList(Array.isArray(resMedia) ? resMedia : []);
      setVideoRequests(Array.isArray(resVideos) ? resVideos : []);
    } catch (e) { 
        console.error("Erro ao carregar dados:", e); 
    } finally { 
        setLoading(false); 
    }
  }

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

  const handleUploadMedia = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande! Máximo 10MB.");
    if (newMediaPrice > 0 && newMediaPrice < 10) return alert("Preço mínimo R$ 10,00");

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
        alert("Publicado!");
      }
    } catch (e) { alert("Erro no upload."); } finally { setUploading(false); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D946EF] font-black italic animate-pulse tracking-tighter text-2xl">SAVANAH LABZ...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      <div className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 p-8 flex flex-col gap-2 shrink-0">
        <div className="mb-10 px-2"><h1 className="text-2xl font-black italic text-[#D946EF]">LABZ <span className="text-white">ADMIN</span></h1></div>
        <nav className="space-y-1">
            <button onClick={() => setActiveTab("stats")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "stats" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><LayoutDashboard size={18}/> Dashboard</button>
            <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "profile" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Globe size={18}/> Meu Hub Público</button>
            <button onClick={() => setActiveTab("media")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "media" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Camera size={18}/> Minhas Fotos</button>
            <button onClick={() => setActiveTab("videos")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "videos" ? "bg-[#D946EF] text-white" : "text-white/40 hover:bg-white/5"}`}><Video size={18}/> Pedidos de Vídeo</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-5 py-4 text-red-500/40 hover:text-red-500 transition-all text-[10px] font-black uppercase"><LogOut size={18}/> Sair</button>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === "stats" && (
            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-xl inline-block">
                <p className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-widest">Saldo Disponível</p>
                <h3 className="text-4xl font-black italic text-[#D946EF]">R$ {Number(modelData?.balance || 0).toFixed(2)}</h3>
            </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-10 tracking-tighter text-[#D946EF]">Editar Hub</h2>
            <div className="space-y-6 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem]">
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-40" placeholder="Sua Bio..."/>
              <input type="text" value={insta} onChange={e => setInsta(e.target.value)} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-sm outline-none focus:border-[#D946EF]" placeholder="@instagram"/>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg">{savingProfile ? "Salvando..." : "Salvar Alterações"}</button>
            </div>
          </div>
        )}

        {activeTab === "media" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-4xl font-black uppercase italic mb-10 text-[#D946EF]">Minha Galeria</h2>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] mb-10 shadow-2xl grid md:grid-cols-2 gap-8">
                    <textarea value={newMediaCaption} onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-32" placeholder="Legenda..."/>
                    <div className="flex flex-col justify-between">
                        <input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-white font-black text-2xl mb-4" placeholder="R$ 0,00"/>
                        <label className="w-full bg-[#D946EF] text-white py-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs">
                            {uploading ? <Loader2 className="animate-spin" size={18}/> : <><Camera size={20}/> Publicar Foto</>}
                            <input type="file" hidden accept="image/*" onChange={handleUploadMedia} disabled={uploading}/>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {mediaList.map((item) => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                            <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all"/>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <button onClick={() => { if(confirm("Deletar?")) fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${item.id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }).then(() => loadAll(modelId!)) }} className="p-3 bg-red-500 rounded-full"><Trash2 size={18}/></button>
                            </div>
                            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#D946EF]'}`}>{item.price === 0 ? 'Grátis' : `R$ ${item.price}`}</div>
                        </div>
                    ))}
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
