"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, Eye, EyeOff, FileText, Loader2, Sparkles, User, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const params = useParams();
  const slug = params.slug;

  const [view, setView] = useState<"login" | "register" | "update">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isOpen) return null;

  const handleCpf = (v: string) => {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setCpf(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanWhatsapp = whatsapp.replace(/\D/g, "");
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
      const dataMod = await resMod.json();
      const currentModelId = dataMod[0]?.id;

      if (view === "login") {
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWhatsapp}&password=eq.${password}&select=*`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          const userBase = dataCheck[0];

          if (!userBase.full_name || !userBase.nickname || !userBase.cpf) {
            setWhatsapp(userBase.whatsapp);
            setEmail(userBase.email || "");
            setView("update");
            setLoading(false);
            return;
          }

          const hasLink = dataCheck.find((p: any) => p.model_id === currentModelId);
          
          if (!hasLink) {
            // EM VEZ DE CRIAR NOVO (ERRO 409), ATUALIZA O EXISTENTE COM O NOVO MODEL_ID
            await fetch(`${supabaseUrl}/rest/v1/Players?id=eq.${userBase.id}`, {
              method: "PATCH", headers,
              body: JSON.stringify({ model_id: currentModelId })
            });
          }
          
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanWhatsapp);
          window.location.reload();
        } else setError("WhatsApp ou senha incorretos.");
      } 
      else {
        const payload = { whatsapp: cleanWhatsapp, email, cpf: cpf.replace(/\D/g,""), password, full_name: fullName, nickname, credits: 0, model_id: currentModelId, name: nickname };

        if (view === "register") {
           const res = await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers, body: JSON.stringify(payload) });
           if (!res.ok) throw new Error();
        } else {
           await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanWhatsapp}`, {
             method: "PATCH", headers,
             body: JSON.stringify({ full_name: fullName, nickname, name: nickname, cpf: cpf.replace(/\D/g,""), email, model_id: currentModelId })
           });
        }
        localStorage.setItem("labz_player_logged", "true");
        localStorage.setItem("labz_player_phone", cleanWhatsapp);
        window.location.reload();
      }
    } catch { setError("Erro ao processar. Tente novamente."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.3)] relative">
        {view !== "update" && <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={24} /></button>}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[10px] text-[#FFD700] uppercase font-bold tracking-[0.3em] mt-2">{view === "update" ? "🚀 Finalize seu Perfil" : "Área do Jogador"}</p>
        </div>
        {view !== "update" && (
          <div className="flex bg-[#111] rounded-2xl p-1.5 mb-8 border border-white/5">
            <button onClick={() => setView("login")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "login" ? 'bg-[#D946EF] text-white' : 'text-white/20'}`}>Entrar</button>
            <button onClick={() => setView("register")} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "register" ? 'bg-[#D946EF] text-white' : 'text-white/20'}`}>Cadastrar</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="tel" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required disabled={view === "update"} className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] disabled:opacity-50" /></div>
          {view !== "login" && (
            <>
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="Nickname" value={nickname} onChange={e => setNickname(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="CPF" value={cpf} onChange={e => handleCpf(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
            </>
          )}
          {view === "login" && (
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type={showPassword ? "text" : "password"} placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-[#D946EF]" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
          )}
          {view === "register" && (
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="password" placeholder="Crie uma Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
          )}
          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase bg-red-500/10 py-3 rounded-xl border border-red-500/20">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#9c18ae] text-white font-black uppercase py-5 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center">{loading ? <Loader2 className="animate-spin" /> : view === "update" ? "Concluir Cadastro" : "Acessar Roleta"}</button>
        </form>
      </div>
    </div>
  );
}
