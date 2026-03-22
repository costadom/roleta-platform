"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, Gift, Settings, LogOut, DollarSign, Users, Sparkles, Loader2, Camera, Trash2, Plus, Lock, Globe, Instagram, Save, FileText } from "lucide-react";

export default function ModelDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelData, setModelData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "prizes" | "profile" | "media">("stats");
  const [loading, setLoading] = useState(true);

  // Estados do Perfil
  const [bio, setBio] = useState("");
  const [insta, setInsta] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Estados de Mídia
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMediaPrice, setNewMediaPrice] = useState(0);

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
      alert("Perfil atualizado!");
    } catch (e) { alert("Erro ao salvar."); } finally { setSavingProfile(false); }
  };

  const handleUploadMedia = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    if (newMediaPrice > 0 && newMediaPrice < 10) return alert("O valor mínimo para fotos pagas é R$ 10,00");

    setUploading(true);
    try {
      const fileName = `${modelId}/${Date.now()}_${file.name}`;
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
          body: JSON.stringify({ model_id: modelId, url: publicUrl, price: newMediaPrice })
        });
        loadAll(modelId!);
      }
    } catch (e) { alert("Erro no upload."); } finally { setUploading(false); }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Deletar esta foto?")) return;
    await fetch(`${supabaseUrl}/rest/v1/Media?id=eq.${id}`, { method: "DELETE", headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } });
    loadAll(modelId!);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D946EF]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col gap-2">
        <div className="mb-8 px-2"><h1 className="text-xl font-black italic text-[#D946EF]">LABZ <span className="text-white">ADMIN</span></h1></div>
        
        <button onClick={() => setActiveTab("stats")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "stats" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/40 hover:bg-white/5"}`}><LayoutDashboard size={18}/> Dashboard</button>
        <button onClick={() => setActiveTab("profile")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "profile" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/40 hover:bg-white/5"}`}><Globe size={18}/> Editar Meu Hub</button>
        <button onClick={() => setActiveTab("media")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "media" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/40 hover:bg-white/5"}`}><Camera size={18}/> Minhas Fotos</button>
        <button onClick={() => setActiveTab("prizes")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "prizes" ? "bg-[#D946EF] text-white shadow-lg" : "text-white/40 hover:bg-white/5"}`}><Gift size={18}/> Roleta</button>
        
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-3 px-4 py-3 text-red-500/50 hover:text-red-500 transition-all text-xs font-black uppercase"><LogOut size={18}/> Sair</button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        
        {/* ABA: CONFIGURAÇÕES DO HUB (BIO / INSTA) */}
        {activeTab === "profile" && (
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black uppercase italic mb-2">Configurar <span className="text-[#D946EF]">Meu Hub</span></h2>
            <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-10">Como os clientes verão seu perfil público</p>

            <div className="space-y-6 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] ml-2">Sua Biografia (Frase de Impacto)</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-5 mt-2 text-sm outline-none focus:border-[#D946EF] h-32 resize-none" placeholder="Ex: Bem-vindo ao meu lado mais picante..."/>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-[#D946EF] ml-2">Instagram (Apenas o Usuário)</label>
                <div className="relative mt-2">
                    <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18}/>
                    <input type="text" value={insta} onChange={e => setInsta(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-sm outline-none focus:border-[#D946EF]" placeholder="ex: @sua_musa"/>
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full bg-[#D946EF] text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                {savingProfile ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Salvar Perfil Público</>}
              </button>
            </div>
          </div>
        )}

        {/* ABA: GESTÃO DE MÍDIA (FOTOS) */}
        {activeTab === "media" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black uppercase italic mb-2">Galeria <span className="text-[#D946EF]">Privada</span></h2>
                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest italic">Fotos pagas aparecem com Blur para o cliente</p>
                </div>
                
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-[2rem] flex items-center gap-4 shadow-xl">
                   <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/40 uppercase ml-1">Preço da Foto</span>
                        <input type="number" value={newMediaPrice} onChange={e => setNewMediaPrice(Number(e.target.value))} className="bg-transparent border-none text-white font-black text-xl w-24 outline-none" placeholder="0 = Grátis"/>
                   </div>
                   <label className="bg-[#D946EF] text-white p-4 rounded-2xl cursor-pointer hover:scale-105 transition-all flex items-center gap-2 font-black uppercase text-[10px]">
                        {uploading ? <Loader2 className="animate-spin" size={18}/> : <><Plus size={18}/> Subir Foto</>}
                        <input type="file" hidden accept="image/*" onChange={handleUploadMedia} disabled={uploading}/>
                   </label>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaList.map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-white/5">
                        <img src={item.url} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                            <button onClick={() => deleteMedia(item.id)} className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-all"><Trash2 size={18}/></button>
                        </div>
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-xl ${item.price === 0 ? 'bg-emerald-500' : 'bg-[#D946EF]'}`}>
                            {item.price === 0 ? 'Grátis' : `R$ ${item.price}`}
                        </div>
                    </div>
                ))}
            </div>

            {mediaList.length === 0 && (
                <div className="py-32 text-center border border-dashed border-white/10 rounded-[3rem]">
                    <Camera size={40} className="mx-auto text-white/10 mb-4"/>
                    <p className="text-white/20 font-black uppercase text-[10px] italic">Você ainda não subiu nenhuma foto na sua galeria.</p>
                </div>
            )}
          </div>
        )}

        {/* Mantenha as outras abas (stats, prizes) que ela já tem... */}
        {activeTab === "stats" && <div className="text-white/40 italic">Aba de estatísticas (já existente)</div>}
        {activeTab === "prizes" && <div className="text-white/40 italic">Aba de prêmios da roleta (já existente)</div>}

      </div>
    </div>
  );
}
