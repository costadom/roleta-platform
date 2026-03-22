"use client";

import React, { useState } from "react";
import { X, Phone, Mail, Lock, ShieldCheck, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const cleanPhone = phone.replace(/\D/g, "");

    try {
      const headers = {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      if (isLoginView) {
        // LOGIN
        const res = await fetch(`${supabaseUrl}/rest/v1/Players?whatsapp=eq.${cleanPhone}&password=eq.${password}&select=*`, { headers });
        const data = await res.json();
        if (data && data[0]) {
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setErrors({ auth: "Dados incorretos." });
        }
      } else {
        // CADASTRO (Usando os nomes exatos das suas colunas do print)
        const res = await fetch(`${supabaseUrl}/rest/v1/Players`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: email.split('@')[0], // Fallback para nome
            whatsapp: cleanPhone,
            password: password,
            email: email,
            credits: 0 // Sua coluna chama 'credits'
          }),
        });

        if (res.ok) {
          localStorage.setItem("labz_player_logged", "true");
          localStorage.setItem("labz_player_phone", cleanPhone);
          window.location.reload();
        } else {
          setErrors({ auth: "WhatsApp já cadastrado." });
        }
      }
    } catch (err) {
      setErrors({ auth: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(217,70,239,0.2)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-[#141414] border border-white/10 text-white/50 rounded-full hover:bg-[#D946EF] transition-all">
          <X size={20} />
        </button>

        <div className="text-center mb-6 pt-4">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Savanah <span className="text-[#D946EF]">Labz</span></h2>
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">{isLoginView ? "Acesse sua conta" : "Crie sua conta VIP"}</p>
        </div>

        <div className="flex bg-[#141414] rounded-xl p-1 mb-6 border border-white/5">
          <button onClick={() => setIsLoginView(true)} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${isLoginView ? 'bg-[#D946EF] text-white' : 'text-white/40'}`}>Entrar</button>
          <button onClick={() => setIsLoginView(false)} className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${!isLoginView ? 'bg-[#D946EF] text-white' : 'text-white/40'}`}>Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input type="tel" placeholder="WhatsApp" value={phone} onChange={handlePhoneChange} required className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-[#D946EF] outline-none" />
          </div>

          {!isLoginView && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-[#D946EF] outline-none" />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-[#D946EF] outline-none" />
          </div>

          {errors.auth && <p className="text-red-500 text-[10px] text-center font-bold uppercase">{errors.auth}</p>}

          <button type="submit" disabled={loading} className="w-full bg-[#D946EF] text-white font-black uppercase py-4 rounded-xl shadow-lg active:scale-95 transition-all">
            {loading ? "Processando..." : (isLoginView ? "Entrar" : "Criar Conta")}
          </button>
        </form>
      </div>
    </div>
  );
}
