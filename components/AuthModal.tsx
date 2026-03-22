"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, Eye, EyeOff, FileText, Loader2, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const params = useParams();
  const slug = params.slug; // Pega a modelo atual pela URL

  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, "");
    const headers = { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" };

    try {
      // 1. Descobrir o ID da modelo atual pelo slug
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
      const dataMod = await resMod.json();
      const currentModelId = dataMod[0]?.id;

      if (isLoginView) {
        // TENTA LOGAR: Primeiro verifica se a senha está correta no banco global
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}&password=eq.${password}&select=*`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          // Senha correta! Agora vê se ele já tem vínculo com ESTA modelo
          const hasLink = dataCheck.find((p: any) => p.model_id === currentModelId);

          if (hasLink) {
            // Já é associado, só loga
            localStorage.setItem("labz_player_logged", "true");
            localStorage.setItem("labz_player_phone", cleanPhone);
            window.location.reload();
          } else {
            // É um usuário global, mas NOVO para esta modelo -> ASSOCIAR AUTOMATICAMENTE
            const userBase = dataCheck[0];
            await fetch(`${supabaseUrl}/rest/v1/Players`, {
              method: "POST", headers,
              body: JSON.stringify({
                whatsapp: cleanPhone,
                email: userBase.email,
                cpf: userBase.cpf,
                password: userBase.password,
                name: userBase.name,
                model_id: currentModelId,
                credits: 0
              })
            });
            localStorage.setItem("labz_player_logged", "true");
            localStorage.setItem("labz_player_phone", cleanPhone);
            window.location.reload();
          }
        } else {
          setError("Dados incorretos ou usuário não encontrado.");
        }
      } else {
        // NOVO CADASTRO TOTAL
        const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
          method: "POST", headers,
          body: JSON.stringify({
            whatsapp: cleanPhone,
            email,
            cpf: cpf.replace(/\D/g, ""),
            password,
            credits: 0,
            name: email.split('@')[0],
            model_id: currentModelId
          })
        });
        if (res.ok) {
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setError("Este WhatsApp já possui cadastro.");
        }
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.2)] relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase italic">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[9px] text-[#FFD700] uppercase font-bold tracking-[0.4em] mt-2 flex items-center justify-center gap-2">
             <Sparkles size={10}/> Área do Jogador <Sparkles size={10}/>
          </p>
        </div>

        <div className="flex bg-[#111] rounded-2xl p-1 mb-8 border border-white/5">
          <button onClick={() => setIsLoginView(true)} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Entrar</button>
          <button onClick={() => setIsLoginView(false)} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${!isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input type="tel" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none" />
          </div>

          {!isLoginView && (
            <>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>
            </>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:border-[#D946EF] outline-none" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
               {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase bg-red-500/10 py-3 rounded-xl border border-red-500/20">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-[#D946EF] text-white font-black uppercase py-5 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : (isLoginView ? "Acessar Roleta" : "Criar Perfil VIP")}
          </button>
        </form>
      </div>
    </div>
  );
}
