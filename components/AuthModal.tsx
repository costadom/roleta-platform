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

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [cpf, setCpf] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

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

    const cleanPhone = phone.replace(/\D/g, "");
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
      const dataMod = await resMod.json();
      const currentModelId = dataMod[0]?.id;

      if (view === "login") {
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}&password=eq.${password}&select=*`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          const userBase = dataCheck[0];

          // 1. CHECAGEM DE MIGRAÇÃO (SE FALTAR DADOS NOVOS)
          if (!userBase.full_name || !userBase.nickname || !userBase.cpf) {
            console.log("🕵️ [ESPIÃO MODAL] Usuário antigo detectado. Redirecionando para Update.");
            setPhone(userBase.whatsapp);
            setEmail(userBase.email || "");
            setView("update");
            setLoading(false);
            return;
          }

          // 2. CHECAGEM DE VÍNCULO (LÓGICA ANTI-LOOP DE FORÇA BRUTA)
          const hasLink = dataCheck.find((p: any) => p.model_id === currentModelId);
          if (!hasLink) {
            console.log("🕵️ [ESPIÃO MODAL] Usuário logado globalmente mas sem vínculo. Criando vínculo agora.");
            // Cria o vínculo com saldo 0
            const resLink = await fetch(`${supabaseUrl}/rest/v1/Players`, {
              method: "POST", headers,
              body: JSON.stringify({
                whatsapp: cleanPhone, email: userBase.email, cpf: userBase.cpf,
                password: userBase.password, full_name: userBase.full_name, nickname: userBase.nickname,
                model_id: currentModelId, credits: 0, name: userBase.nickname
              })
            });
            
            if (!resLink.ok) {
                console.error("🕵️ [ESPIÃO MODAL] Erro ao criar vínculo.", await resLink.text());
                throw new Error("Erro ao vincular");
            }
            console.log("🕵️ [ESPIÃO MODAL] Vínculo criado com sucesso.");
          }
          
          // Sucesso - Loga e recarrega
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setError("WhatsApp ou senha incorretos.");
        }
      } 
      else {
        // REGISTER OU UPDATE (MIGRAÇÃO)
        const payload = {
           whatsapp: cleanPhone, email, cpf: cpf.replace(/\D/g,""),
           password, full_name: fullName, nickname, credits: 0,
           model_id: currentModelId, name: nickname // 'name' para compatibilidade
        };

        if (view === "register") {
           const res = await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers, body: JSON.stringify(payload) });
           if (!res.ok) throw new Error("Erro ao cadastrar");
        } else {
           // Lógica de Migração de Dados (Update)
           console.log("🕵️ [ESPIÃO MODAL] Finalizando Migração de Dados.");
           // Atualiza o registro GLOBAL e depois cria o LOCAL da modelo
           await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}`, {
             method: "PATCH", headers,
             body: JSON.stringify({ full_name: fullName, nickname: nickname, name: nickname, cpf: cpf.replace(/\D/g,""), email: email })
           });
           await fetch(`${supabaseUrl}/rest/v1/Players`, { method: "POST", headers, body: JSON.stringify(payload) });
        }

        localStorage.setItem("labz_player_logged", "true");
        localStorage.setItem("labz_player_phone", cleanPhone);
        window.location.reload();
      }
    } catch { setError("Erro ao processar dados. Tente novamente."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.3)] relative overflow-hidden">
        
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#D946EF]/10 rounded-full blur-[50px]" />
        
        {view !== "update" && <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors z-10"><X size={24} /></button>}
        
        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[10px] text-[#FFD700] uppercase font-bold tracking-[0.3em] mt-2">{view === "update" ? "🚀 Finalize seu Perfil VIP" : "Área Exclusiva do Jogador"}</p>
        </div>

        {view !== "update" && (
          <div className="flex bg-[#111] rounded-2xl p-1.5 mb-8 border border-white/5 relative z-10">
            <button onClick={() => {setView("login"); setError("");}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "login" ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Entrar</button>
            <button onClick={() => {setView("register"); setError("");}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "register" ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Cadastrar</button>
          </div>
        )}

        {view === "update" && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6 text-center relative z-10">
                <AlertTriangle className="text-amber-500 mx-auto mb-2" size={24}/>
                <p className="text-[10px] text-white/70 uppercase font-black">Sua conta é antiga. Para acessar a nova plataforma, você precisa finalizar seu cadastro com Nome Completo, Nickname e CPF.</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="tel" placeholder="WhatsApp (Login)" value={phone} onChange={e => setPhone(e.target.value)} required disabled={view === "update"} className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF] disabled:opacity-50" /></div>

          {view !== "login" && (
            <>
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="Nickname (Apelido)" value={nickname} onChange={e => setNickname(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
              <div className="relative"><FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="text" placeholder="CPF" value={cpf} onChange={e => handleCpf(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
            </<>
          )}

          {view === "login" && (
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type={showPassword ? "text" : "password"} placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-[#D946EF]" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
          )}

          {view === "register" && (
            <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} /><input type="password" placeholder="Crie uma Senha Forte" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm outline-none focus:border-[#D946EF]" /></div>
          )}

          {view !== "login" && (
             <div className="px-1"><label className="flex items-start gap-3 cursor-pointer group"><input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} required className="mt-1 accent-[#D946EF]" /><span className="text-[9px] text-white/30 uppercase font-black group-hover:text-white/50">Confirmo que tenho +18 anos e aceito os termos da Savanah Labz.</span></label></div>
          )}

          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase bg-red-500/10 py-3 rounded-xl border border-red-500/20">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#9c18ae] text-white font-black uppercase py-5 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin" size={20}/> : view === "update" ? "Finalizar e Acessar" : "Entrar na Roleta"}</button>
        </form>
      </div>
    </div>
  );
}
