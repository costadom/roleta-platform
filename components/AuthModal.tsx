"use client";

import React, { useState, useEffect } from "react";
import { X, Phone, Mail, Lock, Eye, EyeOff, FileText, Loader2, Sparkles, User, UserCheck } from "lucide-react";
import { useParams } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const params = useParams();
  const slug = params.slug;

  // Estados de Controle
  const [view, setView] = useState<"login" | "register" | "update">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados dos Campos
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

  // --- MÁSCARAS ---
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setCpf(v);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(v);
  };

  // --- VALIDAÇÃO ---
  const isPasswordStrong = (p: string) => {
    return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[@$!%*?&]/.test(p);
  };

  // --- LÓGICA PRINCIPAL ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, "");
    const headers = { 
        apikey: supabaseKey!, 
        Authorization: `Bearer ${supabaseKey}`, 
        "Content-Type": "application/json", 
        Prefer: "return=representation" 
    };

    try {
      // 1. Identifica a Modelo Atual
      const resMod = await fetch(`${supabaseUrl}/rest/v1/Models?slug=eq.${slug}&select=id`, { headers });
      const dataMod = await resMod.json();
      const currentModelId = dataMod[0]?.id;

      if (view === "login") {
        // Tenta encontrar o usuário globalmente
        const resCheck = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}&password=eq.${password}&select=*`, { headers });
        const dataCheck = await resCheck.json();

        if (dataCheck && dataCheck.length > 0) {
          const userBase = dataCheck[0];

          // CHECAGEM DE MIGRAÇÃO: Se faltar Nome ou Nick, força o update
          if (!userBase.full_name || !userBase.nickname) {
            setPhone(userBase.whatsapp);
            setEmail(userBase.email || "");
            setView("update");
            setLoading(false);
            return;
          }

          // CHECAGEM DE ASSOCIAÇÃO: Se logado mas não vinculado a esta modelo
          const hasLink = dataCheck.find((p: any) => p.model_id === currentModelId);
          if (!hasLink) {
            await fetch(`${supabaseUrl}/rest/v1/Players`, {
              method: "POST", headers,
              body: JSON.stringify({
                whatsapp: cleanPhone, email: userBase.email, cpf: userBase.cpf,
                password: userBase.password, name: userBase.name,
                full_name: userBase.full_name, nickname: userBase.nickname,
                model_id: currentModelId, credits: 0
              })
            });
          }
          
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setError("WhatsApp ou senha incorretos.");
        }
      } 
      
      else if (view === "register" || view === "update") {
        if (view === "register") {
          if (!isPasswordStrong(password)) {
            setError("A senha não cumpre os requisitos de segurança.");
            setLoading(false);
            return;
          }

          const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
            method: "POST", headers,
            body: JSON.stringify({
              whatsapp: cleanPhone, email, cpf: cpf.replace(/\D/g,""),
              password, full_name: fullName, nickname, credits: 0,
              model_id: currentModelId
            })
          });
          if (!res.ok) throw new Error();
        } else {
          // Lógica de UPDATE (Migração)
          await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}`, {
            method: "PATCH", headers,
            body: JSON.stringify({ full_name: fullName, nickname, email, cpf: cpf.replace(/\D/g,"") })
          });

          // Após atualizar os dados globais, garante que ele se associe a esta modelo
          await fetch(`${supabaseUrl}/rest/v1/Players`, {
            method: "POST", headers,
            body: JSON.stringify({
              whatsapp: cleanPhone, email, cpf: cpf.replace(/\D/g,""),
              password, full_name: fullName, nickname, credits: 0,
              model_id: currentModelId
            })
          });
        }

        localStorage.setItem("labz_player_logged", "true");
        localStorage.setItem("labz_player_phone", cleanPhone);
        window.location.reload();
      }
    } catch {
      setError("Erro ao processar. Tente outro WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.3)] relative">
        
        {view !== "update" && (
            <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[10px] text-[#FFD700] uppercase font-black tracking-[0.3em] mt-2">
            {view === "update" ? "🚀 Finalize seu cadastro VIP" : "Área Exclusiva do Jogador"}
          </p>
        </div>

        {view !== "update" && (
          <div className="flex bg-[#111] rounded-2xl p-1.5 mb-8 border border-white/5">
            <button onClick={() => {setView("login"); setError("");}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "login" ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Entrar</button>
            <button onClick={() => {setView("register"); setError("");}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${view === "register" ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/20'}`}>Cadastrar</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* WHATSAPP */}
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
            <input type="tel" placeholder="WhatsApp (Login)" value={phone} onChange={handlePhoneChange} required disabled={view === "update"} className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm focus:border-[#D946EF] outline-none disabled:opacity-50" />
          </div>

          {view !== "login" && (
            <>
              {/* NOME COMPLETO */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
                <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>

              {/* NICKNAME */}
              <div className="relative group">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
                <input type="text" placeholder="Seu Nickname na Roleta" value={nickname} onChange={e => setNickname(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>

              {/* EMAIL */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
                <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>

              {/* CPF */}
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
                <input type="text" placeholder="CPF" value={cpf} onChange={handleCpfChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 text-white text-sm focus:border-[#D946EF] outline-none" />
              </div>
            </>
          )}

          {/* SENHA (Login ou Cadastro) */}
          {view !== "update" && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF]" size={18} />
              <input type={showPassword ? "text" : "password"} placeholder={view === "login" ? "Sua Senha" : "Crie uma Senha Forte"} value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:border-[#D946EF] outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          )}

          {/* Dicas de Senha no Cadastro */}
          {view === "register" && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <ul className="text-[8px] text-white/40 space-y-1 uppercase font-bold">
                    <li className={password.length >= 8 ? "text-emerald-400" : ""}>• Mínimo 8 caracteres</li>
                    <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>• Uma Letra Maiúscula</li>
                    <li className={/[@$!%*?&]/.test(password) ? "text-emerald-400" : ""}>• Um Símbolo (@#$...)</li>
                </ul>
            </div>
          )}

          {/* CHECKBOX 18 ANOS */}
          {view !== "login" && (
            <label className="flex items-start gap-3 cursor-pointer group px-1">
              <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} required className="mt-1 w-4 h-4 rounded accent-[#D946EF]" />
              <span className="text-[9px] text-white/30 uppercase font-black leading-tight">Confirmo que tenho +18 anos e aceito os termos de uso da Savanah Labz.</span>
            </label>
          )}

          {error && <p className="text-red-500 text-[10px] text-center font-black uppercase bg-red-500/10 py-3 rounded-xl border border-red-500/20">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#9c18ae] text-white font-black uppercase py-5 rounded-2xl shadow-[0_10px_30px_rgba(217,70,239,0.3)] active:scale-95 transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (view === "login" ? "Acessar Roleta" : view === "update" ? "Concluir e Jogar" : "Criar Conta VIP")}
          </button>
        </form>
      </div>
    </div>
  );
}
