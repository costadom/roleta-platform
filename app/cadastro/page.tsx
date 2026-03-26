"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Phone, Mail, User, Wallet, Loader2, ShieldCheck, Eye, EyeOff, AlertTriangle, ArrowLeft, Camera, ImagePlus } from "lucide-react";

export default function ModelAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref"); // 🔥 PEGA A INDICAÇÃO DA MADRINHA 🔥

  const [view, setView] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos do Formulário
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [pixKey, setPixKey] = useState(""); 

  // 🔥 FOTOS DA MODELO 🔥
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Lida com a seleção da Foto de Perfil
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileFile(e.target.files[0]);
      setProfilePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Lida com a seleção da Foto de Fundo/Capa
  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBgFile(e.target.files[0]);
      setBgPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
      if (view === "login") {
        // 🔥 LÓGICA DE LOGIN DA MODELO 🔥
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Models?whatsapp=eq.${cleanWhatsapp}&password=eq.${password}&select=id,slug`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          localStorage.setItem("labz_model_logged", "true");
          localStorage.setItem("labz_model_id", dataCheck[0].id);
          localStorage.setItem("labz_model_slug", dataCheck[0].slug);
          router.push(`/admin/dashboard`);
        } else {
          setError("WhatsApp ou senha incorretos.");
        }
      } else {
        // 🔥 LÓGICA DE CADASTRO DA MODELO 🔥
        const checkExist = await fetch(`${supabaseUrl}/rest/v1/Models?whatsapp=eq.${cleanWhatsapp}&select=id`, { headers }).then(r=>r.json());
        
        if (checkExist && checkExist.length > 0) {
            setError("Já existe uma musa cadastrada com este WhatsApp.");
            setLoading(false); return;
        }

        const generatedSlug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

        // 1. Cria a Modelo no Banco
        const payload = {
            whatsapp: cleanWhatsapp,
            password: password,
            email: email,
            slug: generatedSlug,
            balance: 0,
            referred_by: refId || null, 
        };

        const res = await fetch(`${supabaseUrl}/rest/v1/Models`, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!res.ok) { setError("Erro ao criar conta. Verifique os dados."); setLoading(false); return; }
        
        const newModel = await res.json();
        const newModelId = newModel[0].id;

        // 2. Faz o Upload das Fotos para o Supabase Storage (Bucket 'media')
        let uploadedProfileUrl = "";
        let uploadedBgUrl = "";

        const headersUpload = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` };

        if (profileFile) {
            const fileName = `${Date.now()}_profile_${generatedSlug}`;
            const resUp = await fetch(`${supabaseUrl}/storage/v1/object/media/${fileName}`, {
                method: 'POST', headers: { ...headersUpload, 'Content-Type': profileFile.type }, body: profileFile
            });
            if (resUp.ok) uploadedProfileUrl = `${supabaseUrl}/storage/v1/object/public/media/${fileName}`;
        }

        if (bgFile) {
            const fileName = `${Date.now()}_bg_${generatedSlug}`;
            const resUp = await fetch(`${supabaseUrl}/storage/v1/object/media/${fileName}`, {
                method: 'POST', headers: { ...headersUpload, 'Content-Type': bgFile.type }, body: bgFile
            });
            if (resUp.ok) uploadedBgUrl = `${supabaseUrl}/storage/v1/object/public/media/${fileName}`;
        }

        // 3. Salva as Configurações com as Fotos
        const configPayload = {
            model_id: newModelId,
            model_name: name,
            pix_key: pixKey,
            bio: "Sou uma nova musa na LabzSexy!",
            live_price: 3.10,
            showcase_visible: true,
            profile_url: uploadedProfileUrl, // Salva a foto de perfil
            bg_url: uploadedBgUrl            // Salva a foto de capa
        };
        await fetch(`${supabaseUrl}/rest/v1/Configs`, { method: "POST", headers, body: JSON.stringify(configPayload) });

        localStorage.setItem("labz_model_logged", "true");
        localStorage.setItem("labz_model_id", newModelId);
        localStorage.setItem("labz_model_slug", generatedSlug);
        router.push(`/admin/dashboard`);
      }
    } catch (err) {
      setError("Erro na conexão com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto py-12">
      
      {/* 🔥 FUNDO LIQUID GLASS ANIMADO 🔥 */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516481157630-05bc0aeb8b19?w=1000&q=80')] bg-cover bg-center opacity-20 scale-105 animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/95 to-[#050505] backdrop-blur-sm"></div>

      <div className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.15)] relative z-10 my-auto">
        
        <button onClick={() => router.push('/')} className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
             <span className="text-3xl text-[#D946EF] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]">🔱</span>
             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">Labz<span className="text-[#D946EF]">Sexy</span></h2>
          </div>
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-[#D946EF]" /> Acesso Exclusivo para Criadoras
          </p>
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8 border border-white/10 backdrop-blur-sm">
          <button onClick={() => setView("login")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "login" ? 'bg-[#D946EF] text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-white/40 hover:text-white'}`}>Entrar</button>
          <button onClick={() => setView("register")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "register" ? 'bg-[#D946EF] text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-white/40 hover:text-white'}`}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 🔥 NOVOS CAMPOS DE FOTO (SOMENTE NO CADASTRO) 🔥 */}
          {view === "register" && (
            <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" id="profile-upload" />
                    <label htmlFor="profile-upload" className={`w-full h-24 bg-white/5 backdrop-blur-md border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${profilePreview ? 'border-[#D946EF]' : 'border-white/10 hover:bg-white/10 text-white/50 hover:text-white'}`}>
                        {profilePreview ? (
                           <img src={profilePreview} className="w-full h-full object-cover" />
                        ) : (
                           <>
                             <Camera size={20} className="mb-2 text-[#D946EF]" />
                             <span className="text-[9px] font-black uppercase text-center leading-tight">Foto de<br/>Perfil</span>
                           </>
                        )}
                    </label>
                </div>
                <div className="flex-1 relative">
                    <input type="file" accept="image/*" onChange={handleBgChange} className="hidden" id="bg-upload" />
                    <label htmlFor="bg-upload" className={`w-full h-24 bg-white/5 backdrop-blur-md border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${bgPreview ? 'border-[#D946EF]' : 'border-white/10 hover:bg-white/10 text-white/50 hover:text-white'}`}>
                        {bgPreview ? (
                           <img src={bgPreview} className="w-full h-full object-cover" />
                        ) : (
                           <>
                             <ImagePlus size={20} className="mb-2 text-[#D946EF]" />
                             <span className="text-[9px] font-black uppercase text-center leading-tight">Foto de<br/>Fundo</span>
                           </>
                        )}
                    </label>
                </div>
            </div>
          )}

          {view === "register" && (
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
                <input type="text" placeholder="Nome da Musa" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
            </div>
          )}

          <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
              <input type="tel" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
          </div>

          {view === "register" && (
            <>
              <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
                  <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
              </div>
              <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
                  <input type="text" placeholder="Chave PIX (E-mail ou Telefone)" value={pixKey} onChange={e => setPixKey(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
              </div>
            </>
          )}

          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D946EF]/50" size={18} />
              <input type={showPassword ? "text" : "password"} placeholder={view === "login" ? "Sua Senha" : "Crie uma Senha"} value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-[#D946EF] focus:bg-white/10 transition-all placeholder:text-white/30" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#D946EF] transition-colors">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
          </div>

          {error && (
              <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl mt-4">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>
              </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#a832b8] text-white font-black uppercase py-5 rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center mt-6">
              {loading ? <Loader2 className="animate-spin" /> : view === "login" ? "Acessar Dashboard" : "Criar Conta de Criadora"}
          </button>
        </form>

        {view === "register" && (
            <div className="mt-6 text-center border-t border-white/10 pt-6">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-relaxed">
                    Você recebe 70% de todo o faturamento<br/>Direto na sua conta via PIX.
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
