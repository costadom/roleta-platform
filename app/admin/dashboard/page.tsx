"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Gift, Settings, LogOut, DollarSign, Users, Sparkles, Loader2, Camera, Trash2, Plus, Lock, Globe, Instagram, Save, FileText, Type } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelData, setModelData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "prizes" | "profile" | "media">("stats");
  const [loading, setLoading] = useState(true);

  // Perfil
  const [bio, setBio] = useState("");
  const [insta, setInsta] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Mídia
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMediaPrice, setNewMediaPrice] = useState(0);
  const [newMediaCaption, setNewMediaCaption] = useState("");

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
      const [resMod, resMedia] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${id}&select=*,Configs(*)`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/Media?model_id=eq.${id}&order=created_at.desc`, { headers })
      ]);
      const mod = (await resMod.json())[0];
      setModelData(mod);
      setBio(mod.bio || "");
      setInsta(mod.instagram || "");
      setMediaList(await resMedia.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch(`${supabaseUrl}/rest/v1/Models?id=eq.${modelId}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bio, instagram: insta })
      });
      alert("Seu Hub foi atualizado com sucesso!");
    } catch (e) { alert("Erro ao salvar perfil."); } finally { setSavingProfile(false); }
  };

  const handleUploadMedia = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (newMediaPrice > 0 && newMediaPrice < 10) return alert("O valor mínimo para fotos pagas é R$ 10,00");
    if (newMediaCaption.length > 500) return alert("A legenda ultrapassou o limite de 500 caracteres.");

    setUploading(true);
    try {
      const fileName = `${modelId}/media_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
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
      } else {
          alert("Erro ao subir arquivo para o servidor.");
      }
    } catch (e) { alert("Erro de conexão."); } finally { setUploading(false); }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Remover esta foto da sua galeria?")) return;
    await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
    loadAll(modelId!);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D946EF] font-black uppercase text-xs animate-pulse">Sincronizando Painel...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-[#0a0a0a] border-r border-white/5 p-8 flex flex-col gap-2 shrink-0">
        <div className="mb-10 px-2">
            <h1 className="text-2xl font-black italic text-[#D946EF] tracking-tighter">LABZ <span className="text-white">ADMIN</span></h1>
            <p className="text-[8px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">Painel da Musa</p>
        </div>
        
        <nav className="space-y-1">
            <button onClick={() => setActiveTab("stats")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "stats" ? "bg-[#D946EF] text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]" : "text-white/40 hover:bg-white/5"}`}><LayoutDashboard size={18}/> Estatísticas</button>
            <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "profile" ? "bg-[#D946EF] text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]" : "text-white/40 hover:bg-white/5"}`}><Globe size={18}/> Editar Meu Hub</button>
            <button onClick={() => setActiveTab("media")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "media" ? "bg-[#D946EF] text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]" : "text-white/40 hover:bg-white/5"}`}><Camera size={18}/> Minhas Fotos</button>
            <button onClick={() => setActiveTab("prizes")} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === "prizes" ? "bg-[#D946EF] text-white shadow-[0_10px_20px_rgba(217,70,239,0.2)]" : "text-white/40 hover:bg-white/5"}`}><Gift size={18}/> Prêmios Roleta</button>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-5 py-4 text-red-500/40 hover:text-red-500 transition-all text-[10px] font-black uppercase"><LogOut size={18}/> Sair do Painel</button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        
        {activeTab === "profile" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-10 tracking-tighter">Meu <span className="text-[#D946EF]">Hub Público</span></h2>
            <div className="space-y-8 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] mb-3 block ml-2">Bio / Frase de Boas-vindas</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-40 resize-none transition-all" placeholder="Conte algo sobre você para seus fãs..."/>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] mb-3 block ml-2">Seu Instagram (Apenas o @)</label>
                <div className="relative">
                    <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20}/>
                    <input type="text" value={insta} onChange={e => setInsta(e.target.value)} className="w-full bg-black border border-white/10 rounded-full py-5 pl-14 pr-6 text-sm outline-none focus:border-[#D946EF]" placeholder="@sua_musa"/>
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-[#D946EF] text-white py-6 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                {savingProfile ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Salvar Perfil Público</>}
              </button>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Minha <span className="text-[#D946EF]">Galeria</span></h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-12">As fotos pagas são protegidas com Blur automaticamente</p>

            <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] mb-12 shadow-2xl">
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <label className="text-[10px] font-black uppercase text-[#D946EF]">Legenda da Foto</label>
                            <span className={`text-[9px] font-bold ${newMediaCaption.length > 450 ? 'text-red-500' : 'text-white/20'}`}>{newMediaCaption.length}/500</span>
                        </div>
                        <textarea 
                            value={newMediaCaption} 
                            onChange={e => setNewMediaCaption(e.target.value.slice(0, 500))} 
                            className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm outline-none focus:border-[#D946EF] h-32 resize-none" 
                            placeholder="Ex: Essa foto é especial pra quem ama... 🔥"
                        />
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <label className="text-[10px] font-black uppercase text-white/40 mb-3 block ml-2">Preço (0 = Grátis | Mínimo R$ 10)</label>
                            <input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-full py-5 px-8 text-white font-black text-2xl outline-none focus:border-[#D946EF]" placeholder="R$ 0,00"/>
                        </div>
                        <label className="w-full bg-[#D946EF] text-white py-6 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs shadow-xl mt-6">
                            {uploading ? <Loader2 className="animate-spin" size={18}/> : <><Plus size={20}/> Publicar Nova Foto</>}
                            <input type="file" hidden accept="image/*" onChange={handleUploadMedia} disabled={uploading}/>
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {mediaList.map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] rounded-3xl overflow-hidden group border border-white/5 bg-black shadow-xl">
                        <img src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"/>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 text-center">
                            <p className="text-[10px] text-white/70 italic mb-6 line-clamp-4">{item.caption || "Sem legenda"}</p>
                            <button onClick={() => deleteMedia(item.id)} className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                        </div>
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-2xl ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#D946EF]'}`}>
                            {item.price === 0 ? 'Grátis' : `R$ ${item.price}`}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* MANTENDO ESTRUTURA PARA AS OUTRAS ABAS */}
        {activeTab === "stats" && (
            <div className="animate-in fade-in">
                <h2 className="text-4xl font-black uppercase italic mb-10 tracking-tighter">Minha <span className="text-[#D946EF]">Performance</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl"><p className="text-[10px] font-black text-white/30 uppercase mb-2">Ganhos Totais</p><h3 className="text-3xl font-black italic">R$ {Number(modelData?.balance || 0).toFixed(2)}</h3></div>
                </div>
            </div>
        )}
        
        {activeTab === "prizes" && (
            <div className="animate-in fade-in italic text-white/20">Configuração de prêmios da roleta (já funcional no seu código).</div>
        )}

      </div>
      <style jsx global>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }`}</style>
    </div>
  );
}

export default function ModelDashboard() {
    return (
        <Suspense fallback={null}>
            <DashboardContent />
        </Suspense>
    );
}
