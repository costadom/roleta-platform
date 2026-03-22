"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, ShieldCheck, User, Eye, EyeOff, FileText } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // States do formulário
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Máscaras
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    setPhone(v);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 3 && v.length <= 6) v = `${v.slice(0, 3)}.${v.slice(3)}`;
    else if (v.length > 6 && v.length <= 9) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    else if (v.length > 9) v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    setCpf(v);
  };

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!isLoginView) {
      if (cpf.length < 14) return setErrors({ auth: "CPF incompleto." });
      if (!validatePassword(password)) return setErrors({ auth: "A senha não cumpre os requisitos." });
      if (!ageConfirmed) return setErrors({ auth: "Você deve confirmar ter +18 anos." });
    }

    setLoading(true);
    const cleanPhone = phone.replace(/\D/g, "");

    try {
      const headers = {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      if (isLoginView) {
        const res = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}&password=eq.${password}&select=*`, { headers });
        const data = await res.json();
        if (data && data[0]) {
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setErrors({ auth: "Dados de acesso incorretos." });
        }
      } else {
        const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: email.split('@')[0],
            whatsapp: cleanPhone,
            password: password,
            email: email,
            cpf: cpf.replace(/\D/g, ""),
            credits: 0 
          }),
        });

        if (res.ok) {
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setErrors({ auth: "Este WhatsApp ou E-mail já existe." });
        }
      }
    } catch (err) {
      setErrors({ auth: "Erro de conexão com o servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_60px_rgba(217,70,239,0.25)] relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 text-white/30 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] mt-2">Plataforma Oficial</p>
        </div>

        <div className="flex bg-[#141414] rounded-2xl p-1.5 mb-8 relative z-10 border border-white/5">
          <button onClick={() => {setIsLoginView(true); setErrors({});}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/30'}`}>Entrar</button>
          <button onClick={() => {setIsLoginView(false); setErrors({});}} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${!isLoginView ? 'bg-[#D946EF] text-white shadow-lg' : 'text-white/30'}`}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF] transition-colors" size={18} />
            <input type="tel" placeholder="Seu WhatsApp (Login)" value={phone} onChange={handlePhoneChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none transition-all focus:ring-1 focus:ring-[#D946EF]/30" />
          </div>

          {!isLoginView && (
            <>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF] transition-colors" size={18} />
                <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none transition-all" />
              </div>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF] transition-colors" size={18} />
                <input type="text" placeholder="CPF" value={cpf} onChange={handleCpfChange} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-[#D946EF] outline-none transition-all" />
              </div>
            </>
          )}

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#D946EF] transition-colors" size={18} />
            <input type={showPassword ? "text" : "password"} placeholder="Crie sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#111] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white text-sm focus:border-[#D946EF] outline-none transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          {!isLoginView && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] text-white/40 font-bold uppercase mb-1">A senha deve conter:</p>
              <ul className="text-[8px] text-white/60 space-y-0.5 font-medium uppercase">
                <li className={password.length >= 8 ? "text-emerald-400" : ""}>• No mínimo 8 caracteres</li>
                <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>• Uma letra maiúscula</li>
                <li className={/\d/.test(password) ? "text-emerald-400" : ""}>• Um número e um caractere especial</li>
              </ul>
            </div>
          )}

          {!isLoginView && (
            <label className="flex items-start gap-3 cursor-pointer group px-1">
              <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/10 bg-transparent accent-[#D946EF]" />
              <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors uppercase font-bold leading-tight">Confirmo que tenho +18 anos e aceito os termos de uso.</span>
            </label>
          )}

          {errors.auth && <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest bg-red-500/10 py-3 rounded-xl border border-red-500/20">{errors.auth}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D946EF] to-[#9c18ae] text-white font-black uppercase py-5 rounded-[1.5rem] shadow-[0_10px_25px_rgba(217,70,239,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (isLoginView ? "Acessar Carteira" : "Criar Conta VIP")}
          </button>
        </form>
      </div>
    </div>
  );
}
